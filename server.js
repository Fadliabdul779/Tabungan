const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
const db = new Database('tabungan_santri.db');
const JWT_SECRET = 'tabungan_santri_secret_key_2024';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

function initDatabase() {
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            name TEXT NOT NULL,
            role TEXT DEFAULT 'staff',
            approved INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS students (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            nis TEXT UNIQUE,
            class TEXT NOT NULL,
            birth_date DATE,
            gender TEXT,
            parent_name TEXT,
            parent_phone TEXT,
            address TEXT,
            balance REAL DEFAULT 0,
            status TEXT DEFAULT 'active',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER NOT NULL,
            type TEXT NOT NULL,
            amount REAL NOT NULL,
            description TEXT,
            staff_id INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (student_id) REFERENCES students(id),
            FOREIGN KEY (staff_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS savings_categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            interest_rate REAL DEFAULT 0,
            min_amount REAL DEFAULT 0,
            status TEXT DEFAULT 'active'
        );

        CREATE TABLE IF NOT EXISTS student_savings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER NOT NULL,
            category_id INTEGER NOT NULL,
            balance REAL DEFAULT 0,
            interest_earned REAL DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (student_id) REFERENCES students(id),
            FOREIGN KEY (category_id) REFERENCES savings_categories(id)
        );

        CREATE TABLE IF NOT EXISTS settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            key TEXT UNIQUE NOT NULL,
            value TEXT
        );

        CREATE TABLE IF NOT EXISTS activity_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            action TEXT NOT NULL,
            details TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    const adminExists = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
    if (!adminExists) {
        const hashedPassword = bcrypt.hashSync('admin123', 10);
        db.prepare('INSERT INTO users (username, password, name, role, approved) VALUES (?, ?, ?, ?, ?)').run('admin', hashedPassword, 'Administrator', 'admin', 1);
    }

    const categoryCount = db.prepare('SELECT COUNT(*) as count FROM savings_categories').get();
    if (categoryCount.count === 0) {
        db.prepare('INSERT INTO savings_categories (name, description, interest_rate, min_amount) VALUES (?, ?, ?, ?)').run('Tabungan Wajib', 'Tabungan wajib bulanan', 0, 5000);
        db.prepare('INSERT INTO savings_categories (name, description, interest_rate, min_amount) VALUES (?, ?, ?, ?)').run('Tabungan Sukarela', 'Tabungan sukarela dengan bunga 3%', 3, 1000);
    }

    console.log('Database initialized successfully');
}

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Token required' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });
        req.user = user;
        next();
    });
}

function logActivity(userId, action, details) {
    db.prepare('INSERT INTO activity_log (user_id, action, details) VALUES (?, ?, ?)').run(userId, action, details);
}

app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    
    if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({ error: 'Username atau password salah' });
    }
    
    if (!user.approved) {
        return res.status(403).json({ error: 'Akun menunggu persetujuan admin' });
    }
    
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, username: user.username, name: user.name, role: user.role } });
});

app.post('/api/auth/register', (req, res) => {
    const { username, password, name } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);
    
    try {
        db.prepare('INSERT INTO users (username, password, name, role, approved) VALUES (?, ?, ?, ?, ?)').run(username, hashedPassword, name, 'staff', 0);
        res.json({ message: 'Pendaftaran berhasil, menunggu persetujuan admin' });
    } catch (e) {
        res.status(400).json({ error: 'Username sudah terdaftar' });
    }
});

app.get('/api/auth/verify', authenticateToken, (req, res) => {
    res.json({ valid: true, user: req.user });
});

app.get('/api/students', authenticateToken, (req, res) => {
    const { search, status, class: classFilter } = req.query;
    let query = 'SELECT * FROM students WHERE 1=1';
    const params = [];
    
    if (search) {
        query += ' AND (name LIKE ? OR nis LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
    }
    if (status) {
        query += ' AND status = ?';
        params.push(status);
    }
    if (classFilter) {
        query += ' AND class = ?';
        params.push(classFilter);
    }
    
    query += ' ORDER BY created_at DESC';
    const students = db.prepare(query).all(...params);
    res.json(students);
});

