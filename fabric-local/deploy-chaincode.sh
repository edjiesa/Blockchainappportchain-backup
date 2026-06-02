#!/bin/bash
set -e

echo "1. Membungkus (Packaging) chaincode..."
docker exec microfab peer lifecycle chaincode package /tmp/portchain-cc.tar.gz --path /chaincode --lang node --label portchain-cc_1.4

for ORG in portorg customsorg bankorg; do
  echo "2. Meng-install chaincode di node ${ORG}..."
  docker exec -e CORE_PEER_LOCALMSPID=${ORG}MSP \
              -e CORE_PEER_ADDRESS=${ORG}peer-api.127-0-0-1.nip.io:8080 \
              -e CORE_PEER_MSPCONFIGPATH=/opt/microfab/data/admin-${ORG} \
              microfab peer lifecycle chaincode install /tmp/portchain-cc.tar.gz || true
done

echo "3. Mengambil Package ID..."
PKG_ID=$(docker exec -e CORE_PEER_LOCALMSPID=portorgMSP -e CORE_PEER_ADDRESS=portorgpeer-api.127-0-0-1.nip.io:8080 -e CORE_PEER_MSPCONFIGPATH=/opt/microfab/data/admin-portorg microfab peer lifecycle chaincode queryinstalled | grep portchain-cc_1.4 | awk '{print $3}' | tr -d ',')
echo "Package ID adalah: $PKG_ID"

if [ -z "$PKG_ID" ]; then
  echo "Gagal mendapatkan Package ID!"
  exit 1
fi

for ORG in portorg customsorg bankorg; do
  echo "4. Menyetujui (Approve) chaincode untuk organisasi ${ORG}..."
  docker exec -e CORE_PEER_LOCALMSPID=${ORG}MSP \
              -e CORE_PEER_ADDRESS=${ORG}peer-api.127-0-0-1.nip.io:8080 \
              -e CORE_PEER_MSPCONFIGPATH=/opt/microfab/data/admin-${ORG} \
              microfab peer lifecycle chaincode approveformyorg -o orderer-api.127-0-0-1.nip.io:8080 --channelID mychannel --name portchain-cc --version 1.0.5 --package-id $PKG_ID --sequence 5 || true
done

echo "5. Melakukan Commit chaincode ke channel (Hanya perlu sekali)..."
docker exec -e CORE_PEER_LOCALMSPID=portorgMSP \
            -e CORE_PEER_ADDRESS=portorgpeer-api.127-0-0-1.nip.io:8080 \
            -e CORE_PEER_MSPCONFIGPATH=/opt/microfab/data/admin-portorg \
            microfab peer lifecycle chaincode commit -o orderer-api.127-0-0-1.nip.io:8080 --channelID mychannel --name portchain-cc --version 1.0.5 --sequence 5 --peerAddresses portorgpeer-api.127-0-0-1.nip.io:8080 --peerAddresses customsorgpeer-api.127-0-0-1.nip.io:8080 --peerAddresses bankorgpeer-api.127-0-0-1.nip.io:8080

echo "6. Inisialisasi awal (jika diperlukan)..."
# Tidak ada fungsi Init khusus di smart contract kita, jadi bisa dilewati.

echo "================================================="
echo "✅ DEPLOYMENT CHAINCODE PORTCHAIN-CC BERHASIL! ✅"
echo "================================================="
