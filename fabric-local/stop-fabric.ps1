Write-Host "Menghentikan Jaringan Hyperledger Fabric Microfab..." -ForegroundColor Yellow

$pwd = (Get-Location).Path
cd $pwd

docker-compose down

Write-Host "Jaringan berhasil dihentikan." -ForegroundColor Green
