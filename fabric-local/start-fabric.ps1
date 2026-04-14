Write-Host "Memulai Jaringan Hyperledger Fabric Microfab..." -ForegroundColor Green
Write-Host "Menggunakan IBM Microfab agar lebih stabil di Windows..." -ForegroundColor Yellow

$pwd = (Get-Location).Path
cd $pwd

docker-compose up -d

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "JARINGAN FABRIC (MICROFAB) SEGERA BERJALAN!" -ForegroundColor Green
Write-Host "Buka REST API dan Connection Profile di Browser:" -ForegroundColor Yellow
Write-Host "http://localhost:8080/ak/api/v1/components" -ForegroundColor Yellow
Write-Host "=============================================" -ForegroundColor Cyan
