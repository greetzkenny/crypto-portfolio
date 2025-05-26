let currentUser = null;
let topCoins = [];
let selectedCoin = null;
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
        showPortfolio();
    } else {
        window.location.href = '/';
    }

    // Set up locale selector
    const localeSelector = document.getElementById('localeSelector');
    localeSelector.value = currentLocale;
    localeSelector.addEventListener('change', (e) => {
        currentLocale = e.target.value;
        localStorage.setItem('locale', currentLocale);
        if (topCoins.length > 0) {
            loadPortfolio();
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
                loadPortfolio();
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

function sortData(holdings) {
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
            case 'holdings':
                aValue = (holdings[a.symbol.toUpperCase()] || 0) * a.current_price;
                bValue = (holdings[b.symbol.toUpperCase()] || 0) * b.current_price;
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

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    clearInterval(priceUpdateInterval);
    window.location.href = '/';
}

function showPortfolio() {
    // Show initial loading state
    loadPortfolio();
    // Immediately try to load coins
    loadTopCoins();
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

async function loadPortfolio() {
    try {
        const response = await fetch(`http://localhost:8090/api/portfolio/${currentUser.userId}`);
        const portfolio = await response.json();
        displayCryptoTable(portfolio.holdings || {});
        return portfolio;
    } catch (error) {
        console.error('Error loading portfolio:', error);
        displayCryptoTable({});
    }
}

function displayCryptoTable(holdings) {
    const tableBody = document.getElementById('cryptoTableBody');
    if (!tableBody) return;

    const sortedCoins = sortData(holdings);
    
    let totalValue = 0;
    const rows = sortedCoins.map((coin, index) => {
        const holding = holdings[coin.symbol.toUpperCase()] || 0;
        const holdingValue = holding * coin.current_price;
        totalValue += holdingValue;

        return `
            <tr class="border-b dark:border-gray-700">
                <td class="py-2">${index + 1}</td>
                <td class="py-2">
                    <div class="flex items-center gap-2">
                        <img src="${coin.image}" alt="${coin.name}" class="w-6 h-6">
                        <span>${coin.name}</span>
                        <span class="text-gray-500 dark:text-gray-400">${coin.symbol.toUpperCase()}</span>
                    </div>
                </td>
                <td class="py-2">$${formatNumber(coin.current_price)}</td>
                <td class="py-2">$${formatNumber(coin.market_cap, 0)}</td>
                <td class="py-2 ${coin.price_change_percentage_1h_in_currency >= 0 ? 'text-green-500' : 'text-red-500'} text-right">
                    ${formatNumber(coin.price_change_percentage_1h_in_currency || 0)}%
                </td>
                <td class="py-2 ${coin.price_change_percentage_24h >= 0 ? 'text-green-500' : 'text-red-500'} text-right">
                    ${formatNumber(coin.price_change_percentage_24h)}%
                </td>
                <td class="py-2 text-right">
                    <div class="flex flex-col gap-0.5">
                        <div class="flex items-center justify-end gap-2">
                            <span>${formatNumber(holding)} ${coin.symbol.toUpperCase()}</span>
                            <button onclick="showAddDialog('${coin.symbol}')" class="w-6 h-6 text-green-500 hover:text-green-600 text-xl font-medium flex items-center justify-center">
                                +
                            </button>
                        </div>
                        <div class="flex items-center justify-end gap-2">
                            <span>$${formatNumber(holdingValue)}</span>
                            ${holding > 0 ? `
                                <button onclick="showRemoveDialog('${coin.symbol}')" class="w-6 h-6 text-red-500 hover:text-red-600 text-xl font-medium flex items-center justify-center">
                                    -
                                </button>
                            ` : '<div class="w-6"></div>'}
                        </div>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    tableBody.innerHTML = rows;
}

function showAddDialog(symbol) {
    selectedCoin = symbol;
    document.getElementById('addTokenDialog').classList.remove('hidden');
    document.getElementById('addAmount').value = '';
    document.getElementById('addAmount').focus();
}

function closeAddDialog() {
    document.getElementById('addTokenDialog').classList.add('hidden');
    selectedCoin = null;
}

function showRemoveDialog(symbol) {
    selectedCoin = symbol;
    document.getElementById('removeTokenDialog').classList.remove('hidden');
    document.getElementById('removeAmount').value = '';
    document.getElementById('removeAmount').focus();
}

function closeRemoveDialog() {
    document.getElementById('removeTokenDialog').classList.add('hidden');
    selectedCoin = null;
}

async function confirmAdd() {
    const amount = parseFloat(document.getElementById('addAmount').value);
    if (isNaN(amount) || amount <= 0) {
        alert('Please enter a valid amount');
        return;
    }

    try {
        const response = await fetch(`http://localhost:8090/api/portfolio/${currentUser.userId}/add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                symbol: selectedCoin,
                amount: amount
            }),
        });

        if (response.ok) {
            closeAddDialog();
            await loadPortfolio();
        } else {
            const error = await response.text();
            alert(error);
        }
    } catch (error) {
        console.error('Error adding token:', error);
        alert('Error adding token');
    }
}

async function confirmRemove() {
    const amount = parseFloat(document.getElementById('removeAmount').value);
    if (isNaN(amount) || amount <= 0) {
        alert('Please enter a valid amount');
        return;
    }

    try {
        const response = await fetch(`http://localhost:8090/api/portfolio/${currentUser.userId}/remove`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                symbol: selectedCoin,
                amount: amount
            }),
        });

        if (response.ok) {
            closeRemoveDialog();
            await loadPortfolio();
        } else {
            const error = await response.text();
            alert(error);
        }
    } catch (error) {
        console.error('Error removing token:', error);
        alert('Error removing token');
    }
}

function toggleMenu() {
    document.getElementById('menuDropdown').classList.toggle('hidden');
} 