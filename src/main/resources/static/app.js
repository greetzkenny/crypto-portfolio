let currentUser = null;
let topCoins = [];
let priceUpdateInterval = null;
let lastPriceUpdate = 0;
const MIN_UPDATE_INTERVAL = 30000; // 30 seconds minimum between updates
let currentSort = { column: 'market_cap', direction: 'desc' }; // Default sort by market cap

// Initialize dark mode and locale from localStorage
if (localStorage.getItem('darkMode') === 'true') {
    document.documentElement.classList.add('dark');
}

let currentLocale = localStorage.getItem('locale') || 'en-US';

// Check for existing session on page load
document.addEventListener('DOMContentLoaded', () => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showDashboard();
    }

    // Set up locale selector
    const localeSelector = document.getElementById('localeSelector');
    localeSelector.value = currentLocale;
    localeSelector.addEventListener('change', (e) => {
        currentLocale = e.target.value;
        localStorage.setItem('locale', currentLocale);
        if (topCoins.length > 0) {
            displayCryptoTable();
        }
    });

    // Set up sorting click handlers
    setupSortHandlers();
});

function setupSortHandlers() {
    const headers = document.querySelectorAll('th[data-sort]');
    headers.forEach(header => {
        header.addEventListener('click', () => {
            const column = header.dataset.sort;
            if (currentSort.column === column) {
                currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
            } else {
                currentSort.column = column;
                currentSort.direction = 'desc';
            }
            if (topCoins.length > 0) {
                displayCryptoTable();
            }
            updateSortIndicators();
        });
    });
}

function updateSortIndicators() {
    const headers = document.querySelectorAll('th[data-sort]');
    headers.forEach(header => {
        const arrow = header.querySelector('.sort-arrow');
        if (arrow) {
            if (header.dataset.sort === currentSort.column) {
                arrow.textContent = currentSort.direction === 'asc' ? '↑' : '↓';
                arrow.classList.remove('text-gray-400');
                arrow.classList.add('text-gray-700', 'dark:text-gray-300');
            } else {
                arrow.textContent = '↓';
                arrow.classList.remove('text-gray-700', 'dark:text-gray-300');
                arrow.classList.add('text-gray-400');
            }
        }
    });
}

function sortData() {
    const sortedCoins = [...topCoins];
    sortedCoins.sort((a, b) => {
        let aValue, bValue;
        
        switch (currentSort.column) {
            case 'market_cap':
                aValue = a.market_cap;
                bValue = b.market_cap;
                break;
            case '1h':
                aValue = a.price_change_percentage_1h_in_currency || 0;
                bValue = b.price_change_percentage_1h_in_currency || 0;
                break;
            case '24h':
                aValue = a.price_change_percentage_24h || 0;
                bValue = b.price_change_percentage_24h || 0;
                break;
            default:
                return 0;
        }

        if (currentSort.direction === 'asc') {
            return aValue - bValue;
        } else {
            return bValue - aValue;
        }
    });

    return sortedCoins;
}

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
            showDashboard();
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
    document.getElementById('dashboardView').classList.add('hidden');
    document.getElementById('loginForm').classList.remove('hidden');
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
}

async function showDashboard() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('registerForm').classList.add('hidden');
    document.getElementById('dashboardView').classList.remove('hidden');
    
    // Show initial loading state
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

        const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false&price_change_percentage=1h');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        topCoins = data;
        lastPriceUpdate = now;
        updateLastUpdatedTime();
        displayCryptoTable();
    } catch (error) {
        console.error('Error loading top coins:', error);
        // Don't show alert to avoid disrupting UX
        // Only update the UI if we have previous data
        if (topCoins.length > 0) {
            displayCryptoTable();
        }
    }
}

function updateLastUpdatedTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    const dateString = now.toLocaleDateString();
    document.getElementById('lastUpdated').textContent = `Last updated: ${dateString} ${timeString}`;
}

function startPriceUpdates() {
    if (priceUpdateInterval) {
        clearInterval(priceUpdateInterval);
    }
    // Update every 30 seconds instead of 5
    priceUpdateInterval = setInterval(loadTopCoins, MIN_UPDATE_INTERVAL);
}

function formatNumber(value, decimals = 2) {
    return new Intl.NumberFormat(currentLocale, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(value);
}

function displayCryptoTable() {
    const tableBody = document.getElementById('cryptoTableBody');
    if (!tableBody) return;

    const sortedCoins = sortData();
    
    const rows = sortedCoins.map((coin, index) => {
        return `
            <tr class="border-b dark:border-gray-700">
                <td class="py-4">${index + 1}</td>
                <td class="py-4">
                    <div class="flex items-center gap-2">
                        <img src="${coin.image}" alt="${coin.name}" class="w-6 h-6">
                        <span>${coin.name}</span>
                        <span class="text-gray-500 dark:text-gray-400">${coin.symbol.toUpperCase()}</span>
                    </div>
                </td>
                <td class="py-4">$${formatNumber(coin.current_price)}</td>
                <td class="py-4">$${formatNumber(coin.market_cap, 0)}</td>
                <td class="py-4 ${coin.price_change_percentage_1h_in_currency >= 0 ? 'text-green-500' : 'text-red-500'} text-right">
                    ${formatNumber(coin.price_change_percentage_1h_in_currency || 0)}%
                </td>
                <td class="py-4 ${coin.price_change_percentage_24h >= 0 ? 'text-green-500' : 'text-red-500'} text-right">
                    ${formatNumber(coin.price_change_percentage_24h)}%
                </td>
            </tr>
        `;
    }).join('');

    tableBody.innerHTML = rows;
}

function toggleMenu() {
    document.getElementById('menuDropdown').classList.toggle('hidden');
}

// Close menu when clicking outside
document.addEventListener('click', function(event) {
    const menu = document.getElementById('menuDropdown');
    const menuButton = event.target.closest('button');
    
    if (!menu.classList.contains('hidden') && !menuButton) {
        menu.classList.add('hidden');
    }
}); 