let currentUser = null;
let topCoins = [];
let selectedCoin = null;
let priceUpdateInterval = null;
let lastPriceUpdate = 0;
const MIN_UPDATE_INTERVAL = 30000; // 30 seconds minimum between updates

// Initialize dark mode from localStorage
if (localStorage.getItem('darkMode') === 'true') {
    document.documentElement.classList.add('dark');
}

// Check for existing session on page load
document.addEventListener('DOMContentLoaded', () => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showPortfolio();
    }
});

function toggleDarkMode() {
    const html = document.documentElement;
    html.classList.toggle('dark');
    localStorage.setItem('darkMode', html.classList.contains('dark'));
}

function toggleForms() {
    document.getElementById('loginForm').classList.toggle('hidden');
    document.getElementById('registerForm').classList.toggle('hidden');
}

async function register(event) {
    event.preventDefault(); // Prevent form submission
    const username = document.getElementById('regUsername').value;
    const password = document.getElementById('regPassword').value;

    try {
        const response = await fetch('http://localhost:8090/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        if (response.ok) {
            alert('Registration successful! Please login.');
            toggleForms();
        } else {
            const error = await response.text();
            alert(error);
        }
    } catch (error) {
        alert('Error during registration');
    }
}

async function login(event) {
    event.preventDefault(); // Prevent form submission
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('http://localhost:8090/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        if (response.ok) {
            const data = await response.json();
            currentUser = data;
            // Save user data to localStorage
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            showPortfolio();
        } else {
            const error = await response.text();
            alert(error);
        }
    } catch (error) {
        alert('Error during login');
    }
}

function logout() {
    currentUser = null;
    // Clear user data from localStorage
    localStorage.removeItem('currentUser');
    clearInterval(priceUpdateInterval);
    document.getElementById('portfolioView').classList.add('hidden');
    document.getElementById('loginForm').classList.remove('hidden');
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
}

async function showPortfolio() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('registerForm').classList.add('hidden');
    document.getElementById('portfolioView').classList.remove('hidden');
    
    // Show initial loading state
    const portfolio = await loadPortfolio();
    // Immediately try to load coins
    await loadTopCoins();
    // Start the update interval
    startPriceUpdates();
}

async function loadTopCoins() {
    try {
        // Check if enough time has passed since the last update
        const now = Date.now();
        if (now - lastPriceUpdate < MIN_UPDATE_INTERVAL) {
            return;
        }

        const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        topCoins = data;
        lastPriceUpdate = now;
        await loadPortfolio();
    } catch (error) {
        console.error('Error loading top coins:', error);
        // Don't show alert to avoid disrupting UX
        // Only update the UI if we have previous data
        if (topCoins.length > 0) {
            await loadPortfolio();
        }
    }
}

function startPriceUpdates() {
    if (priceUpdateInterval) {
        clearInterval(priceUpdateInterval);
    }
    // Update every 30 seconds instead of 5
    priceUpdateInterval = setInterval(loadTopCoins, MIN_UPDATE_INTERVAL);
}

async function loadPortfolio() {
    try {
        const response = await fetch(`http://localhost:8090/api/portfolio/${currentUser.userId}`);
        const portfolio = await response.json();
        displayCryptoTable(portfolio.holdings || {});
        return portfolio;
    } catch (error) {
        console.error('Error loading portfolio:', error);
        displayCryptoTable({});  // Show empty state
        return { holdings: {} };
    }
}

