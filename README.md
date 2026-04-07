# Aplikasi Tabungan Santri PPM Zaenab Masykur

Sistem pengelolaan tabungan terintegrasi untuk pondok pesanmodern Zaenab Masykur.

## Cara Menjalankan

### 1. Install Dependencies
```bash
npm install
```

### 2. Jalankan Server
```bash
npm start
```

### 3. Buka Browser
Akses `http://localhost:3000`

## Login Default
- **Admin:** `admin` / `admin123`
- **Staff:** `staff` / `staff123` (perlu approval admin)

## Fitur

### Landing Page
- Dashboard statistik dengan data contoh
- Informasi fitur aplikasi
- Form pendaftaran staff

### Panel Admin
- Kelola data santos (CRUD lengkap)
- Transaksi setor/tarik
- Riwayat transaksi
- Laporan & export CSV
- Kelola & approval staff
- Log aktivitas

### Panel Staff
- Lihat data santo
- Transaksi tabungan
- Riwayat transaksi sendiri

## Tech Stack
- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js + Express
- **Database:** SQLite (better-sqlite3)
- **Auth:** JWT + bcrypt