const API_URL = 'http://localhost:3000/api';

let currentUser = null;
let token = localStorage.getItem('token');

const DEFAULT_SUMMARY = {
    total_students: 127,
    total_balance: 45678900,
    today_transactions: 12,
    monthly_transactions: 89,
    active_staff: 5,
    pending_count: 2
};

console.log('App.js loaded');

const api = {
    async request(endpoint, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers
        });
        
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Request failed');
        }
        return data;
    },
    
    get: (endpoint) => api.request(endpoint),
    post: (endpoint, body) => api.request(endpoint, { method: 'POST', body: JSON.stringify(body) }),
    put: (endpoint, body) => api.request(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (endpoint) => api.request(endpoint, { method: 'DELETE' })
};

function showLogin(role) {
    document.getElementById('login-title').innerHTML = role === 'admin' ? '<i class="fas fa-user-shield"></i> Login Admin' : '<i class="fas fa-user"></i> Login Staff';
    document.getElementById('login-modal').style.display = 'block';
    document.getElementById('login-role').value = role;
}

function closeLogin() {
    document.getElementById('login-modal').style.display = 'none';
}

async function login(username, password, role) {
    console.log('Login attempt:', username, role);
    loginOffline(username, password, role);
}

function loginOffline(username, password, role) {
    console.log('Login offline:', username);
    const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const defaultUsers = [
        { username: 'admin', password: 'admin123', name: 'Administrator', role: 'admin', approved: true },
        { username: 'staff', password: 'staff123', name: 'Staff', role: 'staff', approved: true }
    ];
    
    const allUsers = [...defaultUsers, ...storedUsers];
    const user = allUsers.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
    
    console.log('User found:', user);
    
    if (user) {
        if (role && user.role !== role) {
            alert('Username atau password salah!');
            return;
        }
        if (!user.approved) {
            alert('Akun menunggu persetujuan admin.');
            return;
        }
        localStorage.setItem('currentUser', JSON.stringify(user));
        window.location.href = user.role === 'admin' ? 'admin.html' : 'staff.html';
    } else {
        alert('Username atau password salah!\n\nCoba: admin / admin123');
    }
}

function logout() {
    token = null;
    currentUser = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

function showRegisterStaff() {
    document.getElementById('register-staff-modal').style.display = 'block';
}

function closeRegisterStaff() {
    document.getElementById('register-staff-modal').style.display = 'none';
}

async function registerStaff(username, password, name) {
    try {
        await api.post('/auth/register', { username, password, name });
        closeRegisterStaff();
        alert('Pengajuan berhasil! Menunggu persetujuan admin.');
    } catch (error) {
        registerStaffOffline(username, password, name);
    }
}

function registerStaffOffline(username, password, name) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    if (users.find(u => u.username === username)) {
        alert('Username sudah terdaftar!');
        return;
    }
    users.push({
        username,
        password,
        name,
        role: 'staff',
        approved: false
    });
    localStorage.setItem('users', JSON.stringify(users));
    closeRegisterStaff();
    alert('Pengajuan berhasil! Menunggu persetujuan admin.');
}

async function loadSummary() {
    try {
        const data = await api.get('/reports/summary');
        updateStats(data);
        localStorage.setItem('summary', JSON.stringify(data));
    } catch (e) {
        console.log('Using default summary data (API unavailable)');
        updateStats(DEFAULT_SUMMARY);
    }
}

function updateStats(data) {
    const elements = ['total-students', 'total-balance', 'today-transactions', 'monthly-transactions', 'total-staff', 'pending-approvals'];
    elements.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            if (id === 'total-balance') {
                el.textContent = `Rp${(data.total_balance || 0).toLocaleString()}`;
            } else if (id === 'pending-approvals') {
                el.textContent = data.pending_count || 0;
            } else if (id === 'total-students') {
                el.textContent = data.total_students || 0;
            } else if (id === 'today-transactions') {
                el.textContent = data.today_transactions || 0;
            } else if (id === 'monthly-transactions') {
                el.textContent = data.monthly_transactions || 0;
            } else if (id === 'total-staff') {
                el.textContent = data.active_staff || 0;
            }
        }
    });
    
    const cardElements = ['total-students-card', 'total-balance-card', 'today-transactions-card', 'total-staff-card'];
    cardElements.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            if (id === 'total-balance-card') {
                el.textContent = `Rp${(data.total_balance || 0).toLocaleString()}`;
            } else if (id === 'total-students-card') {
                el.textContent = data.total_students || 0;
            } else if (id === 'today-transactions-card') {
                el.textContent = data.today_transactions || 0;
            } else if (id === 'total-staff-card') {
                el.textContent = data.active_staff || 0;
            }
        }
    });
}

