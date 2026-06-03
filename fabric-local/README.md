# Lokal Hyperledger Fabric Environment (Microfab)

Folder ini berisi konfigurasi **Docker Compose** untuk menjalankan jaringan Hyperledger Fabric lokal menggunakan **IBM Microfab**, PostgreSQL, Golang Middleware, dan React Frontend dalam satu arsitektur terintegrasi.

> **PENTING:** Dokumentasi lama yang menyebutkan "MiniFabric", "Hyperledger Explorer di port 8080", dan "CouchDB di port 5984" sudah **USANG/DEPRECATED**. Arsitektur kita sudah di-upgrade menjadi Enterprise Stack.

## Skrip yang Tersedia

### 1. `resume-fabric.sh` (SANGAT DISARANKAN)
Skrip ini digunakan untuk menyalakan kembali seluruh jaringan (termasuk Blockchain dan PostgreSQL) **tanpa menghapus data**. Gunakan ini setiap kali Anda merestart komputer.
```bash
./resume-fabric.sh
```

### 2. `start-fabric.sh` (Hanya untuk Reset)
Skrip ini akan **mereset ulang** kontainer.

### 3. `deploy-chaincode.sh`
Digunakan untuk mem-package dan men-deploy Smart Contract (`portchain-cc`) ke dalam jaringan Fabric. Hanya perlu dijalankan satu kali saat inisialisasi awal.

## Cara Akses Interface Lokal

Karena kita sudah menggunakan arsitektur aplikasi kustom, pemantauan Blockchain dilakukan langsung dari aplikasi kita sendiri, bukan menggunakan *tool* pihak ketiga:

- **Frontend & Blockchain Explorer Kustom:** `http://localhost:5173`
  (Buka tab **"Blockchain Explorer"** di aplikasi untuk melihat isi Block, Transaksi, dan status Jaringan secara real-time).
- **Backend API:** `http://localhost:3001`
- **Database:** `localhost:5432` (Gunakan DBeaver/PgAdmin)

