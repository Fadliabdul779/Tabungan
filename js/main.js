import { SUPABASE_URL, SUPABASE_KEY } from './config.js'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

window.supabase = supabase

const DEFAULT_SUMMARY = {
    total_students: 127,
    total_balance: 45678900,
    today_transactions: 12,
    monthly_transactions: 89,
    active_staff: 5,
    pending_count: 2
}

let currentUser = null

function getBaseURL() {
    const path = window.location.pathname
    const isIndex = path === '/' || path.endsWith('index.html') || path === ''
    return isIndex ? '' : path.split('/').slice(0, -1).join('/') || '.'
}

function showLogin(role) {
    const modal = document.getElementById('login-modal')
    const title = document.getElementById('login-title')
    if (title) {
        title.innerHTML = role === 'admin' ? '<i class="fas fa-user-shield"></i> Login Admin' : '<i class="fas fa-user"></i> Login Staff'
    }
    if (modal) modal.style.display = 'block'
    const roleInput = document.getElementById('login-role')
    if (roleInput) roleInput.value = role
}

function closeLogin() {
    const modal = document.getElementById('login-modal')
    if (modal) modal.style.display = 'none'
}

async function login(username, password, role) {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single()

    if (error || !data) {
        alert('Username atau password salah!')
        return
    }

    if (data.password !== password) {
        alert('Username atau password salah!')
        return
    }

    if (data.role !== role) {
        alert('Role tidak sesuai!')
        return
    }

    if (!data.approved) {
        alert('Akun menunggu persetujuan admin.')
        return
    }

    localStorage.setItem('currentUser', JSON.stringify(data))
    window.location.href = role === 'admin' ? '/admin.html' : '/staff.html'
}

function logout() {
    localStorage.removeItem('currentUser')
    window.location.href = '/index.html'
}

function showRegisterStaff() {
    const modal = document.getElementById('register-staff-modal')
    if (modal) modal.style.display = 'block'
}

function closeRegisterStaff() {
    const modal = document.getElementById('register-staff-modal')
    if (modal) modal.style.display = 'none'
}

async function registerStaff(username, password, name) {
    const { error } = await supabase
        .from('users')
        .insert([{ username, password, name, role: 'staff', approved: false }])

    if (error) {
        alert(error.message)
        return
    }

    closeRegisterStaff()
    alert('Pengajuan berhasil! Menunggu persetujuan admin.')
}

async function loadSummary() {
    const { count: studentsCount } = await supabase.from('students').select('*', { count: 'exact', head: true })
    const { data: students } = await supabase.from('students').select('balance')
    const totalBalance = students?.reduce((sum, s) => sum + (s.balance || 0), 0) || 0
    
    const today = new Date().toISOString().split('T')[0]
    const { count: todayTrans } = await supabase.from('transactions').select('*', { count: 'exact', head: true }).gte('created_at', today)
    
    const { count: staffCount } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'staff').eq('approved', true)

    updateStats({
        total_students: studentsCount || 0,
        total_balance: totalBalance,
        today_transactions: todayTrans || 0,
        active_staff: staffCount || 0
    })
}

function updateStats(data) {
    const elements = ['total-students', 'total-balance', 'today-transactions', 'monthly-transactions', 'total-staff', 'pending-approvals']
    elements.forEach(id => {
        const el = document.getElementById(id)
        if (el) {
            if (id === 'total-balance') el.textContent = `Rp${(data.total_balance || 0).toLocaleString()}`
            else if (id === 'total-students') el.textContent = data.total_students || 0
            else if (id === 'today-transactions') el.textContent = data.today_transactions || 0
            else if (id === 'total-staff') el.textContent = data.active_staff || 0
        }
    })

    const cardElements = ['total-students-card', 'total-balance-card', 'today-transactions-card', 'total-staff-card']
    cardElements.forEach(id => {
        const el = document.getElementById(id)
        if (el) {
            if (id === 'total-balance-card') el.textContent = `Rp${(data.total_balance || 0).toLocaleString()}`
            else if (id === 'total-students-card') el.textContent = data.total_students || 0
            else if (id === 'today-transactions-card') el.textContent = data.today_transactions || 0
            else if (id === 'total-staff-card') el.textContent = data.active_staff || 0
        }
    })
}

async function loadStudents() {
    const { data: students } = await supabase.from('students').select('*').order('created_at', { ascending: false })
    renderStudents(students || [])
}

