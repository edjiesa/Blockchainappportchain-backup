# Lokal Hyperledger Fabric Environment

Folder ini berisi skrip untuk menjalankan jaringan Hyperledger Fabric lokal dalam satu command menggunakan **MiniFabric**. Tool ini dirancang agar developer dapat langsung fokus membangun aplikasi (seperti Vite) tanpa memusingkan kerumitan konfigurasi sertifikat dan node Fabric secara manual.

## Skrip yang Tersedia

### 1. `start-fabric.ps1`
Skrip ini akan men-download *image* MiniFabric terbaru, lalu melakukan hal berikut secara otomatis:
- Membuat *Orderer node*, *Peer node*, *Certificate Authority (CA)*, dan membuat *channel* default (`mychannel`).
- Menjalankan **CouchDB** sebagai *state database*.
- Meng-install dan meng-instantiate *smart contract* (chaincode) *default* bernama `simple` (atau `samplecc`) secara otomatis. Chaincode ini menyimpan contoh state pasangan key-value dasar.
- Menjalankan **Hyperledger Explorer** agar Anda dapat memonitor *network* secara visual.

**Cara menjalankan (buka PowerShell/Terminal di folder folder fabric-local):**
```powershell
.\start-fabric.ps1
```

### 2. `stop-fabric.ps1`
Skrip ini digunakan saat Anda sudah selesai melakukan testing dan ingin menghapus seluruh *container* serta jaringan Fabric tersebut agar Docker Anda bersih.

**Cara menjalankan:**
```powershell
.\stop-fabric.ps1
```

## Cara Akses Interface Lokal
Setelah menjalankan script `start-fabric.ps1`, biarkan proses di terminal selesai (ini mungkin memakan waktu hingga 1-3 menit untuk *setup* pertama kali karena harus men-download *Docker Image*). Setelah selesai, Anda dapat mengakses URL berikut melalui browser:

- **Hyperledger Explorer:** `http://localhost:8080`
  (Gunakan UI ini untuk melihat jumlah Block, Transactions, Chaincode, Node, dan Channel)
- **CouchDB (Fauxton UI):** `http://localhost:5984/_utils`
  (Gunakan UI ini untuk menelusuri isi data "World State" dari Blockchain Anda dalam bentuk dokumen JSON/NoSQL)

## Konfigurasi Kustom & Sertifikat
Seluruh material kriptografi (Private Keys, Certificates) dan konfigurasi koneksi yang mungkin dibutuhkan oleh Backend Server Aplikasi Anda akan digenerate secara otomatis ke dalam folder `vars/` yang muncul saat script dijalankan. Anda dapat mencari file `.json` (*connection profile*) di dalam folder `vars/profiles` untuk mengkoneksikan backend aplikasi Web Anda dengan Fabric.
