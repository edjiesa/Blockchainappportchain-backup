# Panduan Lengkap Cara Kerja Sistem PortChain

Dokumen ini menjelaskan secara detail bagaimana seluruh arsitektur, alur kerja (workflow), dan fitur-fitur di dalam aplikasi **PortChain (Blockchain-based Port Licensing & Permit Management)** berfungsi. Baik dari hal-hal yang sudah Anda ketahui hingga detail teknis di belakang layar yang mungkin belum Anda ketahui.

---

## 🏗️ 1. Arsitektur Sistem (The Big Picture)

Aplikasi ini tidak bekerja seperti aplikasi web biasa (Web2). PortChain adalah aplikasi **Web3 Enterprise** yang menggabungkan kecepatan database relasional dengan keamanan dan transparansi jaringan Blockchain *Hyperledger Fabric*.

Sistem ini terbagi menjadi 4 komponen utama:
1. **Frontend (React + Vite - Port 5173):** Antarmuka pengguna (UI) modern yang Anda lihat. Frontend ini merender Sidebar responsif dan menyesuaikan menu berdasarkan *Role* pengguna yang sedang login.
2. **Middleware API (Golang - Port 3001):** Otak dari aplikasi. Semua aksi dari Frontend (klik tombol, form login, dll) masuk ke sini menggunakan protokol JSON-RPC. Go bertugas memutuskan apakah data harus disimpan ke PostgreSQL, dikirim ke Blockchain, atau keduanya.
3. **Database Off-chain (PostgreSQL - Port 5432):** Menyimpan data yang ukurannya terlalu besar untuk ditaruh di blockchain (seperti file gambar/PDF dokumen) atau data konfidensial yang tidak boleh dilihat organisasi lain (seperti *Password* User).
4. **Fabric Connector & Blockchain (Node.js + IBM Microfab):** Node.js bertugas "berbicara" langsung dengan *Smart Contract* (Chaincode) di jaringan blockchain lokal Anda (Microfab). Blockchain inilah yang menyimpan jejak audit tak terhapuskan (Immutable Ledger).

---

## 🔐 2. Sistem Login dan Manajemen Akses (RBAC)

Fitur ini mengatur siapa yang boleh melihat apa. Jaringan PortChain dimiliki oleh konsorsium multi-organisasi. 

### Apa yang terjadi saat Anda Login?
1. Anda memasukkan email dan password di halaman Login.
2. Frontend mengirim permintaan `LoginUser` ke Backend Golang.
3. **Backend TIDAK mengecek Blockchain**. Backend mengecek tabel `users` di database PostgreSQL. Jika cocok, Anda berhasil masuk.
4. Aplikasi akan mendeteksi Anda berasal dari organisasi mana (misal: `Port Authority`, `Customs`, atau `Banking`).
5. **Sidebar Navigation** akan secara cerdas menyembunyikan menu yang bukan hak Anda. Contoh: Orang Bank hanya bisa melihat menu *e-BL* dan *Blockchain*, mereka tidak bisa melihat data *Customs* atau *Shipments*.

### Bagaimana cara kerjanya jika ada Organisasi baru/User baru?
- Port Authority (sebagai Super Admin) membuka menu **Organizations**.
- Saat menekan **Register New User**, sistem melakukan dua hal secara paralel (bersamaan):
  1. **Di Off-chain:** Membuat *record* akun baru di PostgreSQL agar pengguna tersebut bisa login di Frontend.
  2. **Di On-chain:** Menghubungi *Certificate Authority (CA)* milik organisasi terkait di Hyperledger Fabric untuk menerbitkan Sertifikat Digital (X.509). Ini membuat aktivitas user tersebut di blockchain dianggap *SAH* dan *Legal*.

---

## 🚢 3. Alur Kerja Pengiriman (Shipments & Customs)

Ini adalah *core business logic* dari pelabuhan.

1. **Port Authority Mendaftarkan Kapal (Create Shipment)**
   - Saat kapal tiba, otoritas pelabuhan membuat record *Shipment*.
   - **Behind the scenes:** Backend Go mengambil metadata kapal tersebut dan memasukkannya ke dalam *Smart Contract* Fabric (On-chain). Sebuah `shipment_id` unik dihasilkan oleh Blockchain dan menjadi *Single Source of Truth*.
2. **Bea Cukai (Customs Clearance)**
   - User Bea Cukai (Customs) login dan membuka menu **Customs**.
   - Mereka melihat daftar kontainer dari *Shipment* tersebut.
   - Bea Cukai melakukan inspeksi. Jika lolos, status diubah menjadi `CLEARED`. Jika curiga, status menjadi `HOLD` atau `REJECTED`.
   - **Behind the scenes:** Transaksi ini dikirim langsung ke Blockchain. Setiap perubahan status akan menciptakan "Blok" baru di Ledger. Status tidak ditimpa (*overwrite*), melainkan direkam historinya (*state transitions*). Ini mencegah pihak mana pun memanipulasi riwayat cukai.

---

## 🏦 4. Alur Kerja Perbankan (Trade Finance & Pembayaran)

Organisasi Bank (`bankorg`) memiliki peran krusial dalam rantai pasok pelabuhan, khususnya dalam hal *Trade Finance* (Pembiayaan Perdagangan) seperti pencairan *Letter of Credit* (L/C).

1. **Visibilitas Terbatas (Privacy by Design)**
   - Berbeda dengan Port Authority atau Customs, Bank **tidak bisa** melihat seluruh data operasional pelabuhan (seperti daftar kontainer fisik atau detail dokumen manifest). Ini diatur melalui sistem otorisasi *Channel* dan *RBAC* di Hyperledger Fabric untuk menjaga kerahasiaan bisnis.
