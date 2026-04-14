# ⚓ PortChain — Blockchain Port Licensing System

> Sistem perizinan pelabuhan berbasis **Hyperledger Fabric** dengan penyimpanan off-chain **PostgreSQL**, backend **Node.js Express**, dan frontend **React + Vite**.

![Hyperledger Fabric](https://img.shields.io/badge/Hyperledger%20Fabric-2.0-blue?logo=hyperledger)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)

---

## 🏗️ Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────┐
│                     Windows Host                        │
│                                                         │
│  Browser → http://localhost:5173 (React + Vite)         │
│         → http://localhost:3001  (Backend REST API)     │
│         → http://localhost:8080  (Microfab Dashboard)   │
│         → localhost:5432         (PostgreSQL)           │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │               Docker Compose Stack               │   │
│  │                                                  │   │
│  │  ┌─────────────┐    ┌──────────────────────┐    │   │
│  │  │   microfab  │←───│   fabric-backend     │    │   │
│  │  │ (Fabric Node│    │  (Node.js Express    │    │   │
│  │  │  port 8080) │    │   port 3001)         │    │   │
│  │  └─────────────┘    └──────────┬───────────┘    │   │
│  │                                │                  │   │
│  │  ┌─────────────┐    ┌──────────▼───────────┐    │   │
│  │  │react-frontend│   │   portchain-db       │    │   │
│  │  │ (Vite HMR   │   │ (PostgreSQL 16        │    │   │
│  │  │  port 5173) │   │  port 5432)           │    │   │
│  │  └─────────────┘    └──────────────────────┘    │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Komponen Utama

| Layanan | Teknologi | Port | Fungsi |
|---------|-----------|------|--------|
| `microfab` | IBM Microfab (Hyperledger Fabric v2.0) | 8080, 3001 | Blockchain Node — menyimpan transaksi immutable |
| `fabric-backend` | Node.js 20 + Express | 3001 | REST API — jembatan antara frontend & blockchain/DB |
| `portchain-db` | PostgreSQL 16 | 5432 | Off-chain DB — data operasional & historis |
| `react-frontend` | React 18 + Vite 6 | 5173 | UI Dashboard — visualisasi data port |

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
├── 📂 backend/                   # Node.js API Server
│   ├── server.js                 # Express server + 8 REST endpoints
│   ├── fabric-connector.js       # Koneksi ke Hyperledger Fabric Gateway
│   ├── package.json              # Dependencies (express, pg, fabric-network)
│   ├── Dockerfile                # Container image backend
│   └── db/
│       ├── init.sql              # Schema PostgreSQL + seed data
│       └── db.js                 # PostgreSQL connection pool
│
└── 📂 src/                       # React Frontend (Vite)
    ├── app/
    │   ├── components/           # Halaman-halaman UI
    │   │   ├── Dashboard.tsx
    │   │   ├── Shipments.tsx
    │   │   ├── CustomsClearance.tsx
    │   │   ├── Documents.tsx
    │   │   ├── EBLManagement.tsx
    │   │   ├── Organizations.tsx
    │   │   ├── BlockchainExplorer.tsx
    │   │   └── AuditTrail.tsx
    │   ├── data/portData.ts      # Mock data & tipe data
    │   └── routes.tsx            # React Router konfigurasi
    └── main.tsx                  # Entry point aplikasi
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
| **Blockchain Explorer** | Jelajahi transaksi Fabric, status koneksi live |
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