async function loadStudents() {
    try {
        const students = await api.get('/students?status=active');
        localStorage.setItem('students', JSON.stringify(students));
        renderStudents(students);
    } catch (e) {
        const stored = JSON.parse(localStorage.getItem('students') || '[]');
        renderStudents(getSampleStudents());
    }
}

function renderStudents(students) {
    allStudentsData = students;
    const tbody = document.getElementById('student-list');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    students.forEach((student, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td><strong>${student.name}</strong></td>
            <td>${student.nis || '-'}</td>
            <td>${student.class}</td>
            <td>${student.gender === 'L' ? 'L' : student.gender === 'P' ? 'P' : '-'}</td>
            <td>${student.parent_name || '-'}</td>
            <td>${student.parent_phone || '-'}</td>
            <td><span class="balance">Rp${(student.balance || 0).toLocaleString()}</span></td>
            <td>
                <button class="btn-icon" onclick="viewStudentDetail(${student.id})" title="Lihat"><i class="fas fa-eye"></i></button>
                <button class="btn-icon" onclick="editStudent(${student.id})" title="Edit"><i class="fas fa-edit"></i></button>
                <button class="btn-icon" onclick="deleteStudent(${student.id})" title="Hapus"><i class="fas fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function getSampleStudents() {
    return [
        { id: 1, name: 'Ahmad Fauzi', nis: '2024001', class: '7A', balance: 150000 },
        { id: 2, name: 'Budi Santoso', nis: '2024002', class: '7A', balance: 225000 },
        { id: 3, name: 'Citra Dewi', nis: '2024003', class: '7B', balance: 180000 },
        { id: 4, name: 'Dedi Kurniawan', nis: '2024004', class: '8A', balance: 350000 },
        { id: 5, name: 'Eka Putri', nis: '2024005', class: '8A', balance: 275000 }
    ];
}

async function loadStudentSelect() {
    try {
        const students = await api.get('/students?status=active');
        renderStudentSelect(students);
    } catch (e) {
        renderStudentSelect(getSampleStudents());
    }
}

function renderStudentSelect(students) {
    const select = document.getElementById('student-select');
    if (!select) return;
    select.innerHTML = '<option value="">Pilih Santri</option>';
    
    students.forEach(student => {
        const option = document.createElement('option');
        option.value = student.id;
        option.textContent = `${student.name} - Kelas ${student.class} (Rp${(student.balance || 0).toLocaleString()})`;
        select.appendChild(option);
    });
}

async function loadTransactions(limit = 50) {
    try {
        const transactions = await api.get(`/transactions?limit=${limit}`);
        localStorage.setItem('transactions', JSON.stringify(transactions));
        renderTransactions(transactions);
    } catch (e) {
        renderTransactions(getSampleTransactions());
    }
}

function renderTransactions(transactions) {
    const tbody = document.getElementById('savings-list') || document.getElementById('transaction-list');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    transactions.forEach((trans, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${new Date(trans.created_at || Date.now()).toLocaleDateString('id-ID')}</td>
            <td>${trans.student_name || 'Santri'}</td>
            <td><span class="badge badge-${trans.type === 'deposit' ? 'success' : 'danger'}">${trans.type === 'deposit' ? 'Setor' : 'Tarik'}</span></td>
            <td>Rp${(trans.amount || 0).toLocaleString()}</td>
        `;
        tbody.appendChild(tr);
    });
}

function getSampleTransactions() {
    return [
        { id: 1, student_name: 'Ahmad Fauzi', type: 'deposit', amount: 50000, created_at: new Date().toISOString() },
        { id: 2, student_name: 'Budi Santoso', type: 'deposit', amount: 75000, created_at: new Date().toISOString() },
        { id: 3, student_name: 'Citra Dewi', type: 'withdraw', amount: 25000, created_at: new Date().toISOString() },
        { id: 4, student_name: 'Dedi Kurniawan', type: 'deposit', amount: 100000, created_at: new Date().toISOString() }
    ];
}

async function addStudent(name, nis, className, birth_date, gender, parent_name, parent_phone, address) {
    try {
        await api.post('/students', { name, nis, class: className, birth_date, gender, parent_name, parent_phone, address });
        alert('Santri berhasil ditambahkan!');
        loadStudents();
    } catch (error) {
        addStudentOffline(name, nis, className, birth_date, gender, parent_name, parent_phone, address);
    }
}

function addStudentOffline(name, nis, className, birth_date, gender, parent_name, parent_phone, address) {
    const students = JSON.parse(localStorage.getItem('students') || '[]');
    const newStudent = {
        id: Date.now(),
        name,
        nis,
        class: className,
        birth_date,
        gender,
        parent_name,
        parent_phone,
        address,
        balance: 0,
        status: 'active',
        created_at: new Date().toISOString()
    };
    students.push(newStudent);
    localStorage.setItem('students', JSON.stringify(students));
    alert('Santri berhasil ditambahkan!');
    loadStudents();
}

async function addTransaction(student_id, type, amount, description) {
    try {
        const data = await api.post('/transactions', { student_id, type, amount, description });
        alert(`Transaksi berhasil! Saldo baru: Rp${data.new_balance.toLocaleString()}`);
        loadTransactions();
        loadSummary();
    } catch (error) {
        addTransactionOffline(student_id, type, amount, description);
    }
}

function addTransactionOffline(student_id, type, amount, description) {
    const students = JSON.parse(localStorage.getItem('students') || '[]');
    const student = students.find(s => s.id == student_id);
    
    if (!student) {
        alert('Santri tidak ditemukan!');
        return;
    }
    
    if (type === 'withdraw' && student.balance < amount) {
        alert('Saldo tidak mencukupi!');
        return;
    }
    
    student.balance = type === 'deposit' ? student.balance + amount : student.balance - amount;
    localStorage.setItem('students', JSON.stringify(students));
    
    const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
    transactions.unshift({
        id: Date.now(),
        student_id,
        student_name: student.name,
        type,
        amount,
        description,
        staff_name: 'Staff',
        created_at: new Date().toISOString()
    });
    localStorage.setItem('transactions', JSON.stringify(transactions));
    
    alert(`Transaksi berhasil! Saldo baru: Rp${student.balance.toLocaleString()}`);
    loadTransactions();
    loadSummary();
}

function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');
    
    document.querySelectorAll('.sidebar-menu li').forEach(li => {
        li.classList.remove('active');
        if (li.dataset.section === sectionId) li.classList.add('active');
    });
    
    if (sectionId === 'dashboard') {
        loadSummary();
    } else if (sectionId === 'manage-students' || sectionId === 'view-students') {
        loadStudents();
    } else if (sectionId === 'edit-student' || sectionId === 'view-student') {
        // Loaded via buttons
    } else if (sectionId === 'manage-savings' || sectionId === 'manage-transactions') {
        loadStudentSelect();
    } else if (sectionId === 'transactions' || sectionId === 'my-transactions') {
        loadTransactions();
    } else if (sectionId === 'reports') {
        generateReport();
    } else if (sectionId === 'student-reports') {
        loadStudentReportSelect();
    }
}

async function generateReport() {
    try {
        const students = await api.get('/reports/students');
        renderReport(students);
    } catch (e) {
        renderReport(getSampleStudents());
    }
}

function renderReport(students) {
    let report = `<h3>Laporan Tabungan Santri</h3>`;
    report += `<p>Tanggal: ${new Date().toLocaleDateString('id-ID')}</p>`;
    report += `<p>Total Santi: ${students.length}</p>`;
    
    let totalBalance = 0;
    students.forEach(s => totalBalance += (s.balance || 0));
    report += `<p>Total Saldo: Rp${totalBalance.toLocaleString()}</p>`;
    
    report += '<table class="data-table"><thead><tr><th>Nama</th><th>Kelas</th><th>Saldo</th></tr></thead><tbody>';
    students.forEach(s => {
        report += `<tr><td>${s.name}</td><td>${s.class}</td><td>Rp${(s.balance || 0).toLocaleString()}</td></tr>`;
    });
    report += '</tbody></table>';
    
    document.getElementById('report-output').innerHTML = report;
    
    if (document.getElementById('summary-students')) {
        document.getElementById('summary-students').textContent = students.length;
    }
    if (document.getElementById('summary-balance')) {
        document.getElementById('summary-balance').textContent = `Rp${totalBalance.toLocaleString()}`;
    }
    if (document.getElementById('summary-monthly')) {
        const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
        document.getElementById('summary-monthly').textContent = transactions.length;
    }
}

function exportPDF() {
    const students = JSON.parse(localStorage.getItem('students') || '[]');
    let csvContent = 'Nama,Kelas,NIS,Saldo\n';
    students.forEach(s => {
        csvContent += `${s.name},${s.class},${s.nis || ''},${s.balance}\n`;
    });
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'santri.csv';
    a.click();
}

function exportCSV() {
    exportPDF();
}

function exportTransactions() {
    const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
    let csvContent = 'Tanggal,Nama Santri,Jenis,Jumlah,Keterangan\n';
    transactions.forEach(t => {
        csvContent += `${new Date(t.created_at).toLocaleDateString('id-ID')},${t.student_name},${t.type},${t.amount},${t.description || ''}\n`;
    });
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transaksi.csv';
    a.click();
}

function checkAuth() {
    const user = localStorage.getItem('user') || localStorage.getItem('currentUser');
    if (!user && !window.location.pathname.includes('index.html')) {
        window.location.href = 'index.html';
    }
    currentUser = user ? JSON.parse(user) : null;
}

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    
    if (window.location.pathname.includes('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/')) {
        loadSummary();
    }
    
    if (window.location.pathname.includes('admin.html') || window.location.pathname.includes('staff.html')) {
        document.body.classList.add('has-sidebar');
        showSection('dashboard');
        loadSummary();
    }
    
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const roleInput = document.getElementById('login-role');
            const role = roleInput ? roleInput.value : 'staff';
            console.log('Form submitted:', username, role);
            login(username, password, role);
            return false;
        });
    }
    
    const studentForm = document.getElementById('student-form');
    if (studentForm) {
        studentForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('student-name').value;
            const nis = document.getElementById('student-nis').value;
            const className = document.getElementById('student-class').value;
            const birth_date = document.getElementById('student-birth').value;
            const gender = document.getElementById('student-gender').value;
            const parent_name = document.getElementById('parent-name').value;
            const parent_phone = document.getElementById('parent-phone').value;
            const address = document.getElementById('student-address').value;
            addStudent(name, nis, className, birth_date, gender, parent_name, parent_phone, address);
            studentForm.reset();
        });
    }
    
    const transForm = document.getElementById('transaction-form') || document.getElementById('savings-form');
    if (transForm) {
        transForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const student_id = parseInt(document.getElementById('student-select').value);
            const amount = parseFloat(document.getElementById('amount').value);
            const type = document.getElementById('type').value;
            const description = document.getElementById('description')?.value || '';
            addTransaction(student_id, type, amount, description);
            transForm.reset();
        });
    }
    
    const regForm = document.getElementById('register-staff-form');
    if (regForm) {
        regForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('reg-username').value;
            const password = document.getElementById('reg-password').value;
            const name = document.getElementById('reg-name').value;
            registerStaff(username, password, name);
            regForm.reset();
        });
    }
    
    const editStudentForm = document.getElementById('edit-student-form');
    if (editStudentForm) {
        editStudentForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveStudent();
        });
    }
});

function viewStudent(id) {
    viewStudentDetail(id);
}

function deleteStudent(id) {
    const students = JSON.parse(localStorage.getItem('students') || '[]');
    const student = students.find(s => s.id == id);
    
    if (student && student.balance > 0) {
        alert('Tidak dapat menghapus santrian dengan saldo tabungan!');
        return;
    }
    
    if (confirm('Yakin ingin menghapus santrian ini?')) {
        const updated = students.filter(s => s.id != id);
        localStorage.setItem('students', JSON.stringify(updated));
        loadStudents();
    }
}

function editStudent(id) {
    const students = JSON.parse(localStorage.getItem('students') || '[]');
    const sampleStudents = getSampleStudents();
    const allStudents = students.length > 0 ? students : sampleStudents;
    const student = allStudents.find(s => s.id == id);
    
    if (!student) {
        alert('Santri tidak ditemukan!');
        return;
    }
    
    showSection('edit-student');
    
    document.getElementById('edit-student-id').value = student.id;
    document.getElementById('edit-student-name').value = student.name || '';
    document.getElementById('edit-student-nis').value = student.nis || '';
    document.getElementById('edit-student-class').value = student.class || '';
    document.getElementById('edit-student-birth').value = student.birth_date || '';
    document.getElementById('edit-student-gender').value = student.gender || '';
    document.getElementById('edit-parent-name').value = student.parent_name || '';
    document.getElementById('edit-parent-phone').value = student.parent_phone || '';
    document.getElementById('edit-student-address').value = student.address || '';
    document.getElementById('edit-student-status').value = student.status || 'active';
    
    document.getElementById('edit-student-title').textContent = 'Edit Data: ' + student.name;
}

function saveStudent() {
    const id = document.getElementById('edit-student-id').value;
    const name = document.getElementById('edit-student-name').value;
    const nis = document.getElementById('edit-student-nis').value;
    const className = document.getElementById('edit-student-class').value;
    const birth_date = document.getElementById('edit-student-birth').value;
    const gender = document.getElementById('edit-student-gender').value;
    const parent_name = document.getElementById('edit-parent-name').value;
    const parent_phone = document.getElementById('edit-parent-phone').value;
    const address = document.getElementById('edit-student-address').value;
    const status = document.getElementById('edit-student-status').value;
    
    const students = JSON.parse(localStorage.getItem('students') || '[]');
    const index = students.findIndex(s => s.id == id);
    
    if (index !== -1) {
        students[index] = {
            ...students[index],
            name, nis, class: className, birth_date, gender, parent_name, parent_phone, address, status
        };
        localStorage.setItem('students', JSON.stringify(students));
        alert('Data berhasil diperbarui!');
        showSection('manage-students');
    } else {
        alert('Gagal menyimpan data!');
    }
}

function viewStudentDetail(id) {
    const students = JSON.parse(localStorage.getItem('students') || '[]');
    const sampleStudents = getSampleStudents();
    const allStudents = students.length > 0 ? students : sampleStudents;
    const student = allStudents.find(s => s.id == id);
    
    if (!student) return;
    
    showSection('view-student');
    
    document.getElementById('view-name').textContent = student.name || '-';
    document.getElementById('view-nis').textContent = student.nis || '-';
    document.getElementById('view-class').textContent = student.class || '-';
    document.getElementById('view-birth').textContent = student.birth_date || '-';
    document.getElementById('view-gender').textContent = student.gender === 'L' ? 'Laki-laki' : student.gender === 'P' ? 'Perempuan' : '-';
    document.getElementById('view-status').innerHTML = student.status === 'active' ? '<span class="badge badge-success">Aktif</span>' : '<span class="badge badge-warning">Nonaktif</span>';
    document.getElementById('view-parent-name').textContent = student.parent_name || '-';
    document.getElementById('view-parent-phone').textContent = student.parent_phone || '-';
    document.getElementById('view-address').textContent = student.address || '-';
    document.getElementById('view-balance').textContent = `Rp${(student.balance || 0).toLocaleString()}`;
}

function quickTransaction() {
    showSection('manage-savings');
    const studentId = document.getElementById('view-student')?.querySelector('[id="edit-student-id"]')?.value;
    if (studentId) {
        document.getElementById('student-select').value = studentId;
    }
}

let allStudentsData = [];

function searchStudents() {
    const query = document.getElementById('search-student').value.toLowerCase();
    const filtered = allStudentsData.filter(s => 
        (s.name || '').toLowerCase().includes(query) || 
        (s.nis || '').toLowerCase().includes(query) ||
        (s.class || '').toLowerCase().includes(query)
    );
    renderStudents(filtered);
}

function loadStudentReportSelect() {
    const select = document.getElementById('report-student-select');
    if (!select) return;
    
    const students = JSON.parse(localStorage.getItem('students') || '[]');
    const sampleStudents = getSampleStudents();
    const allStudents = students.length > 0 ? students : sampleStudents;
    
    select.innerHTML = '<option value="">-- Pilih Santri --</option>';
    allStudents.forEach(student => {
        const option = document.createElement('option');
        option.value = student.id;
        option.textContent = `${student.name} - ${student.class}`;
        select.appendChild(option);
    });
}

function loadStudentReport() {
    const select = document.getElementById('report-student-select');
    const studentId = select.value;
    
    if (!studentId) {
        document.getElementById('student-report-detail').style.display = 'none';
        document.getElementById('student-report-transactions').style.display = 'none';
        document.getElementById('student-report-summary').style.display = 'none';
        return;
    }
    
    const students = JSON.parse(localStorage.getItem('students') || '[]');
    const sampleStudents = getSampleStudents();
    const allStudents = students.length > 0 ? students : sampleStudents;
    const student = allStudents.find(s => s.id == studentId);
    
    if (!student) return;
    
    document.getElementById('student-report-detail').style.display = 'block';
    document.getElementById('student-report-transactions').style.display = 'block';
    document.getElementById('student-report-summary').style.display = 'block';
    
    document.getElementById('report-student-name').textContent = student.name;
    document.getElementById('report-student-nis').textContent = student.nis || '-';
    document.getElementById('report-student-class').textContent = student.class;
    document.getElementById('report-student-parent').textContent = student.parent_name || '-';
    document.getElementById('report-student-balance').textContent = `Rp${(student.balance || 0).toLocaleString()}`;
    
    const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
    const studentTransactions = transactions.filter(t => t.student_id == studentId);
    
    const tbody = document.getElementById('student-transaction-list');
    tbody.innerHTML = '';
    
    if (studentTransactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--gray-500)">Belum ada transaksi</td></tr>';
    } else {
        let totalDeposit = 0;
        let totalWithdraw = 0;
        
        studentTransactions.forEach((trans, index) => {
            const tr = document.createElement('tr');
            const isDeposit = trans.type === 'deposit';
            if (isDeposit) totalDeposit += trans.amount;
            else totalWithdraw += trans.amount;
            
            tr.innerHTML = `
                <td>${index + 1}</td>
                <td>${new Date(trans.created_at).toLocaleDateString('id-ID')}</td>
                <td><span class="badge badge-${isDeposit ? 'success' : 'danger'}">${isDeposit ? 'Setor' : 'Tarik'}</span></td>
                <td>Rp${trans.amount.toLocaleString()}</td>
                <td>${trans.description || '-'}</td>
            `;
            tbody.appendChild(tr);
        });
        
        document.getElementById('total-deposit').textContent = `Rp${totalDeposit.toLocaleString()}`;
        document.getElementById('total-withdraw').textContent = `Rp${totalWithdraw.toLocaleString()}`;
        document.getElementById('total-trans-count').textContent = studentTransactions.length;
    }
}

function printStudentReport() {
    const studentId = document.getElementById('report-student-select').value;
    if (!studentId) return;
    
    const students = JSON.parse(localStorage.getItem('students') || '[]');
    const sampleStudents = getSampleStudents();
    const allStudents = students.length > 0 ? students : sampleStudents;
    const student = allStudents.find(s => s.id == studentId);
    
    if (!student) return;
    
    const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
    const studentTransactions = transactions.filter(t => t.student_id == studentId);
    
    let printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Laporan Tabungan - ${student.name}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h1 { text-align: center; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background: #f2f2f2; }
                .info { margin-bottom: 20px; }
                .info p { margin: 5px 0; }
            </style>
        </head>
        <body>
            <h1>Laporan Tabungan Santri</h1>
            <div class="info">
                <p><strong>Nama:</strong> ${student.name}</p>
                <p><strong>NIS:</strong> ${student.nis || '-'}</p>
                <p><strong>Kelas:</strong> ${student.class}</p>
                <p><strong>Saldo Saat Ini:</strong> Rp${(student.balance || 0).toLocaleString()}</p>
            </div>
            <h3>Riwayat Transaksi</h3>
            <table>
                <thead>
                    <tr>
                        <th>No</th>
                        <th>Tanggal</th>
                        <th>Jenis</th>
                        <th>Jumlah</th>
                        <th>Keterangan</th>
                    </tr>
                </thead>
                <tbody>
                    ${studentTransactions.map((t, i) => `
                        <tr>
                            <td>${i+1}</td>
                            <td>${new Date(t.created_at).toLocaleDateString()}</td>
                            <td>${t.type === 'deposit' ? 'Setor' : 'Tarik'}</td>
                            <td>Rp${t.amount.toLocaleString()}</td>
                            <td>${t.description || '-'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <script>window.print()</script>
        </body>
        </html>
    `);
}

document.getElementById('current-date') && (document.getElementById('current-date').textContent = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));

console.log('App initialized');