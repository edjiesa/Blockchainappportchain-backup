#!/bin/bash
echo "Menjalankan PortChain Enterprise Stack (Linux/Bash)..."

# Menghentikan kontainer lama tanpa menghapus volume (Persistent Data)
echo "Membersihkan state lama (Data tetap aman)..."
docker-compose down

# Membangun ulang dan menjalankan kontainer
echo "Membangun (build) dan menjalankan kontainer baru..."
docker-compose up -d --build

echo "Selesai! Anda bisa mengecek status dengan 'docker ps'"