app.get('/api/students/:id', authenticateToken, (req, res) => {
    const student = db.prepare('SELECT * FROM students WHERE id = ?').get(req.params.id);
    if (!student) return res.status(404).json({ error: 'Santri tidak ditemukan' });
    
    const transactions = db.prepare('SELECT t.*, u.name as staff_name FROM transactions t JOIN users u ON t.staff_id = u.id WHERE t.student_id = ? ORDER BY t.created_at DESC LIMIT 50').all(req.params.id);
    res.json({ ...student, transactions });
});

app.post('/api/students', authenticateToken, (req, res) => {
    const { name, nis, class: className, birth_date, gender, parent_name, parent_phone, address } = req.body;
    
    try {
        const result = db.prepare(`
            INSERT INTO students (name, nis, class, birth_date, gender, parent_name, parent_phone, address)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(name, nis, className, birth_date, gender, parent_name, parent_phone, address);
        
        logActivity(req.user.id, 'ADD_STUDENT', `Menambahkan siswa baru: ${name}`);
        res.json({ id: result.lastInsertRowid, message: 'Santri berhasil ditambahkan' });
    } catch (e) {
        res.status(400).json({ error: 'NIS sudah terdaftar atau data tidak valid' });
    }
});

app.put('/api/students/:id', authenticateToken, (req, res) => {
    const { name, nis, class: className, birth_date, gender, parent_name, parent_phone, address, status } = req.body;
    
    db.prepare(`
        UPDATE students SET name = ?, nis = ?, class = ?, birth_date = ?, gender = ?, parent_name = ?, parent_phone = ?, address = ?, status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `).run(name, nis, className, birth_date, gender, parent_name, parent_phone, address, status, req.params.id);
    
    logActivity(req.user.id, 'UPDATE_STUDENT', `Mengupdate data siswa ID: ${req.params.id}`);
    res.json({ message: 'Data berhasil diperbarui' });
});

app.delete('/api/students/:id', authenticateToken, (req, res) => {
    const student = db.prepare('SELECT balance FROM students WHERE id = ?').get(req.params.id);
    if (student && student.balance > 0) {
        return res.status(400).json({ error: 'Tidak dapat menghapus siswa dengan saldo tabungan' });
    }
    
    db.prepare('DELETE FROM students WHERE id = ?').run(req.params.id);
    logActivity(req.user.id, 'DELETE_STUDENT', `Menghapus siswa ID: ${req.params.id}`);
    res.json({ message: 'Santri berhasil dihapus' });
});

app.post('/api/transactions', authenticateToken, (req, res) => {
    const { student_id, type, amount, description } = req.body;
    const student = db.prepare('SELECT * FROM students WHERE id = ?').get(student_id);
    
    if (!student) {
        return res.status(404).json({ error: 'Santri tidak ditemukan' });
    }
    
    if (type === 'withdraw' && student.balance < amount) {
        return res.status(400).json({ error: 'Saldo tidak cukup' });
    }
    
    const newBalance = type === 'deposit' ? student.balance + amount : student.balance - amount;
    
    db.prepare('BEGIN TRANSACTION');
    try {
        db.prepare('INSERT INTO transactions (student_id, type, amount, description, staff_id) VALUES (?, ?, ?, ?, ?)').run(student_id, type, amount, description, req.user.id);
        db.prepare('UPDATE students SET balance = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newBalance, student_id);
        
        logActivity(req.user.id, 'TRANSACTION', `${type === 'deposit' ? 'Setoran' : 'Penarikan'} Rp${amount} untuk ${student.name}`);
        db.prepare('COMMIT');
        
        res.json({ message: 'Transaksi berhasil', new_balance: newBalance });
    } catch (e) {
        db.prepare('ROLLBACK');
        res.status(500).json({ error: 'Transaksi gagal' });
    }
});

app.get('/api/transactions', authenticateToken, (req, res) => {
    const { student_id, type, start_date, end_date, limit } = req.query;
    let query = 'SELECT t.*, s.name as student_name, u.name as staff_name FROM transactions t JOIN students s ON t.student_id = s.id JOIN users u ON t.staff_id = u.id WHERE 1=1';
    const params = [];
    
    if (student_id) {
        query += ' AND t.student_id = ?';
        params.push(student_id);
    }
    if (type) {
        query += ' AND t.type = ?';
        params.push(type);
    }
    if (start_date) {
        query += ' AND DATE(t.created_at) >= ?';
        params.push(start_date);
    }
    if (end_date) {
        query += ' AND DATE(t.created_at) <= ?';
        params.push(end_date);
    }
    
    query += ' ORDER BY t.created_at DESC';
    if (limit) {
        query += ' LIMIT ?';
        params.push(parseInt(limit));
    }
    
    const transactions = db.prepare(query).all(...params);
    res.json(transactions);
});

app.get('/api/reports/summary', authenticateToken, (req, res) => {
    const students = db.prepare('SELECT COUNT(*) as count, SUM(balance) as total FROM students WHERE status = ?').get('active');
    const today = new Date().toISOString().split('T')[0];
    const transactions = db.prepare('SELECT COUNT(*) as count, SUM(amount) as total FROM transactions WHERE DATE(created_at) = ?').all(today);
    const month = db.prepare('SELECT COUNT(*) as count, SUM(amount) as total FROM transactions WHERE strftime("%Y-%m", created_at) = strftime("%Y-%m", "now")').get();
    const staff = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ? AND approved = ?').get('staff', 1);
    
    res.json({
        total_students: students.count || 0,
        total_balance: students.total || 0,
        today_transactions: transactions[0]?.count || 0,
        today_amount: transactions[0]?.total || 0,
        monthly_transactions: month.count || 0,
        monthly_amount: month.total || 0,
        active_staff: staff.count || 0
    });
});

app.get('/api/reports/students', authenticateToken, (req, res) => {
    const students = db.prepare('SELECT * FROM students WHERE status = ? ORDER BY balance DESC').all('active');
    res.json(students);
});

app.get('/api/reports/transactions/:studentId', authenticateToken, (req, res) => {
    const transactions = db.prepare('SELECT * FROM transactions WHERE student_id = ? ORDER BY created_at DESC').all(req.params.studentId);
    res.json(transactions);
});

app.get('/api/settings', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Akses ditolak' });
    }
    const settings = db.prepare('SELECT * FROM settings').all();
    res.json(settings);
});

app.post('/api/settings', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Akses ditolak' });
    }
    const { key, value } = req.body;
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value);
    res.json({ message: 'Pengaturan disimpan' });
});

app.get('/api/users', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Akses ditolak' });
    }
    const users = db.prepare('SELECT id, username, name, role, approved, created_at FROM users ORDER BY created_at DESC').all();
    res.json(users);
});

app.post('/api/users/:id/approve', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Akses ditolak' });
    }
    db.prepare('UPDATE users SET approved = 1 WHERE id = ?').run(req.params.id);
    logActivity(req.user.id, 'APPROVE_USER', `Menyetujui user ID: ${req.params.id}`);
    res.json({ message: 'User disetujui' });
});

app.delete('/api/users/:id', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Akses ditolak' });
    }
    db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    logActivity(req.user.id, 'DELETE_USER', `Menghapus user ID: ${req.params.id}`);
    res.json({ message: 'User dihapus' });
});

app.get('/api/activity', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Akses ditolak' });
    }
    const limit = req.query.limit || 50;
    const activities = db.prepare('SELECT a.*, u.username FROM activity_log a LEFT JOIN users u ON a.user_id = u.id ORDER BY a.created_at DESC LIMIT ?').all(parseInt(limit));
    res.json(activities);
});

app.get('/api/export/students', authenticateToken, (req, res) => {
    const students = db.prepare('SELECT * FROM students WHERE status = ?').all('active');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=santri.csv');
    res.csv('NIS,Nama,Kelas,Saldo,Status,Tanggal Daftar\n');
    students.forEach(s => res.csv(`${s.nis || ''},"${s.name}",${s.class},${s.balance},${s.status},${s.created_at}\n`));
});

app.get('/api/export/transactions', authenticateToken, (req, res) => {
    const { start_date, end_date } = req.query;
    let query = 'SELECT t.*, s.name as student_name FROM transactions t JOIN students s ON t.student_id = s.id WHERE 1=1';
    const params = [];
    
    if (start_date) {
        query += ' AND DATE(t.created_at) >= ?';
        params.push(start_date);
    }
    if (end_date) {
        query += ' AND DATE(t.created_at) <= ?';
        params.push(end_date);
    }
    
    query += ' ORDER BY t.created_at DESC';
    const transactions = db.prepare(query).all(...params);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=transactions.csv');
    res.csv('Tanggal,Nama Santri,Jenis,Jumlah,Keterangan,Petugas\n');
    transactions.forEach(t => res.csv(`${t.created_at},"${t.student_name}",${t.type},${t.amount},"${t.description || ''}",${t.staff_name}\n`));
});

initDatabase();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});