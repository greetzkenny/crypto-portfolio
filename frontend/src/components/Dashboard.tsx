import React, { useState, useEffect } from 'react';
import apiService from '../lib/api';
import { CoinPrice, PortfolioSummary } from '../types';

const Dashboard: React.FC = () => {
  const [topCoins, setTopCoins] = useState<CoinPrice[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch top coins (public endpoint)
        const coinsData = await apiService.getTopCoins(10);
        setTopCoins(coinsData);

        // Fetch portfolio data (now public)
        try {
          const portfolioData = await apiService.getPortfolioSummary();
          setPortfolio(portfolioData);
        } catch (portfolioError: any) {
          console.log('Portfolio data not available:', portfolioError.message);
          // Don't show error for missing portfolio data
        }
      } catch (err: any) {
        console.error('Dashboard data fetch error:', err);
        setError('Failed to load market data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    }).format(price);
  };

  const formatPercentage = (percentage: number) => {
    const isPositive = percentage >= 0;
    return (
      <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
        {isPositive ? '+' : ''}{percentage.toFixed(2)}%
      </span>
    );
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-md p-4">
          <p className="text-red-800 dark:text-red-200">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Crypto Portfolio Tracker
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Track cryptocurrency prices and manage your portfolio
          </p>
        </div>

        {/* Portfolio Summary */}
        {portfolio && (
          <div className="mb-8 bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Portfolio Summary
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Value</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatPrice(portfolio.totalValue)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">24h Change</p>
                <p className="text-2xl font-bold">
                  {formatPercentage(portfolio.totalChange24h)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Holdings</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {portfolio.holdings.length} assets
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Portfolio</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {portfolio.portfolio.name}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Top Cryptocurrencies */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Top Cryptocurrencies
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    24h Change
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Market Cap
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {topCoins.map((coin) => (
                  <tr key={coin.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {coin.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 uppercase">
                            {coin.symbol}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white text-right">
                      {formatPrice(coin.current_price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      {coin.price_change_percentage_24h ? formatPercentage(coin.price_change_percentage_24h) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white text-right">
                      {coin.market_cap ? new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                        notation: 'compact',
                        maximumFractionDigits: 1,
                      }).format(coin.market_cap) : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 