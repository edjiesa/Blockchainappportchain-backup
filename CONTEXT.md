# CONTEXT.md — PortChain Project Context File
# Baca file ini di awal setiap thread baru sebelum mulai coding!

## 📌 Identitas Proyek

- **Nama:** PortChain — Blockchain Port Licensing System
- **Repository:** https://github.com/edjiesa/Blockchainappportchain
- **Local Path:** `c:\DATA\GITHUB\Blockchainappportchain\`
- **OS:** Windows (PowerShell)
- **Branch aktif:** `main`

---

## 🏗️ Arsitektur Sistem (4 Container Docker)

Semua layanan dijalankan dengan **Docker Compose** — tidak perlu Node.js lokal.

```
docker-compose.yaml → fabric-local/docker-compose.yaml
```

| Container | Image | Port Expose | Network |
|---|---|---|---|
| `microfab` | `ibmcom/ibp-microfab:latest` | 8080 (Fabric API), 3001 (Backend) | fabric-local_default |
| `fabric-backend-go` | Custom (Golang 1.22) | - (shared dgn microfab) | `network_mode: service:microfab` |
| `fabric-connector` | Custom (Node.js 20) | - (shared dgn microfab) | `network_mode: service:microfab` |
| `external-bank-mock` | Custom (Node.js 20) | - (shared dgn microfab) | `network_mode: service:microfab` |
| `portchain-db` | `postgres:16-alpine` | 5432 | fabric-local_default |
| `react-frontend` | `node:20-alpine` | 5173 | fabric-local_default |

### ⚠️ PENTING — Networking Quirks

1. **Backend menggunakan `network_mode: "service:microfab"`** — artinya backend dan microfab berbagi network stack yang sama (localhost). Karena itu backend connect ke Microfab via `http://127.0.0.1:8080` (bukan `http://microfab:8080`).

2. **Node.js 18+ default ke IPv6** — gunakan `127.0.0.1` bukan `localhost` untuk menghindari `ECONNREFUSED ::1:8080`.

3. **Port 3001 di-expose dari microfab container** (bukan dari backend container) karena backend share network microfab.

4. **Frontend node_modules** menggunakan Docker named volume `frontend_node_modules` terpisah agar tidak konflik dengan host Windows.

5. **Persistent Storage** untuk blockchain menggunakan volume `microfab_data`, sedangkan PostgreSQL menggunakan `postgres_data`.

---

## 📁 Struktur File Kritis

```
Blockchainappportchain/
│
├── fabric-local/
│   ├── docker-compose.yaml     ← MASTER CONFIG — edit ini untuk ubah services
│   ├── start-fabric.ps1        ← Jalankan: cd fabric-local; .\start-fabric.ps1
│   └── stop-fabric.ps1         ← Hentikan: .\stop-fabric.ps1
│
├── backend/
│   ├── server.js               ← Express API — tambah endpoint baru di sini
│   ├── fabric-connector.js     ← Fabric Gateway connection — jangan ubah kecuali perlu
│   ├── package.json            ← {express, cors, axios, fabric-network, fabric-ca-client, pg}
│   ├── Dockerfile              ← FROM node:20-alpine, EXPOSE 3001
│   └── db/
│       ├── init.sql            ← PostgreSQL schema + seed data awal
│       └── db.js               ← Pool connection (pg library)
│
├── src/
│   ├── main.tsx                ← Entry point React (JANGAN tambah debug code)
│   ├── app/
│   │   ├── App.tsx             ← RouterProvider wrapper
│   │   ├── routes.tsx          ← React Router — daftar semua halaman
│   │   ├── components/         ← Satu file per halaman
│   │   │   ├── Root.tsx        ← Layout utama (header nav + footer)
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Shipments.tsx
│   │   │   ├── CustomsClearance.tsx
│   │   │   ├── Documents.tsx
│   │   │   ├── EBLManagement.tsx
│   │   │   ├── Organizations.tsx
│   │   │   ├── BlockchainExplorer.tsx ← Punya live status indicator ke backend
│   │   │   └── AuditTrail.tsx
│   │   └── data/
│   │       └── portData.ts     ← Mock data (digunakan sementara sebelum full DB integration)
│   └── styles/
│       ├── index.css           ← Import semua CSS
│       ├── fonts.css
│       ├── tailwind.css
│       └── theme.css
│
├── vite.config.ts              ← server.host: '0.0.0.0' port: 5173 (PENTING untuk Docker)
├── package.json                ← Frontend dependencies (React, Vite, Tailwind, Recharts, dll)
├── .gitignore                  ← Exclude: node_modules, .pnpm-store, .env, dist
├── README.md                   ← Dokumentasi lengkap (updated)
└── CONTEXT.md                  ← File ini sendiri
```

