-- Database setup for Tabungan Santri application

-- Schema for the main tables
CREATE TABLE IF NOT EXISTS santri (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tabungan (
    id SERIAL PRIMARY KEY,
    santri_id INT NOT NULL,
    balance DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (santri_id) REFERENCES santri(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS transaksi (
    id SERIAL PRIMARY KEY,
    tabungan_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tabungan_id) REFERENCES tabungan(id) ON DELETE CASCADE
);

-- Indexes to improve performance
CREATE INDEX idx_santri_name ON santri(name);
CREATE INDEX idx_tabungan_santri ON tabungan(santri_id);
CREATE INDEX idx_transaksi_tabungan ON transaksi(tabungan_id);

-- Initial data for santri
INSERT INTO santri (name, email) VALUES 
('Ali', 'ali@example.com'),
('Budi', 'budi@example.com'),
('Siti', 'siti@example.com');

-- Initial data for tabungan
INSERT INTO tabungan (santri_id, balance) VALUES 
(1, 100.00),
(2, 150.50),
(3, 200.00);

-- Initial data for transaksi
INSERT INTO transaksi (tabungan_id, amount, transaction_date) VALUES 
(1, 50.00, '2026-04-20 07:20:46'),
(2, 75.00, '2026-04-20 07:20:46'),
(3, 100.00, '2026-04-20 07:20:46');

-- Uncomment the following lines to add more functionality or modify existing data.
--
-- Additional tables, views, or stored procedures can be added as needed.
