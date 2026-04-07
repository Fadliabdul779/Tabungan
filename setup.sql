-- ============================================
-- SETUP DATABASE - TABUNGAN SANTRI
-- Jalankan di Supabase SQL Editor
-- ============================================

-- Jika error "duplicate key", abaikan saja (tabel sudah ada)
-- Lanjut ke step berikutnya

-- ============================================
-- TABLE USERS
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

-- Insert user default (abaikan jika sudah ada)
INSERT INTO users (username, password, name, role, approved) 
VALUES ('admin', 'admin123', 'Administrator', 'admin', true)
ON CONFLICT (username) DO NOTHING;

INSERT INTO users (username, password, name, role, approved) 
VALUES ('staff', 'staff123', 'Staff', 'staff', true)
ON CONFLICT (username) DO NOTHING;

-- ============================================
-- TABLE STUDENTS
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
-- TABLE TRANSACTIONS  
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
-- SECURITY (RLS)
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Hapus policy lama jika ada
DROP POLICY IF EXISTS "allow_all" ON users;
DROP POLICY IF EXISTS "allow_all" ON students;
DROP POLICY IF EXISTS "allow_all" ON transactions;

-- Buat policy baru
CREATE POLICY "allow_all" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON students FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON transactions FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- CEK HASIL
-- ============================================
SELECT 'Users table:' as info, COUNT(*) as total FROM users;
SELECT 'Students table:' as info, COUNT(*) as total FROM students;
SELECT 'Transactions table:' as info, COUNT(*) as total FROM transactions;