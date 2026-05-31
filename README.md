# ⚓ PortChain — Enterprise Blockchain Port System

> Sistem perizinan pelabuhan berarsitektur Enterprise berbasis **Hyperledger Fabric Multi-Org (Port, Customs, Bank)** dengan penyimpanan off-chain **PostgreSQL (pgAudit & AES-256)**, **Go (Golang) Middleware (JSON-RPC)**, integrasi **External Bank Tier**, dan frontend **React + Vite**.

![Hyperledger Fabric](https://img.shields.io/badge/Hyperledger%20Fabric-MultiOrg-blue?logo=hyperledger)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql&logoColor=white)
![Go](https://img.shields.io/badge/Go-1.22-00ADD8?logo=go&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)

---

## 🏗️ Arsitektur Sistem (Deployment Diagram)

```
┌─────────────────────────────────────────────────────────┐
│                     Client Side                         │
│                                                         │
│  Browser/Scanner/HW Wallet → http://localhost:5173      │
│         ↓ JSON-RPC (HTTPS / TLS 1.3)                    │
│  ┌──────────────────────────────────────────────────┐   │
│  │         Application Server (Docker)              │   │
│  │                                                  │   │
│  │  ┌─────────────┐    ┌──────────────────────┐    │   │
│  │  │   microfab  │←───│   fabric-backend-go  │←───┤   │
│  │  │ (3 Orgs,    │    │  (Go API Gateway &   │    │   │
│  │  │  Raft)      │    │   Logic Layer)       │    │   │
│  │  └─────────────┘    └──────────┬───────────┘    │   │
│  │                                │ pg_notify      │   │
│  │  ┌─────────────┐    ┌──────────▼───────────┐    │   │
│  │  │external-bank│←───│   portchain-db       │    │   │
│  │  │ (Mock Tier) │    │ (PostgreSQL 16       │    │   │
│  │  │             │    │  w/ pgcrypto AES-256)│    │   │
│  │  └─────────────┘    └──────────────────────┘    │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Komponen Utama

| Node | Teknologi | Keterangan Fungsional |
|---------|-----------|--------|
| `Client Side` | React + WebUSB | Antarmuka pengguna (Dashboard, Scanner Tools, HW Wallet). |
| `microfab` | IBM Microfab | Permissioned Blockchain Network (Port, Customs, Bank Org). |
| `fabric-backend-go` | Go 1.22 | Middleware (API Gateway, Logic Layer, Go Listener/pgAudit). |
| `portchain-db` | PostgreSQL 16 | Off-chain data & Audit Logs terpusat, dengan fungsi Enkripsi. |
| `external-bank` | Node.js (Mock) | Sistem Eksternal pihak ke-3 untuk mengeksekusi Payment Contract. |

---

## 🚀 Cara Menjalankan

### Prasyarat

- ✅ **Docker Desktop** — sudah terinstall dan berjalan
- ✅ **Git** — untuk clone repository
- ❌ Node.js lokal **TIDAK DIPERLUKAN** — semua berjalan di dalam Docker

### 1. Clone Repository

```bash
git clone https://github.com/edjiesa/RESPONSI-BLOCKCHAIN.git
cd RESPONSI-BLOCKCHAIN
```

### 2. Jalankan Seluruh Stack (1 Perintah)

```powershell
cd fabric-local
.\start-fabric.ps1
```

Atau langsung dengan Docker Compose:

```powershell
cd fabric-local
docker-compose up -d --build
```

> ⚠️ **Catatan Penting:** Karena ini adalah arsitektur baru (Go Backend & 3-Org Fabric), Anda diwajibkan menggunakan `--build` untuk mengkompilasi Go binary dan me-reset kontainer lama.

> ⏳ **Pertama kali** butuh waktu **5-10 menit** untuk download image dan install dependencies.
> Selanjutnya hanya perlu **30-60 detik**.

### 3. Tunggu Semua Container Siap

```powershell
docker ps
```

Semua harus berstatus `Up` atau `healthy`:

```
NAMES            STATUS                    PORTS
fabric-backend   Up X minutes
microfab         Up X minutes              0.0.0.0:3001->3001, 0.0.0.0:8080->8080
react-frontend   Up X minutes              0.0.0.0:5173->5173
portchain-db     Up X minutes (healthy)    0.0.0.0:5432->5432
```

### 4. Buka Aplikasi

| URL | Keterangan |
|-----|-----------|
| 🌐 **[http://localhost:5173](http://localhost:5173)** | Aplikasi Frontend Utama |
| 🔗 **[http://localhost:3001/api/status](http://localhost:3001/api/status)** | Status Koneksi Backend |
| ⛓️ **[http://localhost:8080/ak/api/v1/components](http://localhost:8080/ak/api/v1/components)** | Microfab API Explorer |

### 5. Hentikan Sistem

```powershell
cd fabric-local
.\stop-fabric.ps1
```

---

## 📁 Struktur Proyek

```
Blockchainappportchain/
│
├── 📂 fabric-local/              # Konfigurasi Docker & Blockchain
│   ├── docker-compose.yaml       # Orkestrasi 4 layanan
│   ├── start-fabric.ps1          # Script startup (Windows PowerShell)
│   ├── stop-fabric.ps1           # Script shutdown
│   └── README.md                 # Dokumentasi teknis jaringan
│
├── 📂 backend-go/                # Go (Golang) Middleware
│   ├── main.go                   # API Gateway (JSON-RPC) & Go Listener (pgAudit)
│   ├── go.mod                    # Dependencies
│   └── Dockerfile                # Build instruksi Go
│
├── 📂 external-bank/             # External Tier (Sistem Eksternal Bank)
│   ├── server.js                 # Layanan verifikasi Bank mock
│   └── package.json              
│
├── 📂 backend/db/                # Database Server (PostgreSQL)
│   └── init.sql                  # Schema, pgcrypto, dan Triggers
│
├── 📂 chaincode/                 # Smart Contracts
│   └── payment-contract/         # Logika pembayaran via Banking Org
│
└── 📂 src/                       # Client Side (React)
    ├── app/
    │   ├── components/           
    │   │   ├── ScannerTools.tsx       # Antarmuka Scanner OCR & QR
    │   │   ├── HardwareWallet.tsx     # Otorisasi USB/Bluetooth
    │   │   ├── Dashboard.tsx
    │   │   └── BlockchainExplorer.tsx # Mini Explorer
    │   └── routes.tsx            
    └── main.tsx
```

---

## 🔌 API Endpoints (Go JSON-RPC)

Base URL: `http://localhost:3001/rpc`

Arsitektur baru menggunakan protokol **JSON-RPC** via HTTPS POST.
Semua 73 Fungsi *Smart Contract* dapat dipanggil dengan method JSON-RPC yang sesuai, misalnya:
- `"method": "CreateShipment"`
- `"method": "UploadDocument"`
- `"method": "RecordAuditLog"`

*(Sistem ini telah dimigrasi dari REST Node.js menjadi Go JSON-RPC untuk menjamin performa tinggi dan kompatibilitas Enterprise).*

---

## 🗄️ Database Schema (14 Entitas PostgreSQL Off-Chain)

Skema database telah diperbarui penuh mendukung **Enkripsi AES-256 (pgcrypto)** dan **pgAudit Simulation (Trigger)**.

Terdapat **14 Entitas Inti**:
1. `organizations`
2. `users`
3. `shipments`
4. `containers`
5. `documents`
6. `document_files`
7. `document_hashes`
8. `blockchain_transactions`
9. `audit_logs`
10. `customs_clearance`
11. `container_status_logs`
12. `certificates`
13. `ebl_tokens`
14. `ebl_transfers`

> 💡 *Silakan lihat file [ERD.md](ERD.md) di repositori ini untuk diagram visual relasi antar-entitasnya.*

**Koneksi PostgreSQL:**
```
Host:     localhost
Port:     5432
Database: portchain_offchain
User:     portchain
Password: portchain123
```

---

## ⛓️ Blockchain (Hyperledger Fabric Multi-Org)

- **Platform:** IBM Microfab (Dikonfigurasi kustom untuk simulasi Multi-Org)
- **Channel:** `mychannel`
- **Organisasi (3 Org):** `portorg` (Port Authority), `customsorg` (Customs), `bankorg` (Banking)
- **Chaincode:** `portchain-cc` (Monolithic Smart Contract)
- **Consensus:** Raft

### 🚀 73 Fungsi Smart Contract
Sistem ini memuat **73 Fungsi Transaksi Blockchain** mutakhir yang diorganisir ke dalam 15 Kategori:
1. **Organization & User** (9 Fungsi)
2. **Shipment** (6 Fungsi)
3. **Container** (5 Fungsi)
4. **Document** (5 Fungsi)
5. **Document File & Hash** (6 Fungsi - Immutability)
6. **Customs Clearance** (6 Fungsi)
7. **Certificate** (5 Fungsi)
8. **Container Status Log** (3 Fungsi)
9. **Audit Log** (4 Fungsi - Core)
10. **Blockchain Transaction** (4 Fungsi)
11. **EBL Token** (5 Fungsi)
12. **EBL Transfer** (2 Fungsi)
13. **Integration (Off-Chain On-Chain)** (4 Fungsi)
14. **Verification (End-to-End)** (5 Fungsi)
15. **Access Control** (4 Fungsi)

---

## 🖥️ Fitur Aplikasi

| Halaman | Fitur |
|---------|-------|
| **Dashboard** | Statistik real-time, grafik tren, status Fabric |
| **Shipments** | Daftar & manajemen pengiriman, filter & pencarian |
| **Customs** | Proses bea cukai PIB, approval workflow |
| **Documents** | Bill of Lading, Invoice, Packing List |
| **e-BL** | Electronic Bill of Lading token management |
| **Organizations** | Daftar Port Authority, Shipping Lines |
| **Blockchain Explorer** | 🆕 **Real-Time Mini Explorer** menarik data block & transaksi langsung dari Ledger Fabric menggunakan `qscc` |
| **Audit Trail** | Log lengkap semua aktivitas sistem |

---

## 🧰 Tech Stack

**Backend:**
- Node.js 20 + Express 4
- `fabric-network` v2.2 — Hyperledger Fabric SDK
- `pg` v8 — PostgreSQL driver
- `axios` — HTTP client untuk Microfab API

**Frontend:**
- React 18 + TypeScript
- Vite 6 — dev server dengan Hot Module Replacement
- Tailwind CSS + Radix UI
- Recharts — visualisasi data
- React Router v7

**Infrastructure:**
- Docker Desktop (Windows)
- Docker Compose v2
- IBM Microfab — lightweight Fabric network
- PostgreSQL 16 Alpine

---

## 📝 Lisensi

MIT License — © 2026 PortChain Team