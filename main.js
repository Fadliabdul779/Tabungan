// Baris 41-70, ganti login function:
async function login(username, password, role) {
    try {
        const response = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        })
        
        const data = await response.json()
        
        if (!response.ok) {
            alert(data.error || 'Login gagal')
            return
        }
        
        // Simpan token JWT
        localStorage.setItem('token', data.token)
        localStorage.setItem('currentUser', JSON.stringify(data.user))
        
        // Redirect sesuai role
        window.location.href = data.user.role === 'admin' ? '/admin.html' : '/staff.html'
    } catch (error) {
        alert('Koneksi ke server gagal: ' + error.message)
    }
}
