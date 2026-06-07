# CONTEXT.md — PortChain Project Context File
# Baca file ini di awal setiap thread baru sebelum mulai coding!

## 📌 Identitas Proyek

- **Nama:** PortChain — Blockchain Port Licensing System
- **Repository:** https://github.com/edjiesa/Blockchainappportchain
- **Local Path:** `c:\DATA\GITHUB\Blockchainappportchain\`
- **OS Lingkungan:** Windows (WSL / Ubuntu) — Eksekusi Docker/Skrip harus via WSL!
- **Branch aktif:** `main`

---

## 🏗️ Arsitektur Sistem (5 Container Docker)

Semua layanan dijalankan dengan **Docker Compose** di lingkungan **WSL (Ubuntu)**.

```
docker-compose.yaml → fabric-local/docker-compose.yaml
```

| Container | Image / Tech | Port Expose | Keterangan |
|---|---|---|---|
| `microfab` | `ibmcom/ibp-microfab:latest` | 8080 (Fabric), 3001, 8001 | Core blockchain node. Memiliki 3 Organisasi: `portorg`, `customsorg`, `bankorg`. |
| `fabric-backend-go` | Golang 1.22 | 3001 (via microfab) | Middleware API (Port 3001). Logic layer, auth, connect ke PostgreSQL. |
| `fabric-connector` | Node.js 20 | 3002 | Fabric SDK Bridge. Meneruskan request dari Go ke jaringan Fabric. |
| `portchain-db` | `postgres:16-alpine` | 5432 | Database Off-chain. Menyimpan user, password hash, metadata. |
| `react-frontend` | `node:20-alpine` (Vite) | 5173 | UI React modern dengan Tailwind. Menggunakan pola Sidebar Layout. |

### ⚠️ PENTING — Networking Quirks

1. **Backend Go menggunakan `network_mode: "service:microfab"`** — artinya Golang berbagi IP stack dengan Microfab. Frontend mengakses Go lewat `http://localhost:3001`.
2. **Fabric Connector (Node.js) port 3002** — Go mengakses Node.js internal via `http://127.0.0.1:3002`.
3. **Persistensi Data:**
   - PostgreSQL: menggunakan docker volume `postgres_data`
   - Microfab: menggunakan docker volume `microfab_data`
   - *Container* dapat dimatikan (`stop-fabric.sh`) tanpa kehilangan data. Namun jika menggunakan `destroy.sh`, semua volume akan musnah.

---

## 📁 Struktur File Kritis

```
Blockchainappportchain/
│
├── fabric-local/
│   ├── docker-compose.yaml     ← MASTER CONFIG — edit ini untuk ubah services
│   ├── start-fabric.sh         ← Start jaringan docker compose
│   ├── deploy-chaincode.sh     ← Install, Approve, Commit chaincode ke channel
│   ├── stop-fabric.sh          ← Stop (Pause) jaringan tanpa hapus data
│   └── destroy.sh              ← Hapus bersih container + data volume
│
├── backend-go/
│   ├── main.go                 ← Core Middleware API (JSON-RPC 2.0)
│   ├── Dockerfile              ← Golang 1.22 build env
│   └── go.mod                  ← Dependencies (pq, uuid, dll)
│
├── backend/
│   ├── server.js               ← Node.js Fabric SDK Connector (Port 3002)
│   └── db/
│       └── init.sql            ← PostgreSQL Schema (14 Entitas, RBAC)
│
├── chaincode/
│   └── portchain-cc/           ← Smart Contract (Node.js) untuk Fabric
│
├── src/
│   ├── main.tsx                ← Entry point React
│   ├── app/
│   │   ├── App.tsx             ← RouterProvider + Error Boundary
│   │   ├── routes.tsx          ← React Router tree (ProtectedRoute)
│   │   ├── components/         ← Komponen halaman (Root.tsx = Sidebar Premium Layout)
│   │   └── context/
│   │       └── AuthContext.tsx ← RBAC & Login state management
│   └── styles/
│       └── index.css           ← Tailwind CSS styling
│
├── README.md                   ← Dokumentasi Setup
├── cara-kerja-system.md        ← Detail Deep Dive cara kerja arsitektur
├── ERD.md                      ← Entity Relationship Diagram (14 Entitas)
└── CONTEXT.md                  ← File ini sendiri
```

---

## 🔑 Login Kredensial

Sistem memiliki **Role-Based Access Control (RBAC)** penuh:
1. **Port Authority:** `admin@port.co.id` (Pass: `admin123`)
2. **Customs:** `admin@beacukai.co.id` (Pass: `admin123`)

---

## 🚀 Perintah Operasional (Dari WSL)

```bash
# Menyalakan Sistem dari awal
cd /opt/RESPONSI-BLOCKCHAIN/fabric-local
./start-fabric.sh
./deploy-chaincode.sh

# Rebuild / Restart Backend Golang saja
docker compose up -d --build backend

# Pause sistem
./stop-fabric.sh

# Destroy (Reset Data)
./destroy.sh
```

---

## 🎯 Status Fitur Saat Ini

| Fitur | Status | Catatan |
|---|---|---|
| Database PostgreSQL | ✅ | 14 Entitas ter-deploy |
| Authentication (RBAC) | ✅ | Login bekerja, menu di-filter per role |
| Backend Golang API | ✅ | Handle Login & Forward ke Fabric Connector |
| Fabric Node.js Connector | ✅ | Menjembatani Go ke Blockchain Microfab |
| Chaincode Deployed | ✅ | Smart Contract aktif di `port-channel` |
| UI/UX Redesign | ✅ | Sidebar premium layout selesai |
| Real data integration | ✅ | Terhubung dari UI -> Go -> Node.js -> Fabric |

---

## 💡 Tips untuk Agen AI

1. Eksekusi `docker` atau skrip bash **HARUS** di dalam lingkungan WSL (`wsl -u root -d Ubuntu bash -c "..."`).
2. Jangan hapus container atau volume menggunakan terminal Windows jika tidak mendesak.
3. Selalu perbarui dokumen pendukung (`cara-kerja-system.md`, `ERD.md`) jika Anda mengubah skema database atau arsitektur sistem.
4. Server Frontend Vite berjalan dengan Hot Module Replacement (HMR). Perubahan UI akan langsung terlihat.
5. Jika membuat/mengubah fungsi baru, kerjakan di dua sisi backend:
   - `backend-go/main.go` (sebagai logic controller & SQL worker)
   - `backend/server.js` (sebagai Fabric RPC Connector)
