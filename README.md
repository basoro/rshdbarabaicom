# Website RSUD H. Damanhuri Barabai (rshdbarabai.com)

Website resmi Rumah Sakit Umum Daerah H. Damanhuri Barabai, Kabupaten Hulu Sungai Tengah, Kalimantan Selatan. Dibangun dengan:

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + Zustand + React Router
- **Backend**: Express 4 + TypeScript (ESM)
- **Database**: SQLite via `node:sqlite` (`DatabaseSync`) dengan file `api/database.sdb`
- **Auth admin**: Bearer token sessions disimpan di tabel `admin_sessions`
- **Runtime production**: Node 22+ (disarankan) + PM2

---

## Daftar Isi

1. [Struktur Proyek](#1-struktur-proyek)
2. [Pengembangan Lokal](#2-pengembangan-lokal)
3. [Environment Variables (.env)](#3-environment-variables-env)
   - [Cover Berita (IMAGE_URL & IMAGE_PATH)](#cover-berita-image_url--image_path)
4. [Skrip NPM](#4-skrip-npm)
5. [Database](#5-database)
   - [Tabel Penting](#tabel-penting)
   - [Sinkronisasi Data Berita (jika mlite_news di api/database.sdb kosong)](#sinkronisasi-data-berita-jika-mlite_news-di-apidatabasesdb-kosong)
6. [Fitur APAM (Aplikasi Pendaftaran & Antrian Mandiri)](#6-fitur-apam-aplikasi-pendaftaran--antrian-mandiri)
   - [6.1. Ringkasan](#61-ringkasan)
   - [6.2. Arsitektur](#62-arsitektur)
   - [6.3. Endpoint API](#63-endpoint-api)
   - [6.4. Frontend APAM](#64-frontend-apam)
   - [6.5. Daftar Action API](#65-daftar-action-api)
7. [Deployment ke Production](#7-deployment-ke-production)
   - [7.1. File & Folder yang Wajib di-Upload](#71-file--folder-yang-wajib-di-upload)
   - [7.2. Hal yang TIDAK Perlu di-Upload](#72-hal-yang-tidak-perlu-di-upload)
   - [7.3. Step-by-step di Server](#73-step-by-step-di-server)
   - [7.4. Menjalankan dengan PM2](#74-menjalankan-dengan-pm2)
   - [7.5. Reverse Proxy (Nginx / HTTPS)](#75-reverse-proxy-nginx--https)
8. [Verifikasi Setelah Deploy](#8-verifikasi-setelah-deploy)
9. [CI/CD](#9-cicd)
   - [9.1. GitHub Actions CI (lint · typecheck · build)](#91-github-actions-ci-lint--typecheck--build)
   - [9.2. Deploy ke Production dengan `deploy.sh`](#92-deploy-ke-production-dengan-deploysh)
   - [9.3. Masa Depan: Deploy via GitHub Actions (Opsional)](#93-masa-depan-deploy-via-github-actions-opsional)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Struktur Proyek

```
rshdbarabaicom/
├── api/                       # Backend Express + TypeScript
│   ├── lib/                   # database.ts, auth.ts, content.ts, uploadPaths.ts
│   ├── middleware/            # requireAdmin.ts
│   ├── routes/                # admin.ts, public.ts, apam.ts
│   ├── app.ts                 # init express, routes, static dist, uploads
│   ├── server.ts              # entry point (listen port + graceful shutdown)
│   └── database.sdb           # ⚠️ DATABASE AKTIF yang dibaca aplikasi
├── src/                       # Frontend React + Vite
│   ├── components/            # komponen reusable
│   ├── pages/                 # halaman (admin + publik)
│   ├── lib/                   # api client, helpers, format
│   └── store/                 # Zustand stores (admin, site/bootstrap, apam)
├── uploads/                   # static upload (cover berita, arsip, logo)
│   ├── news/
│   ├── arsip/
│   ├── misc/
│   └── settings/
├── public/                    # static assets Vite (favicon dll.)
├── dist/                      # hasil build frontend (dibaca Express)
├── database.sdb               # ⚠️ Backup / sumber data berita (root)
├── .env.example
├── ecosystem.config.cjs       # PM2 config (ubah `cwd:` sesuai server production)
├── DEPLOYMENT.md
├── package.json
└── vite.config.ts / tsconfig.json / tailwind.config.js / postcss.config.js
```

---

## 2. Pengembangan Lokal

**Prasyarat**: Node.js 22+ (karena menggunakan `node:sqlite` yang stabil mulai Node 22).

```bash
# 1. Install dependencies
npm install

# 2. Salin env contoh
cp .env.example .env
# edit .env sesuai kebutuhan (lihat bagian Environment Variables di bawah)

# 3. Jalankan development (frontend + backend secara bersamaan via concurrently)
npm run dev
```

Setelah berjalan:
- Frontend Vite : http://localhost:5173
- Backend API    : http://localhost:3001 (Vite proxy `/* /api` ke port 3001)
- Login admin CMS: buka http://localhost:5173/admin/login

Mode **hanya backend** (berguna untuk uji curl):
```bash
npm run server:dev
```

---

## 3. Environment Variables (.env)

Semua env dibaca oleh `dotenv` di [api/app.ts](api/app.ts#L15). Buat file `.env` di root project **JANGAN di-commit** (sudah masuk `.gitignore`).

| Variable           | Contoh Nilai                        | Keterangan                                                                              |
|--------------------|-------------------------------------|-----------------------------------------------------------------------------------------|
| `NODE_ENV`         | `production` / `development`        | Mode runtime                                                                            |
| `PORT`             | `3001`                              | Port listen aplikasi Express                                                            |
| `IMAGE_URL`        | `https://rshdbarabai.com`           | Base URL untuk menyusun link cover berita **TANPA** trailing slash                      |
| `IMAGE_PATH`       | `uploads/website/news`              | Path relatif cover berita terhadap `IMAGE_URL` (juga terhadap folder uploads static)     |
| `MYSQL_HOST`       | `127.0.0.1` (opsional)              | Host MySQL integrasi BPJS / V-Claim                                                     |
| `MYSQL_USER`       | (opsional)                          | User MySQL                                                                              |
| `MYSQL_PASSWORD`   | (opsional)                          | Password MySQL                                                                          |
| `MYSQL_DATABASE`   | (opsional)                          | Nama DB MySQL                                                                           |
| `MYSQL_PORT`       | `3306` (opsional)                   | Port MySQL                                                                              |

> **MySQL wajib** jika menggunakan fitur APAM (Aplikasi Pendaftaran & Antrian Mandiri). Koneksi MySQL digunakan untuk query data pasien, jadwal dokter, booking, billing, dan data medis lainnya dari database rumah sakit (SIMRS).

### Cover Berita (IMAGE_URL & IMAGE_PATH)

Cover berita diambil dari **kolom `cover_photo` pada tabel `mlite_news`**. Lalu URL lengkapnya disusun oleh helper `resolveNewsCover()` di [api/lib/uploadPaths.ts](api/lib/uploadPaths.ts#L70-L106) dengan aturan:

| Nilai `cover_photo`       | Hasil URL                                                                 |
|---------------------------|---------------------------------------------------------------------------|
| Kosong / `null`           | Fallback placeholder (editorial image default)                            |
| `https://...`             | Dipakai langsung (tidak ada transformasi)                                 |
| `data:image/...`          | Dipakai langsung (data URI inline)                                        |
| `/path/nama.jpg`          | `${IMAGE_URL}/path/nama.jpg`                                              |
| hanya nama (mis. `a.jpg`) | `${IMAGE_URL}/${IMAGE_PATH}/a.jpg` → contoh: `https://rshdbarabai.com/uploads/website/news/a.jpg` |
| **tanpa `IMAGE_URL` set** | Dev fallback ke `/api/public/media/news/<cover_photo>` (proxy lokal)      |

> **Tips**: Agar cover tampil di server production, pastikan **file fisiknya** benar-benar ada di folder `uploads/website/news/` (atau path yang sesuai dengan `IMAGE_PATH`). Karena Express serve folder `uploads/` sebagai static via `/uploads/*` di [api/app.ts](api/app.ts#L21-L29), maka URL di atas otomatis valid.

---

## 4. Skrip NPM

Daftar utama di [package.json](package.json#L6-L15):

| Skrip             | Deskripsi                                                                 |
|-------------------|---------------------------------------------------------------------------|
| `npm run dev`     | Jalankan frontend (Vite HMR) + backend (nodemon tsx) secara paralel       |
| `npm run client:dev` | Hanya frontend Vite di 5173                                            |
| `npm run server:dev` | Hanya backend Express (nodemon + tsx, reload otomatis ketika file api/ berubah) |
| `npm run build`   | Type-check dulu dengan `tsc -b` lalu build React ke folder `dist/`        |
| `npm run check`   | Jalankan `tsc --noEmit` untuk verifikasi seluruh type TS tanpa output     |
| `npm run preview` | Serve folder `dist/` secara lokal (sebelum deploy)                        |
| `npm run start`   | Entry point production: `NODE_ENV=production tsx api/server.ts`           |
| `npm run lint`    | Jalankan ESLint                                                            |

---

## 5. Database

Aplikasi SQLite hanya membaca **1 file aktif** yang didefinisikan di [api/lib/database.ts](api/lib/database.ts#L12-L16), yaitu:

```
PROJECT_ROOT/api/database.sdb
```

Ada file `database.sdb` di root project yang difungsikan sebagai **backup / sumber data berita** (biasanya isinya lengkap 387+ baris). Jika `api/database.sdb` kehilangan tabel berita, restore dari root DB seperti di bawah.

### Tabel Penting

- `mlite_news` — postingan berita: `id, title, slug, user_id, content, intro, cover_photo, status, comments, markdown, published_at, updated_at, created_at`.
  - `status = 2` = published (muncul di publik).
  - `cover_photo` = nama file / path cover (hanya nama, mis. `berita.jpg`).
- `mlite_users` — data pengguna / author.
- `mlite_settings` — pengaturan website (nama, alamat, logo, wallpaper, dll).
- `pages` — halaman statis (profil, visi misi, maklumat, dll).
- `arsip_dokumen` — arsip dokumen publik.
- `admin_sessions` — token login CMS (di-insert otomatis saat login admin).
- `users` — cermin kolom terbatas dari `mlite_users` untuk kompatibilitas foreign key lama (di-insert otomatis via upsert di startup).

### Sinkronisasi Data Berita (jika mlite_news di api/database.sdb kosong)

Gejalanya: `/admin/news` dan `/api/public/news` menampilkan 0 baris padahal admin yakin ada isinya. Ini biasanya terjadi karena `api/database.sdb` diganti / di-reset tanpa membawa tabel `mlite_news`.

Langkah perbaikan (jalankan dari root project, **matikan backend terlebih dahulu** supaya tidak ada write lock):

```bash
# 1. Pastikan backup DB root ada (lihat jumlah baris)
node -e "
import('node:sqlite').then(async ({ DatabaseSync }) => {
  const path = await import('node:path');
  const db = new DatabaseSync(path.resolve(process.cwd(), 'database.sdb'));
  console.log('root mlite_news count:', db.prepare('SELECT COUNT(*) AS total FROM mlite_news').get()?.total);
});"
# Pastikan outputnya > 0 (contoh: 387)

# 2. Restore mlite_news (shared kolom) dari root -> api/database.sdb
#    Bisa dibuat script .mjs sederhana: ATTACH source, DROP target, CREATE AS SELECT
#    Setelah restore, update sqlite_sequence.mlite_news = MAX(id) agar autoinc benar.

# 3. Pastikan index ada untuk kinerja:
#    CREATE INDEX IF NOT EXISTS idx_news_status_published ON mlite_news(status, published_at);
#    CREATE INDEX IF NOT EXISTS idx_news_slug ON mlite_news(slug);
```

---

## 6. Fitur APAM (Aplikasi Pendaftaran & Antrian Mandiri)

### 6.1. Ringkasan

**APAM** adalah sistem API pendaftaran online yang di-migrasi dari plugin PHP lama (`apam.php`) ke Express + TypeScript. Fitur ini menyediakan:

- Pendaftaran pasien baru (register + verifikasi email)
- Login pasien (sign in dengan No. RM + No. KTP)
- Booking / pendaftaran periksa online
- Telemedicine dengan pembayaran Duitku
- Riwayat kunjungan (rawat jalan & rawat inap)
- Notifikasi WhatsApp otomatis
- Jadwal dokter & klinik
- Pengaduan masyarakat
- Ketersediaan kamar inap
- Billing & profil pasien
- Berita terkini

### 6.2. Arsitektur

```
Frontend (React)                Backend (Express)              Database
─────────────────               ─────────────────              ────────
/apam/login  ──POST──→  /api/apam/login     ──→  SQLite (admin_sessions)
/apam        ←Guard──   /api/apam/session    ──→  SQLite (admin_sessions)
                           ↓
/apam page  ──POST──→  /api/apam            ──→  MySQL (pasien, dokter, booking, dll)
               (action)   (apam.ts)          ──→  SQLite (mlite_settings)
```

**Dua database digunakan:**
- **SQLite** (`api/database.sdb`) — untuk pengaturan (`mlite_settings`), sesi login frontend (`admin_sessions`)
- **MySQL** — untuk data rumah sakit (pasien, jadwal, booking, billing, riwayat, dll.)

### 6.3. Endpoint API

| Endpoint             | Method | Deskripsi                                            | Auth                |
|----------------------|--------|------------------------------------------------------|---------------------|
| `/api/apam/login`    | POST   | Login frontend (username + password)                 | Tidak               |
| `/api/apam/session`  | GET    | Cek sesi login (Bearer token)                        | Bearer token        |
| `/api/apam/logout`   | POST   | Logout / hapus sesi                                  | Bearer token        |
| `/api/apam/`         | POST   | Main API — semua action via field `action`            | Token query/body    |

### 6.4. Frontend APAM

Halaman frontend tersedia di `/apam` dengan alur:

```
/apam           →  ApamGuard  →  cek token  →  redirect ke /apam/login jika belum login
/apam/login     →  form login  →  POST /api/apam/login  →  simpan token  →  redirect /apam
/apam           →  pilih action  →  isi form  →  kirim  →  lihat response JSON
```

**Autentikasi frontend** menggunakan tabel `mlite_users` yang sama dengan admin CMS. Token disimpan di `localStorage` (key: `rshd-apam-token`) dengan masa aktif 7 hari.

### 6.5. Daftar Action API

Semua action dikirim via `POST /api/apam/` dengan field `action` di body request.

| Action | Parameter | Deskripsi |
|--------|-----------|----------|
| `signin` | `no_rkm_medis`, `no_ktp` | Login pasien (verifikasi No. RM + KTP) |
| `register` | `nama_lengkap`, `email`, `nomor_ktp`, `nomor_telepon` | Registrasi pasien baru |
| `postregister` | `email` | Cek data registrasi pending |
| `saveregister` | `nm_pasien`, `email`, `no_ktp`, `no_tlp`, `jk`, `tgl_lahir`, `alamat` | Simpan data pasien baru |
| `profil` | `no_rkm_medis` | Profil lengkap pasien |
| `notifikasi` | `no_rkm_medis` | Daftar notifikasi belum dibaca |
| `notifikasilist` | `no_rkm_medis` | Semua notifikasi |
| `tandaisudahdibaca` | `id` | Tandai notifikasi sudah dibaca |
| `notifbooking` | `no_rkm_medis` | Status booking hari ini |
| `booking` | `no_rkm_medis` | Daftar semua booking |
| `bookingdetail` | `no_rkm_medis`, `tanggal_periksa`, `no_reg` | Detail satu booking |
| `daftar` | `no_rkm_medis`, `tanggal`, `kd_poli`, `kd_dokter`, `kd_pj` | Buat booking baru + kirim WhatsApp |
| `sukses` | `no_rkm_medis` | Booking sukses hari ini |
| `lastbooking` | — | Cek booking terakhir |
| `dokter` | `tanggal` (opsional) | Jadwal dokter hari itu |
| `jadwalklinik` | `tanggal` | Jadwal per poliklinik |
| `jadwaldokter` | `tanggal`, `kd_poli` | Dokter yang jaga per poli |
| `riwayat` | `no_rkm_medis` | Riwayat rawat jalan |
| `riwayatdetail` | `no_rkm_medis`, `tgl_registrasi`, `no_reg` | Detail riwayat (obat, lab, radiologi) |
| `riwayatranap` | `no_rkm_medis` | Riwayat rawat inap |
| `riwayatranapdetail` | `no_rkm_medis`, `tgl_registrasi`, `no_reg` | Detail riwayat ranap |
| `billing` | `no_rkm_medis` | Daftar billing |
| `hitungralan` | `no_rkm_medis` | Jumlah kunjungan ralan |
| `hitungranap` | `no_rkm_medis` | Jumlah kunjungan ranap |
| `kamar` | — | Ketersediaan kamar per kelas |
| `rawatjalan` | — | Daftar poliklinik aktif |
| `rawatinap` | — | Daftar kamar + bangsal |
| `laboratorium` | — | Jenis pemeriksaan lab |
| `radiologi` | — | Jenis pemeriksaan radiologi |
| `carabayar` | — | Daftar penjamin / cara bayar |
| `pengaduan` | `no_rkm_medis` | Daftar pengaduan |
| `pengaduandetail` | `pengaduan_id` | Detail percakapan pengaduan |
| `simpanpengaduan` | `no_rkm_medis`, `message` | Kirim pengaduan baru |
| `simpanpengaduandetail` | `no_rkm_medis`, `message`, `pengaduan_id` | Balas pengaduan |
| `telemedicine` | `tanggal` (opsional) | Jadwal telemedicine |
| `telemedicinedaftar` | `no_rkm_medis`, `tanggal`, `kd_poli`, `kd_dokter` | Daftar telemedicine + bayar Duitku |
| `telemedicinesukses` | `no_rkm_medis` | Status booking telemedicine |
| `duitku_callback` | `merchantCode`, `amount`, `merchantOrderId`, `signature`, `resultCode` | Callback pembayaran Duitku |
| `lastnews` | — | Berita terbaru (limit dari settings) |
| `news` | — | Semua berita published |
| `newsdetail` | `id` | Detail satu berita |
| `layananunggulan` | — | Pengaturan website (widget) |
| `cekrujukan` | — | Cek rujukan (placeholder) |
| `antrian` | — | Status antrian |
| `simpanretensirekammedik` | `no_rkm_medis` | Simpan retensi rekam medis |

**Contoh request:**

```bash
curl -X POST http://localhost:3001/api/apam/ \
  -H "Content-Type: application/json" \
  -d '{
    "token": "YOUR_APAM_KEY",
    "action": "dokter",
    "tanggal": "2026-09-08"
  }'
```

**Contoh response:**

```json
[
  {
    "nm_dokter": "dr. Ahmad, Sp.PD",
    "jk": "L",
    "nm_poli": "Penyakit Dalam",
    "jam_mulai": "08:00",
    "jam_selesai": "12:00",
    "kd_dokter": "001"
  }
]
```

### Pengaturan APAM di Database

Pengaturan APAM disimpan di tabel `mlite_settings` dengan module `api`:

| Field | Deskripsi |
|-------|----------|
| `apam_key` | Token API untuk autentikasi request |
| `apam_limit` | Batas kuota pendaftaran online per hari |
| `apam_kdpj` | Kode penanggung jawab default |
| `apam_kdkec` | Kode kecamatan default |
| `apam_kdkab` | Kode kabupaten default |
| `apam_kdprop` | Kode provinsi default |
| `apam_webappsurl` | Base URL web apps (untuk callback Duitku) |
| `apam_status_daftar` | Status pendaftaran |
| `apam_status_dilayani` | Status sedang dilayani |
| `apam_normpetugas` | No. RM petugas yang bisa lihat semua pengaduan |
| `apam_smtp_host` | SMTP host untuk email verifikasi |
| `apam_smtp_port` | SMTP port |
| `apam_smtp_username` | SMTP username |
| `apam_smtp_password` | SMTP password |
| `duitku_merchantCode` | Kode merchant Duitku |
| `duitku_merchantKey` | Merchant key Duitku |
| `duitku_paymentAmount` | Nominal pembayaran telemedicine |
| `duitku_paymentMethod` | Metode pembayaran (VC, WW, MY, BK) |
| `duitku_kdpj` | Kode penanggung jawab telemedicine |
| `duitku_productDetails` | Nama produk pembayaran |
| `duitku_expiryPeriod` | Masa berlaku pembayaran (menit) |

Pengaturan WhatsApp gateway (module `wagateway`):

| Field | Deskripsi |
|-------|----------|
| `wagateway.server` | URL server WhatsApp gateway |
| `wagateway.token` | API key WhatsApp gateway |
| `wagateway.phonenumber` | Nomor pengirim WhatsApp |

---

## 7. Deployment ke Production

Dokumen ringkas juga ada di [DEPLOYMENT.md](DEPLOYMENT.md#L1-L33). Berikut panduan LENGKAP.

### 7.1. File & Folder yang Wajib di-Upload

**Kelompok A — kode & konfigurasi** (tarik via `git pull` atau `rsync`):
```
package.json
package-lock.json
tsconfig.json
vite.config.ts
tailwind.config.js
postcss.config.js
eslint.config.js
nodemon.json
index.html
public/                # favicon dll.
src/                   # semua halaman + komponen frontend
api/                   # app.ts, server.ts, routes/, lib/, middleware/
ecosystem.config.cjs   # opsional (jika pakai PM2), ingat: ubah `cwd:` sesuai server!
vercel.json            # opsional (jika target Vercel)
.env.example
```

**Kelompok B — DATABASE AKTIF (paling krusial)**:
```
api/database.sdb       # Upload root database.sdb DENGAN NAMA FILE INI (api/database.sdb)
```
- `api/database.sdb` adalah satu-satunya file DB yang dibaca aplikasi.
- Pastikan permission folder `api/` dan user process Node **bisa menulis** (butuh write untuk insert/update dan journal SQLite).

**Kelompok C — uploads / media statis (cover berita, arsip, logo)**:
```
uploads/
├── news/              # cover berita baru dari CMS
├── website/news/      # path default IMAGE_PATH (jika ada file lawas di sini)
├── arsip/             # dokumen arsip_dokumen
├── misc/              # lampiran umum
└── settings/          # logo, wallpaper, dll.
```
> **WAJIB**: Pastikan setiap nama file yang muncul di kolom `mlite_news.cover_photo` ada fisiknya di direktori sesuai `IMAGE_PATH`. Jika `cover_photo = "bupati.jpg"` dan `IMAGE_PATH = uploads/website/news`, maka file harus benar-benar ada di: `uploads/website/news/bupati.jpg`. Jika tidak, gambar akan 404.

### 7.2. Hal yang TIDAK Perlu di-Upload

Jangan upload / biarkan server yang generate sendiri:
- `node_modules/` → jalankan `npm ci` di server.
- `dist/` → jalankan `npm run build` di server (atau build di lokal lalu upload dist juga bisa, tapi build di server lebih aman untuk environment yang sama).
- `.env` → buat manual di server (jangan commit).
- `.vite/`, `.DS_Store`, `npm-debug.log*`, dll.

### 7.3. Step-by-step di Server

SSH ke server production, `cd` ke direktori app (mis. `/var/www/rshdbarabai.com`).

```bash
# 0. Buat .env production (sesuaikan sendiri isinya)
# nano .env
# pastikan baris ini SET:
#   NODE_ENV=production
#   PORT=3001
#   IMAGE_URL=https://rshdbarabai.com
#   IMAGE_PATH=uploads/website/news

# 1. Install dependencies production (hanya dependencies, tidak dev)
npm ci --omit=dev --omit=optional --no-audit --no-fund

# 2. Build frontend (menghasilkan folder dist/ yang akan dilayani Express)
npm run build

# 3. Smoke test (opsional, langsung nonton log)
NODE_ENV=production PORT=3001 npm run start
# curl http://127.0.0.1:3001/api/health   # -> success:true (wajib OK)
# curl http://127.0.0.1:3001/api/public/news?page=1  # cek total & cover_url
# tekan Ctrl+C untuk berhenti, lalu lanjut pakai PM2 di bawah
```

### 7.4. Menjalankan dengan PM2

Disarankan agar proses restart otomatis kalau crash / server reboot.

1. Install PM2 (jika belum):
   ```bash
   npm i -g pm2
   pm2 install pm2-logrotate    # opsional, rotasi log otomatis
   ```

2. Edit [ecosystem.config.cjs](ecosystem.config.cjs#L1-L14) **sesuaikan `cwd:`** dengan path absolut di server:
   ```js
   module.exports = {
     apps: [{
       name: 'rshdbarabaicom',
       cwd: '/var/www/rshdbarabai.com',   // GANTI DENGAN PATH ABSOLUT ANDA
       script: 'npm',
       args: 'run start',
       env: { NODE_ENV: 'production', PORT: 3001 },
       max_memory_restart: '1G',          // opsional, restart jika > 1GB
       instances: 1,                       // SQLite sync DB, jadi 1 instance aman
       autorestart: true,
       watch: false,
     }],
   };
   ```

3. Start + buat start-on-boot:
   ```bash
   pm2 start ecosystem.config.cjs
   pm2 save
   pm2 startup
   # Copy-paste command output terakhir ke shell agar PM2 start ketika server reboot
   ```

4. Perintah sehari-hari:
   ```bash
   pm2 status                # lihat status app
   pm2 logs rshdbarabaicom   # lihat log realtime
   pm2 reload rshdbarabaicom # zero-downtime restart setelah deploy ulang
   pm2 restart rshdbarabaicom
   pm2 stop    rshdbarabaicom
   ```

### 7.5. Reverse Proxy (Nginx / HTTPS)

Aplikasi hanya listen di `127.0.0.1:3001`, akses HTTPS domain diatur via Nginx (atau Apache / Caddy).

Contoh konfigurasi Nginx (sesuaikan path SSL, mis. Let's Encrypt):

```nginx
server {
  listen 80;
  server_name rshdbarabai.com www.rshdbarabai.com;
  return 301 https://$host$request_uri;
}

server {
  listen 443 ssl http2;
  server_name rshdbarabai.com www.rshdbarabai.com;

  ssl_certificate     /etc/letsencrypt/live/rshdbarabai.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/rshdbarabai.com/privkey.pem;

  # Maks body 20M (cover berita, arsip upload)
  client_max_body_size 20M;
  client_body_timeout  60s;

  # Static cache untuk dist/ & uploads (bisa biarkan Express serve, tapi lebih cepat Nginx)
  location /uploads/ {
    alias /var/www/rshdbarabai.com/uploads/;
    expires 7d;
    add_header Cache-Control "public, max-age=604800";
    try_files $uri =404;
  }

  location /assets/ {
    alias /var/www/rshdbarabai.com/dist/assets/;
    expires 30d;
    add_header Cache-Control "public, immutable, max-age=2592000";
    try_files $uri =404;
  }

  location / {
    proxy_pass http://127.0.0.1:3001;
    proxy_http_version 1.1;
    proxy_set_header Host              $host;
    proxy_set_header X-Real-IP         $remote_addr;
    proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Upgrade           $http_upgrade;
    proxy_set_header Connection        "upgrade";
    proxy_connect_timeout 60s;
    proxy_send_timeout    60s;
    proxy_read_timeout    60s;
  }
}
```

Simpan sebagai `/etc/nginx/sites-available/rshdbarabai.com`, lalu enable:
```bash
sudo ln -sf /etc/nginx/sites-available/rshdbarabai.com /etc/nginx/sites-enabled/rshdbarabai.com
sudo nginx -t
sudo systemctl reload nginx
```

---

## 8. Verifikasi Setelah Deploy

Jalankan urutan di bawah setelah app + Nginx live:

```bash
# 1. Health check (wajib ok)
curl -sS https://rshdbarabai.com/api/health
# -> {"success":true,"message":"ok"}

# 2. List berita publik (pastikan total > 0)
curl -sS https://rshdbarabai.com/api/public/news?page=1 | python3 -m json.tool | head -n 50
# -> data.pagination.total = 384 (contoh)
# -> per item .cover_url harus mulai dengan https://rshdbarabai.com/uploads/website/news/...

# 3. Ambil salah satu cover_url, pastikan bukan 404 (wajib OK, file fisik harus ada)
curl -sSI "https://rshdbarabai.com/uploads/website/news/<NAMA_FILE_DARI_COVER_PHOTO>.jpg"
# -> HTTP/2 200 + Content-Type: image/jpeg (atau image/png)

# 4. Bootstrap beranda (cek latestNews terisi)
curl -sS https://rshdbarabai.com/api/public/bootstrap | python3 -m json.tool | grep -A 12 "latestNews"
# -> latestNews.length = 3 berita terbaru

# 5. Manual browser test:
#    - https://rshdbarabai.com/          -> section Berita tampil 3 kartu + cover
#    - https://rshdbarabai.com/news      -> 9 kartu + pagination (43 halaman jika 384 baris)
#    - https://rshdbarabai.com/news/<slug> -> detail berita + cover gambar + artikel terkait
#    - https://rshdbarabai.com/admin/login -> login CMS admin lalu buka /admin/news
```

Jika salah satu poin di atas gagal, lihat [Troubleshooting](#10-troubleshooting).

---

## 9. CI/CD

### 9.1. GitHub Actions CI (lint · typecheck · build)

Setiap **push ke `main`** atau **pull request ke `main`** akan menjalankan workflow `.github/workflows/ci.yml` untuk memastikan:

1. `npm ci` install dependencies
2. `npm run check` — `tsc --noEmit` (type safety seluruh kode TS)
3. `npm run lint` — ESLint
4. `npm run build` — build React ke `dist/` (di tiap push ke `main`, hasil `dist/` di-upload sebagai artifact selama 7 hari untuk debugging cepat)

File workflow: [.github/workflows/ci.yml](.github/workflows/ci.yml#L1-L55)

Contoh hasil di GitHub:
- Tab **Actions** repo → pilih workflow **CI** → muncul job `Lint · Typecheck · Build`
- Jika gagal: klik job, expand step yang merah untuk error message (biasanya karena ada TS error type baru / lint).

### 9.2. Deploy ke Production dengan `deploy.sh`

Tersedia skrip deploy [deploy.sh](deploy.sh#L1-L239) untuk deploy dari **lokal** ke server production via **rsync + SSH + PM2 reload zero-downtime**.

#### Keunggulan skrip ini:
- `rsync --delete-after` — sync file dengan cepat, hanya file berubah yang di-transfer.
- **JANGAN timpa** `.env`, `api/database.sdb`, `database.sdb`, `uploads/`, `node_modules/`, `dist/` di server (semua sudah di-exclude default).
- Preflight check di server: `node ... import('./api/app.js')` — jika ada syntax error / import error, deploy **BATAL** (PM2 tidak direload → app lama tetap jalan).
- Setelah sync, jalankan `npm ci --omit=dev` + `npm run build` di server.
- Akhiri dengan `pm2 reload` (zero-downtime) dan health check public opsional via `DEPLOY_PUBLIC_URL`.

#### Cara pakai `deploy.sh`

**1) Setting variable (bisa taruh di `~/.zshrc` / `~/.bashrc` atau export manual):**

```bash
export DEPLOY_USER=root                 # atau username SSH di server
export DEPLOY_HOST=rshdbarabai.com      # atau IP server
export DEPLOY_PATH=/var/www/rshdbarabai.com
export DEPLOY_PORT=22                   # (default 22, ganti jika SSH port custom)
export DEPLOY_APP_NAME=rshdbarabaicom   # sesuai app name di ecosystem.config.cjs
export DEPLOY_PUBLIC_URL=https://rshdbarabai.com   # opsional, untuk auto /api/health check
```

**2) Jalankan deploy (dari lokal folder project):**

```bash
# DRY RUN (lihat file yang akan di-sync tanpa benar-benar menulis ke server)
DRY_RUN=1 ./deploy.sh

# DEPLOY SESUNGGUHNYA
./deploy.sh

# Atau deploy ke host tertentu (override DEPLOY_HOST)
./deploy.sh 203.xxx.xxx.xxx
```

Output alur deploy:
```
1/5 ▶︎ Memastikan remote path ada...
2/5 ▶︎ Sync source code via rsync...
3/5 ▶︎ Install dependencies production + build frontend di server...
4/5 ▶︎ Health check local app loader + PM2 reload (zero-downtime)...
5/5 ▶︎ Final health check via local HTTP...
🎉 Deploy selesai.
```

#### Jika rollback diperlukan

- Jika app baru error di server: **PM2 reload otomatis rollback** ketika health check internal gagal (catatan: butuh `pm2 reload` + `--listen-timeout` / config health check jika mau diaktifkan).
- Jika ingin rollback manual ke app state sebelumnya:
  ```bash
  ssh root@rshdbarabai.com
  cd /var/www/rshdbarabai.com
  git reset --hard HEAD~1        # (jika server punya git clone)
  # ATAU ambil backup rsync sebelumnya (jika anda punya rsync backup target)
  pm2 reload rshdbarabaicom
  ```
- Alternatif: deploy commit lama dari lokal (checkout commit yang stabil → jalankan `./deploy.sh`).

### 9.3. Masa Depan: Deploy via GitHub Actions (Opsional)

Jika nanti mau **push ke `main` → otomatis deploy** tanpa jalankan `./deploy.sh` manual di lokal:

1. Tambahkan **Secrets repo** di GitHub → `Settings → Secrets and variables → Actions → New repository secret`:
   - `SSH_PRIVATE_KEY` — isi private key (copy isi file `~/.ssh/id_ed25519` atau yang dipakai login server).
   - `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_PATH`, `DEPLOY_PORT` (opsional juga bisa disimpan sebagai Secret).
2. Buat workflow `.github/workflows/deploy.yml` yang:
   - Checkout repo
   - Setup SSH via `appleboy/ssh-action` / `ssh-key-action`
   - Jalankan `rsync` / atau SSH ke server dan eksekusi script deploy yang sama.

Kami sarankan mulai dengan **`deploy.sh` dulu** (paling aman: tidak expose creds ke Actions sampai yakin flow production stabil).

---

## 10. Troubleshooting

### Q: Berita tidak muncul di publik / halaman `/news` kosong?
1. Cek jumlah baris di DB aktif:
   ```bash
   node -e "
   import('node:sqlite').then(async ({DatabaseSync})=>{
     const path = await import('node:path');
     const db = new DatabaseSync(path.resolve(process.cwd(), 'api/database.sdb'));
     console.log('mlite_news count:', db.prepare('SELECT COUNT(*) AS total FROM mlite_news').get()?.total);
     console.log('status=2:', db.prepare(\"SELECT COUNT(*) AS total FROM mlite_news WHERE status = 2\").get()?.total);
   });"
   ```
2. Jika `count = 0`, restore dari `database.sdb` root project (lihat [Sinkronisasi Data Berita](#sinkronisasi-data-berita-jika-mlite_news-di-apidatabasesdb-kosong)).
3. Jika count > 0 tapi tetap 0 di API, pastikan backend yang dijalankan memakai process yang memuat `api/database.sdb` yang sama (tidak memuat DB lama). Jalankan `pm2 reload rshdbarabaicom`.

### Q: Cover berita tampil broken / gambar 404?
- Buka Network tab DevTools, copy URL cover yang error, cek di tab baru: jika 404, berarti **file fisik tidak ada di server**.
- Cek `IMAGE_PATH` di `.env`: mis. `uploads/website/news`, maka file harus ada di `$PROJECT_ROOT/uploads/website/news/<cover_photo>`.
- Cek permission folder `uploads/`: harus readable user process Node (biasanya `www-data` atau user deploy).
- Jika Nginx serve static `/uploads/`, pastikan `alias` di Nginx **benar** menunjuk ke folder `uploads` app.

### Q: Build gagal dengan error TS2554 encodeURI / encodeURIComponent?
- Proyek ini menggunakan `node:sqlite` + build TS strict yang kadang signature global encode tidak dikenal (karena paduan lib tsconfig `["ES2020","DOM"]` + `types:["node","express"]`). Solusinya sudah diakomodasi di [api/lib/uploadPaths.ts](api/lib/uploadPaths.ts#L26-L52): fungsi `percentEncode()` manual. Pastikan file helper ini dipanggil (jangan memanggil `encodeURI()` langsung di file `api/lib/*.ts` baru). Kemudian jalankan `npm run check` lagi sebelum deploy.

### Q: Upload berita CMS gagal / size tidak cukup?
- Di `api/app.ts`, `express.json({ limit: '10mb' })` dan `express.urlencoded({ limit: '10mb' })`. Jika file cover > 10MB per request (jarang), naikkan limitnya.
- Di Nginx, pastikan `client_max_body_size 20M;` (atau lebih). Kalau Nginx ngelarang, upload langsung diputus sebelum menyentuh Express.

### Q: PM2 tidak start otomatis setelah server reboot?
- Jalankan `pm2 startup`, copy command outputnya, paste di shell, lalu `pm2 save`. Kedua perintah ini wajib agar PM2 register ke systemd / initrc.

### Q: Mau update kode tanpa downtime?
Flow deploy ulang yang aman:
```bash
cd /var/www/rshdbarabai.com
git pull origin main         # atau rsync file baru
npm ci --omit=dev --omit=optional --no-audit --no-fund
npm run build
# smoke test cepat (opsional)
node -e "import('./api/app.js').then(m => console.log('app load ok'))"
pm2 reload rshdbarabaicom
pm2 logs rshdbarabaicom --lines 40
```
Jika ada kesalahan kritis, `pm2 reload` otomatis rollback ke versi lama jika health check gagal (bisa tambah `--listen-timeout 8000` dan health check route di ecosystem.config).

### Q: API APAM mengembalikan error koneksi MySQL?
- Pastikan environment variable `MYSQL_HOST`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE` sudah di-set di `.env`.
- Pastikan MySQL server berjalan dan bisa diakses dari server aplikasi.
- Test koneksi: `mysql -h $MYSQL_HOST -u $MYSQL_USER -p $MYSQL_DATABASE -e "SELECT 1"`
- Jika MySQL tidak tersedia, fitur APAM tidak akan berfungsi (endpoint `/api/apam/` akan return error 500).

### Q: Login APAM di frontend gagal "Username atau password salah"?
- APAM menggunakan tabel `mlite_users` yang sama dengan admin CMS. Pastikan username dan password sudah terdaftar di tabel tersebut.
- Cek via SQLite: `node -e "import('node:sqlite').then(async({DatabaseSync})=>{const{default:{resolve}}=await import('path');const db=new DatabaseSync(resolve(process.cwd(),'api/database.sdb'));console.log(db.prepare('SELECT id,username FROM mlite_users').all())})"`

### Q: Token API APAM "Error key"?
- Token APAM disimpan di `mlite_settings` dengan module `api` dan field `apam_key`.
- Cek di database: `SELECT value FROM mlite_settings WHERE module='api' AND field='apam_key'`
- Pastikan token yang dikirim dalam request sesuai dengan nilai di database.

### Q: Notifikasi WhatsApp tidak terkirim setelah booking?
- WhatsApp gateway harus dikonfigurasi di `mlite_settings` module `wagateway` (`server`, `token`, `phonenumber`).
- Pastikan nomor pasien (`no_tlp`) terisi di tabel `pasien`.
- WhatsApp gateway harus bisa diakses dari server (cek firewall / network).

---

## Kontak & Lisensi

Dikelola oleh tim ICT RSUD H. Damanhuri Barabai.
- Website resmi: https://rshdbarabai.com