---

## 🔌 API Endpoints (Backend — port 3001)

```
GET  /api/status           → {success, fabric, database, message}
GET  /api/shipments        → List shipments dari PostgreSQL
POST /api/shipments        → Buat shipment baru
GET  /api/customs          → List customs clearance + join shipments
PATCH /api/customs/:id     → Update status bea cukai
GET  /api/documents        → List dokumen + join shipments
GET  /api/ebl              → Electronic Bill of Lading tokens
GET  /api/organizations    → List organisasi
GET  /api/audit            → Audit logs
GET  /api/query            → Query langsung chaincode Fabric
       ?chaincode=<name>&functionName=<fn>&args=<json>
```

---

## 🗄️ PostgreSQL Database

```
Container: portchain-db
Host (dari luar Docker): localhost:5432
Host (dari backend container): portchain-db:5432
Database: portchain_offchain
User:     portchain
Password: portchain123
```

Tabel yang ada:
- `organizations` — Port Authority, Customs, Shipping Lines
- `users` — Pengguna sistem
- `shipments` — Data pengiriman
- `containers` — Kontainer per shipment  
- `customs_clearance` — Status bea cukai (PIB)
- `documents` — Bill of Lading, Invoice, dll.
- `ebl_tokens` — Electronic Bill of Lading
- `audit_logs` — Log semua aktivitas

---

## ⛓️ Hyperledger Fabric (Microfab)

```
Microfab URL: http://localhost:8080
Channel: mychannel
Organization: org1 (org1MSP)
Identity: org1admin
```

Cara backend connect ke Fabric:
1. Fetch components dari `GET http://127.0.0.1:8080/ak/api/v1/components`
2. Filter `type === 'identity'` untuk dapat org1admin cert
3. Filter `type === 'peer'` dan `type === 'orderer'` untuk build Connection Profile
4. Connect via `fabric-network` Gateway dengan `discovery: { enabled: false }`
5. Join channel `mychannel`

---

## 🚀 Cara Menjalankan

```powershell
# Start semua (dari folder fabric-local)
cd c:\DATA\GITHUB\Blockchainappportchain\fabric-local
.\start-fabric.ps1

# Atau manual
docker-compose up -d --build

# Stop
.\stop-fabric.ps1

# Lihat log
docker logs fabric-backend --tail 50
docker logs react-frontend --tail 30
docker logs microfab --tail 30
docker logs portchain-db --tail 20

# Rebuild satu service saja
docker-compose build backend
docker-compose up -d --force-recreate backend
```

**Waktu startup pertama kali:** ~5-10 menit (download images + pnpm install ~287 packages)
**Waktu startup selanjutnya:** ~30-60 detik (cache dipakai)

---

## 🐛 Known Issues & Solusi

### 1. Backend ECONNREFUSED ke Microfab
**Gejala:** `connect ECONNREFUSED ::1:8080`
**Penyebab:** Node.js 18+ resolve `localhost` ke IPv6 `::1`
**Solusi:** Gunakan `MICROFAB_URL=http://127.0.0.1:8080` (sudah diset di docker-compose)

### 2. Fabric "No discovery targets found"
**Gejala:** Error saat `gateway.getNetwork('mychannel')`
**Penyebab:** Discovery mode enabled tapi CCP tidak punya endpoint yang tepat
**Solusi:** Set `discovery: { enabled: false, asLocalhost: false }` di fabric-connector.js

