document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await axios.post('/api/auth/login', {
            username: username,
            password: password
        });

        if (response.data.token) {
            // Store the token
            authService.setToken(response.data.token);
            
            // Redirect to dashboard
            window.location.href = '/dashboard.html';
        }
    } catch (error) {
        console.error('Login failed:', error);
        document.getElementById('errorMessage').textContent = 
            'Login failed. Please check your credentials.';
    }
}); 