2. **Menerima e-BL (Electronic Bill of Lading)**
   - Peran utama Bank adalah pada menu **e-BL**.
   - Ketika barang sudah diproses dan akan dikirim/diterima, kepemilikan dokumen pengiriman elektronik (e-BL) ditransfer dari Otoritas Pelabuhan/Shipping Line ke organisasi Bank.
3. **Pencairan Dana (Settlement)**
   - User Bank login dan memverifikasi bahwa token e-BL tersebut 100% asli dan tercatat di Blockchain tanpa manipulasi.
   - Setelah yakin aset digital tersebut berada di *wallet* (kendali) Bank, Bank dapat memberikan persetujuan pencairan dana kepada pihak penjual (Eksportir).
   - Seluruh proses transfer aset e-BL ini dicatat abadi di dalam Blockchain, sehingga menghilangkan risiko B/L ganda (*Double-spending*) atau B/L palsu.

---

## 📄 5. Manajemen Dokumen Cerdas (Hybrid Storage)

Bagaimana cara sistem menyimpan file PDF Manifest atau Foto Kontainer ke dalam Blockchain? Jawabannya: **Tidak Ditaruh di Blockchain.**

Blockchain sangat mahal dan lambat jika digunakan untuk menyimpan file besar. Oleh karena itu, PortChain menggunakan metode **Hybrid Off-chain/On-chain**:
1. User mengunggah Dokumen PDF.
2. File PDF fisik disimpan di sistem penyimpanan lokal / AWS S3 / Database PostgreSQL.
3. Backend Go mengkalkulasi **Cryptographic Hash (SHA-256)** dari file tersebut. Hash ini adalah sidik jari unik file (misal: `a1b2c3d4...`).
4. Hanya **Hash, Nama File, dan ID Pengunggah** yang dicatat secara permanen di Blockchain.
5. **Keuntungan:** Jika ada pihak yang iseng memanipulasi isi file PDF secara diam-diam, maka sistem akan mendeteksi bahwa *Hash* file yang diubah tidak lagi cocok dengan *Hash* yang terkunci abadi di Blockchain. Dokumen tersebut akan langsung dilabeli "INVALID / TAMPERED".

---

## 🪙 6. E-BL (Electronic Bill of Lading) / Tokenisasi

Ini adalah fitur finansial tingkat lanjut (Sistem yang mungkin belum Anda sadari seutuhnya).

B/L (Bill of Lading) adalah surat berharga. Jika pelabuhan menggunakan kertas, sangat mudah dipalsukan. Di PortChain, B/L diubah menjadi aset digital (*Token/NFT*) menggunakan *Smart Contract*.

**Cara Kerjanya:**
1. e-BL dicetak (Mint) secara digital di blockchain untuk sebuah *Shipment*.
2. e-BL memiliki kepemilikan (*Ownership*), misalnya saat ini dimiliki oleh *Port Authority*.
3. Saat kargo selesai dan tagihan harus dibayar, e-BL bisa di-**Transfer** kepemilikannya ke organisasi **Bank**.
4. Bank melihat bahwa e-BL tersebut sekarang ada di bawah kendalinya (di *Wallet* organisasi mereka). Bank kemudian bisa melepaskan dana Letter of Credit (L/C) kepada penjual.
5. Proses ini menghilangkan perantara fisik, tidak bisa digandakan (Double-spending prevention dari Blockchain), dan terjadi dalam hitungan detik.

---

## 🕵️ 7. Explorer & Audit Trail (Membuktikan Kebenaran Data)

Semua menu di atas berujung pada satu fitur pamungkas: **Audit Trail** dan **Blockchain Explorer**.

* "Bisa saja kan admin database (DBA) meretas PostgreSQL dan mengubah status Bea Cukai dari HOLD menjadi CLEARED untuk menyelundupkan barang?"

Di Web2 konvensional, **BISA**.
Di PortChain (Web3), **TIDAK BISA**.

**Cara kerja Audit Trail:**
1. Saat Anda membuka halaman Audit, Frontend akan melakukan kueri ke *Ledger* IBM Microfab.
2. Sistem akan membandingkan data yang ada di *database SQL* dengan data historis yang terkunci di dalam rantai blok (*Blockchain*).
3. Jika ada satu titik pun data SQL yang diubah tanpa melalui konsensus antar 3 organisasi (Port, Customs, Bank), maka aplikasi akan langsung mendeteksi diskrepansi (ketidakcocokan) dan menandai integritas data sebagai *Corrupted*.
4. *Audit Trail* tidak bisa dihapus. Bahkan Super Admin (Port Authority) yang membuat jaringan sekalipun **TIDAK BISA** menghapus riwayat bahwa sebuah kontainer pernah ditolak oleh Bea Cukai. Semua pihak (*Peers*) memiliki salinan buku besar (*Ledger*) yang identik.

---

## 🛠️ Ringkasan: Kenapa Desain Ini Digunakan?

Desain sistem ini (*React -> Go Middleware -> PostgreSQL + Fabric Node.js Connector*) menjamin:
- **Kecepatan UI:** Data untuk tampilan *dashboard* dibaca cepat dari PostgreSQL (Cache/Off-chain).
- **Kepercayaan Tanpa Batas (Trustless):** Fakta kebenaran operasional pelabuhan dijaga oleh jaringan *Hyperledger Fabric* yang tak bisa diubah oleh satu pihak secara sepihak.
- **Skalabilitas:** Jika ada entitas pelabuhan baru (misalnya *Shipping Line* atau *Logistics Company*), administrator tinggal menambahkan organiasi baru di Fabric tanpa merombak ulang seluruh kode.
