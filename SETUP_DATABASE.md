# Setup Database Supabase - Aplikasi Tabungan Santri

## Langkah 1: Buka SQL Editor
1. Login ke https://supabase.com
2. Pilih project **urhtraluxfdbpakpoqai**
3. Klik menu **SQL Editor** di sidebar kiri

## Langkah 2: Jalankan SQL Berikut

Copy dan paste semua kode ini ke SQL Editor, lalu klik **Run**:

```sql
-- ============================================
-- TABLE USERS (Admin & Staff)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'staff',
    approved BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert user default
INSERT INTO users (username, password, name, role, approved) 
VALUES 
    ('admin', 'admin123', 'Administrator', 'admin', true),
    ('staff', 'staff123', 'Staff', 'staff', true)
ON CONFLICT (username) DO NOTHING;

-- ============================================
-- TABLE STUDENTS (Santri)
-- ============================================
CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    nis TEXT,
    class TEXT NOT NULL,
    birth_date DATE,
    gender TEXT,
    parent_name TEXT,
    parent_phone TEXT,
    address TEXT,
    balance REAL DEFAULT 0,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TABLE TRANSACTIONS (Transaksi Tabungan)
-- ============================================
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    amount REAL NOT NULL,
    description TEXT,
    staff_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Policy untuk allow all operations
DROP POLICY IF EXISTS "allow_all_users" ON users;
DROP POLICY IF EXISTS "allow_all_students" ON students;
DROP POLICY IF EXISTS "allow_all_transactions" ON transactions;

CREATE POLICY "allow_all_users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_students" ON students FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_transactions" ON transactions FOR ALL USING (true) WITH CHECK (true);
```

## Langkah 3: Verifikasi
Setelah running SQL, cek di **Table Editor** (icon table di sidebar):
- ✅ Ada tabel **users** (2 baris: admin & staff)
- ✅ Ada tabel **students** (kosong dulu)
- ✅ Ada tabel **transactions** (kosong dulu)

## Langkah 4: Test Login
Buka aplikasi dan login dengan:
- **Admin:** admin / admin123
- **Staff:** staff / staff123

## Troubleshooting
Jika error, cek:
1. Apakah SQL sudah di-run dengan sukses?
2. Apakah ada pesan error di output?
3. Coba refresh halaman Table Editor

---

**Catatan Penting:**
- Password sengaja plaintext untuk demo. Untuk production, gunakan hashing!
- RLS sudah di-disable untuk demo. Untuk production, atur sesuai kebutuhan.