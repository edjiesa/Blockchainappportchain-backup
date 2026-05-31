#!/bin/bash
echo "Menjalankan PortChain Enterprise Stack (Linux/Bash)..."

# Menghentikan kontainer lama dan menghapus volume
echo "Membersihkan state lama..."
docker-compose down -v

# Membangun ulang dan menjalankan kontainer
echo "Membangun (build) dan menjalankan kontainer baru..."
docker-compose up -d --build

echo "Selesai! Anda bisa mengecek status dengan 'docker ps'"
