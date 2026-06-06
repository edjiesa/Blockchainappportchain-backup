#!/bin/bash
echo "Menghentikan sementara PortChain Enterprise Stack..."

docker compose stop

echo "Selesai! Seluruh kontainer telah dimatikan, namun DATA (PostgreSQL & Blockchain) TETAP AMAN."
