-- ============================================
-- SETUP DATABASE - TABUNGAN SANTRI
-- Copy dan paste ke Supabase SQL Editor
-- ============================================

-- Hapus tabel lama jika ada (untuk clean setup)
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS users;

-- ============================================
-- 1. TABLE USERS
-- ============================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'staff',
    approved BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert user default
INSERT INTO users (username, password, name, role, approved) VALUES 
('admin', 'admin123', 'Administrator', 'admin', true),
('staff', 'staff123', 'Staff', 'staff', true);

-- ============================================
-- 2. TABLE STUDENTS
-- ============================================
CREATE TABLE students (
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
-- 3. TABLE TRANSACTIONS
-- ============================================
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    amount REAL NOT NULL,
    description TEXT,
    staff_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 4. SECURITY (RLS)
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_students" ON students FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_transactions" ON transactions FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- 5. CEK HASIL
-- ============================================
SELECT * FROM users;