#!/bin/bash
echo "⚠️ PERINGATAN: Menghapus permanen PortChain Enterprise Stack..."

docker compose down -v

echo "Selesai! Seluruh kontainer, network, dan data (volume) telah dihapus secara permanen dari sistem."
