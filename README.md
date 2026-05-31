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
git clone https://github.com/edjiesa/Blockchainappportchain.git
cd Blockchainappportchain
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

## 🔌 REST API Endpoints

Base URL: `http://localhost:3001`

| Method | Endpoint | Keterangan |
|--------|----------|-----------|
| `GET` | `/api/status` | Status koneksi Fabric & PostgreSQL |
| `GET` | `/api/shipments` | Daftar pengiriman (dari PostgreSQL) |
| `POST` | `/api/shipments` | Buat pengiriman baru |
| `GET` | `/api/customs` | Data bea cukai |
| `PATCH` | `/api/customs/:id` | Update status bea cukai |
| `GET` | `/api/documents` | Daftar dokumen |
| `GET` | `/api/ebl` | Token Electronic Bill of Lading |
| `GET` | `/api/organizations` | Daftar organisasi |
| `GET` | `/api/audit` | Audit log |
| `GET` | `/api/query` | Query langsung ke chaincode Fabric |

---

## 🗄️ Database Schema (PostgreSQL Off-Chain)

```sql
-- Tabel utama off-chain:
organizations       -- Port Authority, Customs, Shipping Lines
users               -- Pengguna sistem
shipments           -- Data pengiriman barang
containers          -- Kontainer per shipment
customs_clearance   -- Proses bea cukai (PIB)
documents           -- Bill of Lading, Invoice, dll.
ebl_tokens          -- Electronic Bill of Lading tokens
audit_logs          -- Log audit setiap transaksi
```

**Koneksi PostgreSQL:**
```
Host:     localhost
Port:     5432
Database: portchain_offchain
User:     portchain
Password: portchain123
```

---

## ⛓️ Blockchain (Hyperledger Fabric)

- **Platform:** IBM Microfab (Hyperledger Fabric v2.0)
- **Channel:** `mychannel`
- **Organisasi:** `org1`
- **Chaincodes:** `portchain-cc`, `customs-cc`, `ebl-cc`
- **Consensus:** Raft

Transaksi yang di-record ke blockchain:
- ✅ Pembuatan Shipment (`CreateShipment`)
- ✅ Update Status Bea Cukai (`UpdateCustomsStatus`)
- ✅ Transfer Electronic BL (`TransferEBL`)
- ✅ Upload Dokumen (`UploadDocument`)
- ✅ Tambah Kontainer (`CreateContainer`)

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