function renderStudents(students) {
    const tbody = document.getElementById('student-list')
    if (!tbody) return
    tbody.innerHTML = ''

    students.forEach((student, index) => {
        const tr = document.createElement('tr')
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
        `
        tbody.appendChild(tr)
    })
}

async function loadStudentSelect() {
    const { data: students } = await supabase.from('students').select('id, name, class, balance').order('name')
    const select = document.getElementById('student-select')
    if (!select) return
    select.innerHTML = '<option value="">Pilih Santri</option>'
    students?.forEach(student => {
        const option = document.createElement('option')
        option.value = student.id
        option.textContent = `${student.name} - Kelas ${student.class} (Rp${(student.balance || 0).toLocaleString()})`
        select.appendChild(option)
    })
}

async function loadTransactions() {
    const { data: transactions } = await supabase
        .from('transactions')
        .select('*, students(name)')
        .order('created_at', { ascending: false })
        .limit(50)

    const tbody = document.getElementById('savings-list') || document.getElementById('transaction-list')
    if (!tbody) return
    tbody.innerHTML = ''

    transactions?.forEach((trans, index) => {
        const tr = document.createElement('tr')
        tr.innerHTML = `
            <td>${index + 1}</td>
            <td>${new Date(trans.created_at).toLocaleDateString('id-ID')}</td>
            <td>${trans.students?.name || 'Santri'}</td>
            <td><span class="badge badge-${trans.type === 'deposit' ? 'success' : 'danger'}">${trans.type === 'deposit' ? 'Setor' : 'Tarik'}</span></td>
            <td>Rp${(trans.amount || 0).toLocaleString()}</td>
        `
        tbody.appendChild(tr)
    })
}

async function addStudent(name, nis, className, birth_date, gender, parent_name, parent_phone, address) {
    const { error } = await supabase
        .from('students')
        .insert([{ name, nis, class: className, birth_date, gender, parent_name, parent_phone, address, balance: 0 }])

    if (error) {
        alert(error.message)
        return
    }

    alert('Santri berhasil ditambahkan!')
    loadStudents()
}

async function addTransaction(student_id, type, amount, description) {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}')

    const { data: student } = await supabase.from('students').select('balance').eq('id', student_id).single()
    
    if (!student) {
        alert('Santri tidak ditemukan!')
        return
    }

    if (type === 'withdraw' && student.balance < amount) {
        alert('Saldo tidak mencukupi!')
        return
    }

    const newBalance = type === 'deposit' ? student.balance + amount : student.balance - amount

    await supabase.from('transactions').insert([{ student_id, type, amount, description, staff_id: user.id }])
    await supabase.from('students').update({ balance: newBalance }).eq('id', student_id)

    alert(`Transaksi berhasil! Saldo baru: Rp${newBalance.toLocaleString()}`)
    loadTransactions()
    loadSummary()
}

function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'))
    const section = document.getElementById(sectionId)
    if (section) section.classList.add('active')

    document.querySelectorAll('.sidebar-menu li').forEach(li => {
        li.classList.remove('active')
        if (li.dataset.section === sectionId) li.classList.add('active')
    })

    if (sectionId === 'dashboard') loadSummary()
    else if (sectionId === 'manage-students') loadStudents()
    else if (sectionId === 'manage-savings' || sectionId === 'manage-transactions') { loadStudentSelect(); loadTransactions() }
    else if (sectionId === 'transactions' || sectionId === 'my-transactions') loadTransactions()
    else if (sectionId === 'student-reports') loadStudentReportSelect()
    else if (sectionId === 'reports') loadReportData()
}

async function loadReportData() {
    const { data: students } = await supabase.from('students').select('*').order('name')
    const { data: transactions } = await supabase.from('transactions').select('*').order('created_at', { ascending: false })
    
    const totalBalance = students.reduce((sum, s) => sum + (s.balance || 0), 0)
    const thisMonth = transactions.filter(t => {
        const d = new Date(t.created_at)
        const now = new Date()
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })
    
    if (document.getElementById('summary-students')) {
        document.getElementById('summary-students').textContent = students.length
    }
    if (document.getElementById('summary-balance')) {
        document.getElementById('summary-balance').textContent = `Rp${totalBalance.toLocaleString()}`
    }
    if (document.getElementById('summary-monthly')) {
        document.getElementById('summary-monthly').textContent = thisMonth.length
    }
}

async function exportCSV() {
    const { data: students } = await supabase.from('students').select('*').order('name')
    
    let csv = 'NIS,Nama,Kelas,Jenis Kelamin,Orang Tua,No HP,Alamat,Saldo,Status\n'
    students?.forEach(s => {
        csv += `${s.nis || ''},"${s.name}",${s.class},"${s.gender || ''}","${s.parent_name || ''}","${s.parent_phone || ''}","${s.address || ''}",${s.balance},"${s.status}"\n`
    })
    
    downloadFile(csv, 'santri.csv', 'text/csv')
}

async function exportTransactions() {
    const { data: transactions } = await supabase
        .from('transactions')
        .select('*, students(name)')
        .order('created_at', { ascending: false })
    
    let csv = 'Tanggal,Nama Santri,Jenis,Jumlah,Keterangan,Petugas ID\n'
    transactions?.forEach(t => {
        csv += `${new Date(t.created_at).toLocaleDateString('id-ID')},"${t.students?.name || ''}",${t.type},${t.amount},"${t.description || ''}",${t.staff_id}\n`
    })
    
    downloadFile(csv, 'transaksi.csv', 'text/csv')
}

async function exportPDF() {
    alert('Export PDF menggunakan fitur Print Browser. Klik OK lalu pilih "Save as PDF"')
    window.print()
}

function downloadFile(content, filename, type) {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
}

function editStudent(id) {
    window.location.href = `/edit-student.html?id=${id}`
}

function viewStudentDetail(id) {
    window.location.href = `/view-student.html?id=${id}`
}

async function loadStudentReportSelect() {
    const { data: students } = await supabase.from('students').select('id, name, class').order('name')
    const select = document.getElementById('report-student-select')
    if (!select) return
    select.innerHTML = '<option value="">-- Pilih Santri --</option>'
    students?.forEach(s => {
        const opt = document.createElement('option')
        opt.value = s.id
        opt.textContent = `${s.name} - ${s.class}`
        select.appendChild(opt)
    })
}

async function deleteStudent(id) {
    const { data: student } = await supabase.from('students').select('balance').eq('id', id).single()
    
    if (student && student.balance > 0) {
        alert('Tidak dapat menghapus santrian dengan saldo tabungan!')
        return
    }

    if (confirm('Yakin ingin menghapus santrian ini?')) {
        await supabase.from('students').delete().eq('id', id)
        loadStudents()
    }
}

function checkAuth() {
    const user = localStorage.getItem('currentUser')
    if (!user && !window.location.pathname.includes('index.html')) {
        window.location.href = '/index.html'
    }
    currentUser = user ? JSON.parse(user) : null
}

window.showLogin = showLogin
window.closeLogin = closeLogin
window.login = login
window.logout = logout
window.showRegisterStaff = showRegisterStaff
window.closeRegisterStaff = closeRegisterStaff
window.registerStaff = registerStaff
window.showSection = showSection
window.editStudent = editStudent
window.viewStudentDetail = viewStudentDetail
window.deleteStudent = deleteStudent
window.addStudent = addStudent
window.addTransaction = addTransaction
window.loadSummary = loadSummary
window.exportCSV = exportCSV
window.exportTransactions = exportTransactions
window.exportPDF = exportPDF
window.loadStudentReportSelect = loadStudentReportSelect

document.addEventListener('DOMContentLoaded', () => {
    checkAuth()
    
    if (window.location.pathname.includes('index.html') || window.location.pathname === '/' || window.location.pathname === '') {
        loadSummary()
    }

    const loginForm = document.getElementById('login-form')
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault()
            const username = document.getElementById('username').value
            const password = document.getElementById('password').value
            const roleInput = document.getElementById('login-role')
            const role = roleInput ? roleInput.value : 'staff'
            login(username, password, role)
        })
    }

    const studentForm = document.getElementById('student-form')
    if (studentForm) {
        studentForm.addEventListener('submit', (e) => {
            e.preventDefault()
            addStudent(
                document.getElementById('student-name').value,
                document.getElementById('student-nis').value,
                document.getElementById('student-class').value,
                document.getElementById('student-birth').value,
                document.getElementById('student-gender').value,
                document.getElementById('parent-name').value,
                document.getElementById('parent-phone').value,
                document.getElementById('student-address').value
            )
            studentForm.reset()
        })
    }

    const transForm = document.getElementById('transaction-form') || document.getElementById('savings-form')
    if (transForm) {
        transForm.addEventListener('submit', (e) => {
            e.preventDefault()
            const student_id = parseInt(document.getElementById('student-select').value)
            const amount = parseFloat(document.getElementById('amount').value)
            const type = document.getElementById('type').value
            const description = document.getElementById('description')?.value || ''
            addTransaction(student_id, type, amount, description)
            transForm.reset()
        })
    }

    const regForm = document.getElementById('register-staff-form')
    if (regForm) {
        regForm.addEventListener('submit', (e) => {
            e.preventDefault()
            registerStaff(
                document.getElementById('reg-username').value,
                document.getElementById('reg-password').value,
                document.getElementById('reg-name').value
            )
            regForm.reset()
        })
    }

    if (document.getElementById('current-date')) {
        document.getElementById('current-date').textContent = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    }

    if (window.location.pathname.includes('admin.html') || window.location.pathname.includes('staff.html')) {
        document.body.classList.add('has-sidebar')
        showSection('dashboard')
        loadSummary()
    }
})