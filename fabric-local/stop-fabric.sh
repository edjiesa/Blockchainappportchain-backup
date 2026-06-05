#!/bin/bash
echo "Menghentikan PortChain Enterprise Stack..."

docker compose down -v

echo "Selesai! Seluruh kontainer, network, dan data (volume) telah dihapus secara permanen."