### 3. Vite cache korupsi di Docker
**Gejala:** Pre-transform error, `chunk-XXXXX.js` not found
**Penyebab:** Volume node_modules dari Windows host konflik dengan Linux container
**Solusi:** Gunakan named volume `frontend_node_modules` + flag `--force` di vite dev command

### 4. Frontend "Backend API tidak dapat dijangkau"
**Gejala:** Status banner merah di Blockchain Explorer
**Penyebab:** Port 3001 belum di-expose ke host
**Solusi:** Port 3001 harus di-expose dari `microfab` container (bukan backend), karena network mode shared

### 5. docker-compose down error di PowerShell
**Gejala:** `no configuration file provided: not found`
**Penyebab:** Menjalankan dari folder yang salah
**Solusi:** Selalu jalankan dari `fabric-local/` folder

---

## 📦 Stack & Dependencies

### Backend (`backend/package.json`)
```json
{
  "express": "^4.18.2",
  "cors": "^2.8.5",
  "axios": "^1.6.5",
  "fabric-network": "^2.2.19",
  "fabric-ca-client": "^2.2.19",
  "pg": "^8.11.3"
}
```

### Frontend (`package.json` root)
- React 18 + TypeScript
- Vite 6 + @vitejs/plugin-react
- Tailwind CSS 4
- Recharts (grafik)
- React Router 7
- Radix UI (komponen)
- Lucide React (ikon)
- pnpm (package manager)

---

## 🎯 Status Fitur Saat Ini

| Fitur | Status | Catatan |
|---|---|---|
| Frontend berjalan | ✅ | http://localhost:5173 |
| Backend API aktif | ✅ | http://localhost:3001 |
| Fabric Gateway connected | ✅ | Channel mychannel |
| PostgreSQL running | ✅ | portchain_offchain DB |
| Mock data di frontend | ✅ | portData.ts |
| Real data dari PostgreSQL | 🟡 Partial | API siap, belum wired ke semua component |
| Chaincode deployed | ❌ | Belum ada chaincode di mychannel |
| Frontend fetch dari API | 🟡 Partial | BlockchainExplorer sudah, lainnya masih mock |

---

## 📋 Langkah Selanjutnya (TODO)

1. **Wire frontend ke PostgreSQL API** — ganti mock data di komponen dengan `fetch('/api/shipments')` dll.
2. **Deploy chaincode** ke mychannel Microfab untuk transaksi nyata
3. **Authentication** — login system untuk multi-user
4. **Form input** — tambah form buat shipment, customs approval, dll.
5. **Real-time updates** — WebSocket atau polling untuk live data

---

## 🔑 Informasi Penting Lainnya

- **Package manager:** `pnpm` (bukan npm/yarn) untuk project frontend
- **TypeScript strict:** Ya, pastikan type aman di semua komponen
- **CSS framework:** Tailwind CSS v4 (ada perbedaan syntax vs v3)
- **Git remote:** `origin` → `https://github.com/edjiesa/Blockchainappportchain.git`
- **Committer:** Eko Juli Saputro (dikonfigurasi otomatis dari hostname Windows)
- **Shell**: PowerShell (bukan Git Bash / WSL) — gunakan sintaks PS untuk perintah

---

## 💡 Tips untuk Agen AI

1. Selalu cek `docker ps` dulu sebelum debug — pastikan container berjalan
2. Gunakan `docker logs <container> --tail 50` untuk debug masalah
3. Jika edit backend, jalankan: `docker-compose build backend && docker-compose up -d --force-recreate backend`
4. Jika edit frontend, Vite Hot-Reload otomatis mendeteksi perubahan (tidak perlu restart)
5. Jika edit docker-compose.yaml, jalankan: `docker-compose up -d` (tidak perlu --build kecuali ubah Dockerfile)
6. Koneksi dari browser ke backend: lewat `http://localhost:3001` (port di-expose dari host)
7. Koneksi antar container: backend → postgres melalui hostname `portchain-db:5432`
8. Jangan hapus volume `postgres_data` kecuali mau reset DB (data hilang!)
