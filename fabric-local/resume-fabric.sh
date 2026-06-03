#!/bin/bash

echo "==================================================="
echo "▶️ MENYALAKAN ULANG PORTCHAIN TANPA MENGHAPUS DATA"
echo "==================================================="

# Menyalakan ulang container yang sedang mati/berhenti (tanpa recreate)
echo "Menghidupkan ulang container Docker (Start)..."
docker-compose start

echo "Selesai! Seluruh data Blockchain & PostgreSQL Anda aman."
echo "Anda bisa mengecek status dengan 'docker ps'"
