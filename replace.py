import os

files = [
    'backend-go/main.go',
    'backend/fabric-connector.js',
    'fabric-local/deploy-chaincode.sh',
    'fabric-local/docker-compose.yaml',
    'src/app/components/BlockchainExplorer.tsx',
    'CONTEXT.md',
    'README.md',
    'cara-kerja-system.md'
]

for f in files:
    if os.path.exists(f):
        with open(f, 'r', encoding='utf-8') as file:
            content = file.read()
        content = content.replace('mychannel', 'port-channel')
        with open(f, 'w', encoding='utf-8') as file:
            file.write(content)
        print(f"Replaced in {f}")
