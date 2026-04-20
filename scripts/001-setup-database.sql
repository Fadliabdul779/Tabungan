-- ============================================
-- SETUP DATABASE - TABUNGAN SANTRI
-- PPM Zaenab Masykur
-- ============================================

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS transaksi CASCADE;
DROP TABLE IF EXISTS tabungan CASCADE;
DROP TABLE IF EXISTS santri CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS activity_log CASCADE;

-- ============================================
-- 1. TABLE USERS (Admin & Staff)
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nama VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    role VARCHAR(20) DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
    approved BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default admin user (password: admin123)
INSERT INTO users (username, password_hash, nama, role, approved) VALUES 
('admin', '$2a$10$rQZMn4u2bXn3u9FiJF.Gp.Y5dxB4mXl0kYJzR9h8l8Zu8vbDVV2EK', 'Administrator', 'admin', true);

-- ============================================
-- 2. TABLE SANTRI
-- ============================================
CREATE TABLE santri (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama VARCHAR(100) NOT NULL,
    nis VARCHAR(20) UNIQUE,
    kelas VARCHAR(20) NOT NULL,
    tanggal_lahir DATE,
    jenis_kelamin VARCHAR(10) CHECK (jenis_kelamin IN ('L', 'P')),
    nama_ortu VARCHAR(100),
    no_hp_ortu VARCHAR(20),
    alamat TEXT,
    saldo DECIMAL(15, 2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 3. TABLE TRANSAKSI
-- ============================================
CREATE TABLE transaksi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    santri_id UUID REFERENCES santri(id) ON DELETE CASCADE,
    jenis VARCHAR(20) NOT NULL CHECK (jenis IN ('setor', 'tarik')),
    nominal DECIMAL(15, 2) NOT NULL,
    keterangan TEXT,
    staff_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 4. TABLE ACTIVITY LOG
-- ============================================
CREATE TABLE activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    details TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 5. INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_santri_nama ON santri(nama);
CREATE INDEX idx_santri_nis ON santri(nis);
CREATE INDEX idx_santri_kelas ON santri(kelas);
CREATE INDEX idx_santri_status ON santri(status);
CREATE INDEX idx_transaksi_santri_id ON transaksi(santri_id);
CREATE INDEX idx_transaksi_created_at ON transaksi(created_at);
CREATE INDEX idx_users_username ON users(username);

-- ============================================
-- 6. INSERT SAMPLE DATA
-- ============================================
INSERT INTO santri (nama, nis, kelas, jenis_kelamin, nama_ortu, no_hp_ortu, saldo) VALUES 
('Ahmad Fauzi', '2024001', '7A', 'L', 'Bapak Fauzi', '081234567890', 150000),
('Budi Santoso', '2024002', '7A', 'L', 'Bapak Santoso', '081234567891', 225000),
('Citra Dewi', '2024003', '7B', 'P', 'Ibu Dewi', '081234567892', 180000),
('Dedi Kurniawan', '2024004', '8A', 'L', 'Bapak Kurniawan', '081234567893', 350000),
('Eka Putri', '2024005', '8A', 'P', 'Ibu Putri', '081234567894', 275000);

-- Verify tables
SELECT 'Users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'Santri' as table_name, COUNT(*) as count FROM santri;
