#!/bin/bash

echo "==================================================="
echo "▶️ MENYALAKAN ULANG PORTCHAIN TANPA MENGHAPUS DATA"
echo "==================================================="

# Menyalakan ulang container (jika hilang/mati, akan dibuat ulang TANPA menghapus volume data)
echo "Menghidupkan ulang container Docker (Up)..."
docker compose up -d

echo "Selesai! Seluruh data Blockchain & PostgreSQL Anda aman."
echo "Anda bisa mengecek status dengan 'docker ps'"
