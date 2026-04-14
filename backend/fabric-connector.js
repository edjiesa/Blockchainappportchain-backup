const axios = require('axios');
const { Wallets, Gateway } = require('fabric-network');

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

            const adminIdentity = identities.find(id => id.id.includes('org1admin'));
            
            if (!adminIdentity) {
                 throw new Error("Identity untuk org1admin tidak ditemukan.");
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
            // Catatan: Microfab secara default menggunakan channel 'mychannel'
            this.network = await this.gateway.getNetwork('mychannel');
            console.log("Berhasil tergabung dengan channel: mychannel");

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
                "mychannel": {
                    "orderers": [],
                    "peers": {}
                }
            }
        };

        const peers = components.filter(c => c.type === 'peer');
        const orderers = components.filter(c => c.type === 'orderer');
        
        let orgMsp = null;

        // Memetakan Peers
        peers.forEach(peer => {
            const peerUrl = peer.api_url;
            ccp.peers[peer.id] = {
                "url": peerUrl,
                "tlsCACerts": {
                    "pem": Buffer.from(peer.pem, 'base64').toString('utf8')
                },
                "grpcOptions": {
                    "ssl-target-name-override": new URL(peer.api_url).hostname,
                    "hostnameOverride": new URL(peer.api_url).hostname
                }
            };
            
            // Masukkan ke mychannel
            ccp.channels.mychannel.peers[peer.id] = {
                "endorsingPeer": true,
                "chaincodeQuery": true,
                "ledgerQuery": true,
                "eventSource": true
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
             ccp.client.organization = orgMsp;
        }

        // Memetakan Orderers
        orderers.forEach(orderer => {
            const ordererUrl = orderer.api_url;
            ccp.orderers[orderer.id] = {
                "url": ordererUrl,
                "tlsCACerts": {
                    "pem": Buffer.from(orderer.pem, 'base64').toString('utf8')
                },
                "grpcOptions": {
                    "ssl-target-name-override": new URL(orderer.api_url).hostname,
                    "hostnameOverride": new URL(orderer.api_url).hostname
                }
            };
            
            // Masukkan ke mychannel
            ccp.channels.mychannel.orderers.push(orderer.id);
        });

        return ccp;
    }

    getNetwork() {
        return this.network;
    }
}

module.exports = new FabricConnector();
