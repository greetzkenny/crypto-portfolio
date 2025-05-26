// Check authentication on page load
document.addEventListener('DOMContentLoaded', function() {
    if (!authService.isAuthenticated()) {
        window.location.href = '/login.html';
        return;
    }

    // Load dashboard data
    loadDashboard();
});

async function loadDashboard() {
    try {
        // Load user's portfolio data
        const portfolioResponse = await axios.get('/api/portfolio');
        
        // Load crypto prices for portfolio coins
        const coins = portfolioResponse.data.map(holding => holding.coinId);
        const pricesResponse = await axios.get(`/api/crypto/prices?coins=${coins.join(',')}`);
        
        // Update UI with the data
        updateDashboard(portfolioResponse.data, pricesResponse.data);
    } catch (error) {
        console.error('Error loading dashboard:', error);
        if (error.response && error.response.status === 401) {
            // Token expired or invalid
            authService.removeToken();
            window.location.href = '/login.html';
        }
    }
}

function updateDashboard(portfolio, prices) {
    // Implementation of dashboard UI update
    // ... (your existing dashboard update code)
}

// Logout handler
document.getElementById('logoutButton')?.addEventListener('click', function() {
    authService.removeToken();
    window.location.href = '/login.html';
}); 