function displayCryptoTable(holdings) {
    const tbody = document.getElementById('cryptoTableBody');
    tbody.innerHTML = '';

    if (topCoins.length === 0) {
        const loadingRow = document.createElement('tr');
        loadingRow.innerHTML = `
            <td colspan="7" class="py-4 text-center">
                <div class="flex items-center justify-center gap-2">
                    <svg class="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading cryptocurrencies...
                </div>
            </td>
        `;
        tbody.appendChild(loadingRow);
        return;
    }

    topCoins.forEach((coin, index) => {
        const holding = holdings[coin.symbol.toUpperCase()] || 0;
        const value = holding * coin.current_price;
        
        const row = document.createElement('tr');
        row.className = index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800' : 'bg-white dark:bg-gray-900';
        row.innerHTML = `
            <td class="py-4 px-2">${index + 1}</td>
            <td class="py-4 px-2">
                <div class="flex items-center gap-2">
                    <img src="${coin.image}" alt="${coin.name}" class="w-6 h-6">
                    <span>${coin.name} (${coin.symbol.toUpperCase()})</span>
                </div>
            </td>
            <td class="py-4 px-2">$${coin.current_price.toLocaleString()}</td>
            <td class="py-4 px-2 ${coin.price_change_percentage_24h >= 0 ? 'text-green-500' : 'text-red-500'}">
                ${coin.price_change_percentage_24h.toFixed(2)}%
            </td>
            <td class="py-4 px-2">${holding.toLocaleString()}</td>
            <td class="py-4 px-2">$${value.toLocaleString()}</td>
            <td class="py-4 px-2">
                <div class="flex gap-2">
                    <button onclick="showAddDialog('${coin.symbol}')" 
                            class="text-green-500 hover:text-green-700">+</button>
                    <button onclick="showRemoveDialog('${coin.symbol}')" 
                            class="text-red-500 hover:text-red-700"
                            ${holding <= 0 ? 'disabled' : ''}>−</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function showAddDialog(symbol) {
    selectedCoin = topCoins.find(coin => coin.symbol.toLowerCase() === symbol.toLowerCase());
    document.getElementById('addAmount').value = '';
    document.getElementById('addPrice').value = selectedCoin.current_price;
    document.getElementById('addTokenDialog').classList.remove('hidden');
}

function closeAddDialog() {
    document.getElementById('addTokenDialog').classList.add('hidden');
    selectedCoin = null;
}

function showRemoveDialog(symbol) {
    selectedCoin = topCoins.find(coin => coin.symbol.toLowerCase() === symbol.toLowerCase());
    document.getElementById('removeAmount').value = '';
    document.getElementById('removeTokenDialog').classList.remove('hidden');
}

function closeRemoveDialog() {
    document.getElementById('removeTokenDialog').classList.add('hidden');
    selectedCoin = null;
}

async function confirmAdd() {
    const amount = parseFloat(document.getElementById('addAmount').value);
    if (!amount || amount <= 0) {
        alert('Please enter a valid amount');
        return;
    }

    try {
        const response = await fetch(`http://localhost:8090/api/portfolio/${currentUser.userId}`);
        const portfolio = await response.json();
        
        const holdings = portfolio.holdings || {};
        const symbol = selectedCoin.symbol.toUpperCase();
        holdings[symbol] = (holdings[symbol] || 0) + amount;

        await fetch(`http://localhost:8090/api/portfolio/${currentUser.userId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ...portfolio, holdings }),
        });

        closeAddDialog();
        await loadPortfolio();
    } catch (error) {
        alert('Error adding holding');
    }
}

async function confirmRemove() {
    const amount = parseFloat(document.getElementById('removeAmount').value);
    if (!amount || amount <= 0) {
        alert('Please enter a valid amount');
        return;
    }

    try {
        const response = await fetch(`http://localhost:8090/api/portfolio/${currentUser.userId}`);
        const portfolio = await response.json();
        
        const holdings = portfolio.holdings || {};
        const symbol = selectedCoin.symbol.toUpperCase();
        
        if (!holdings[symbol] || holdings[symbol] < amount) {
            alert('Insufficient balance');
            return;
        }

        holdings[symbol] -= amount;
        if (holdings[symbol] <= 0) {
            delete holdings[symbol];
        }

        await fetch(`http://localhost:8090/api/portfolio/${currentUser.userId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ...portfolio, holdings }),
        });

        closeRemoveDialog();
        await loadPortfolio();
    } catch (error) {
        alert('Error removing holding');
    }
} 