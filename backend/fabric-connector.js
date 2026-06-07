const axios = require('axios');
const { Wallets, Gateway } = require('fabric-network');
const { BlockDecoder } = require('fabric-common');

const MICROFAB_URL = process.env.MICROFAB_URL || 'http://localhost:8080';

class FabricConnector {
    constructor() {
        this.gateway = new Gateway();
        this.network = null;
        this.contract = null;
        this.identityLabel = null;
    }

    async init() {
        try {
            console.log(`Mengambil profil konfigurasi dari Microfab (${MICROFAB_URL})...`);
            
            // 1. Dapatkan komponen dari Microfab
            const response = await axios.get(`${MICROFAB_URL}/ak/api/v1/components`);
            const components = response.data;

            // 2. Format ulang komponen menjadi bentuk Connection Profile yang valid
            const ccp = this.buildConnectionProfile(components);
            
            // 3. Ambil identitas (Wallet) untuk organization yang ada (misal: org1)
            const wallet = await Wallets.newInMemoryWallet();
            
            // Kita cari identity dari components (identities biasanya ada dalam array components)
            const identities = components.filter(c => c.type === 'identity');
            if (identities.length === 0) {
                throw new Error("Tidak menemukan Identity (Sertifikat Kriptografi) di Microfab!");
            }

            const adminIdentity = identities.find(id => id.id.includes('portorgadmin'));
            
            if (!adminIdentity) {
                 throw new Error("Identity untuk portorgadmin tidak ditemukan.");
            }

            // Masukkan sertifikat ke dalam wallet lokal di memory
            const x509Identity = {
                credentials: {
                    certificate: Buffer.from(adminIdentity.cert, 'base64').toString('utf8'),
                    privateKey: Buffer.from(adminIdentity.private_key, 'base64').toString('utf8'),
                },
                mspId: adminIdentity.msp_id,
                type: 'X.509',
            };
            
            this.identityLabel = adminIdentity.id;
            await wallet.put(this.identityLabel, x509Identity);
            console.log(`Sertifikat berhasil dimuat untuk: ${this.identityLabel}`);

            // 4. Buka Koneksi ke Fabric Gateway
            console.log("Melakukan koneksi ke gateway...");
            await this.gateway.connect(ccp, {
                wallet,
                identity: this.identityLabel,
                discovery: { enabled: false, asLocalhost: false }
            });

            console.log("Koneksi Gateway Berhasil!");
            
            // 5. Sambung ke Channel dan Chaincode Server
            // Catatan: Microfab secara default menggunakan channel 'port-channel'
            this.network = await this.gateway.getNetwork('port-channel');
            console.log("Berhasil tergabung dengan channel: port-channel");

        } catch (error) {
            console.error("Gagal melakukan inisialisasi koneksi Fabric:", error);
            throw error;
        }
    }

    // Helper untuk mengubah array components dari REST API Microfab menjadi standar JSON Connection Profile
    buildConnectionProfile(components) {
        const ccp = {
            "name": "microfab-network",
            "version": "1.0.0",
            "client": {
                "organization": "org1MSP",
                "connection": {
                    "timeout": {
                        "peer": { "endorser": "300" },
                        "orderer": "300"
                    }
                }
            },
            "organizations": {},
            "peers": {},
            "orderers": {},
            "certificateAuthorities": {},
            "channels": {
                "port-channel": {
                    "orderers": [],
                    "peers": {}
                }
            }
        };

        const peers = components.filter(c => c.type === 'fabric-peer');
        const orderers = components.filter(c => c.type === 'fabric-orderer');
        
        let orgMsp = null;

        // Memetakan Peers
        peers.forEach(peer => {
            const peerUrl = peer.api_url;
            ccp.peers[peer.id] = {
                "url": peerUrl,
                "grpcOptions": peer.api_options
            };
            
            // Masukkan ke port-channel
            ccp.channels["port-channel"].peers[peer.id] = {
                "endorsingPeer": true,
                "chaincodeQuery": true,
                "ledgerQuery": true,
                "eventSource": true,
                "discover": true
            };
            
            // Setup Org otomatis
            if (!ccp.organizations[peer.msp_id]) {
                ccp.organizations[peer.msp_id] = {
                    "mspid": peer.msp_id,
                    "peers": [peer.id]
                };
                orgMsp = peer.msp_id;
            } else {
                ccp.organizations[peer.msp_id].peers.push(peer.id);
            }
        });
        
        if (orgMsp) {
             ccp.client.organization = "portorgMSP";
        }

        // Memetakan Orderers
        orderers.forEach(orderer => {
            const ordererUrl = orderer.api_url;
            ccp.orderers[orderer.id] = {
                "url": ordererUrl,
                "grpcOptions": orderer.api_options
            };
            
            // Masukkan ke port-channel
            ccp.channels["port-channel"].orderers.push(orderer.id);
        });

        // Log ccp for debugging
        require('fs').writeFileSync('/app/ccp_debug.json', JSON.stringify(ccp, null, 2));

        return ccp;
    }

    getNetwork() {
        return this.network;
    }

    async getBlockchainInfo() {
        if (!this.network) throw new Error("Gateway belum siap");
        const contract = this.network.getContract('qscc');
        const infoBytes = await contract.evaluateTransaction('GetChainInfo', 'port-channel');
        
        // decodeChaincodeQueryResponse is needed for protobuf
        // But for common.BlockchainInfo, we can use fabric-common's protobuf decode if needed.
        // Let's use a standard block extraction instead to get the height
        const blockBytes = await contract.evaluateTransaction('GetBlockByNumber', 'port-channel', '0');
        const block = BlockDecoder.decode(blockBytes);
        // Getting height from infoBytes is complex without protobuf, so we'll do a simpler workaround for height if needed, 
        // OR we can just use the audit_logs to count transactions.
        // Wait! Let's return raw infoBytes and see if we can parse it manually.
        // Actually, BlockchainInfo has height at offset 0-8 as a varint.
        return infoBytes;
    }

    async getLatestBlocks(limit = 15) {
        if (!this.network) throw new Error("Gateway belum siap");
        const contract = this.network.getContract('qscc');
        
        // Dapatkan info blockchain
        const infoBytes = await contract.evaluateTransaction('GetChainInfo', 'port-channel');
        
        // Fabric common.BlockchainInfo format:
        // uint64 height = 1;
        // bytes currentBlockHash = 2;
        // bytes previousBlockHash = 3;
        // Kita bisa extract height secara manual karena varint (protoc).
        // Tapi cara paling aman di Node tanpa protobuf = parse varint.
        let height = 0;
        let shift = 0;
        let index = 0;
        // Skip field tag for height (0x08)
        if (infoBytes[index] === 0x08) {
            index++;
            while (true) {
                let byte = infoBytes[index++];
                height |= (byte & 0x7F) << shift;
                if ((byte & 0x80) === 0) break;
                shift += 7;
            }
        } else {
            // Default safe fallback jika varint parsing gagal: ambil 50 block terakhir (tergantung limit)
            height = 100; // Fake height if parse fails
        }

        const blocks = [];
        let startBlock = height - 1;
        if (startBlock < 0) startBlock = 0;
        let endBlock = Math.max(0, startBlock - limit + 1);

        // Ambil block satu per satu mundur
        for (let i = startBlock; i >= endBlock; i--) {
            try {
                const blockBytes = await contract.evaluateTransaction('GetBlockByNumber', 'port-channel', String(i));
                const block = BlockDecoder.decode(blockBytes);
                
                // Parse transaksi dalam block
                if (block.data && block.data.data) {
                    for (const tx of block.data.data) {
                        const payload = tx.payload;
                        const channelHeader = payload.header.channel_header;
                        
                        // Hanya ambil transaksi ENDORSER_TRANSACTION (tipe 3)
                        if (channelHeader.type === 3) {
                            const txId = channelHeader.tx_id;
                            const timestamp = new Date(channelHeader.timestamp).toISOString();
                            const channelName = channelHeader.channel_id;
                            
                            // Ekstrak nama chaincode dan function jika ada
                            let chaincodeName = 'unknown';
                            let functionName = 'unknown';
                            
                            try {
                                const actionPayload = payload.data.actions[0].payload;
                                const chaincodeSpec = actionPayload.chaincode_proposal_payload.input.chaincode_spec;
                                chaincodeName = chaincodeSpec.chaincode_id.name;
                                
                                const args = chaincodeSpec.input.args;
                                if (args && args.length > 0) {
                                    functionName = Buffer.from(args[0]).toString('utf8');
                                }
                            } catch (e) {}

                            blocks.push({
                                tx_id: txId,
                                block_number: i,
                                chaincode_name: chaincodeName,
                                function_name: functionName,
                                channel_name: channelName,
                                validation_status: 'VALID',
                                timestamp: timestamp
                            });
                        }
                    }
                }
            } catch (err) {
                console.error(`Gagal decode block ${i}:`, err.message);
                // Teruskan loop ke block berikutnya jika block ini tidak bisa dibaca
                if (err.message.includes('not found') || err.message.includes('overflow')) {
                    // Berarti kita sudah melebihi height aktual
                    if (blocks.length === 0) {
                       // Lakukan brute-force mundur dari block 50 jika height varint parsing salah
                       if (i > 50) i = 50; 
                    }
                }
            }
        }
        
        return blocks;
    }
}

module.exports = new FabricConnector();
