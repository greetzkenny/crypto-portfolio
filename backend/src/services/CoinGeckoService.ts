import { CoinPrice } from "../types/index.ts";

export class CoinGeckoService {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async getMarketData(coinIds: string[], currency: string = "usd"): Promise<CoinPrice[]> {
    const url = `${this.baseUrl}/coins/markets?vs_currency=${currency}&ids=${coinIds.join(",")}&order=market_cap_desc&sparkline=false&price_change_percentage=1h,24h`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      return data as CoinPrice[];
    } catch (error) {
      console.error("Error fetching market data:", error);
      throw new Error("Failed to fetch cryptocurrency market data");
    }
  }

  async getCoinPrice(coinId: string, currency: string = "usd"): Promise<CoinPrice> {
    const data = await this.getMarketData([coinId], currency);
    if (data.length === 0) {
      throw new Error(`Coin not found: ${coinId}`);
    }
    return data[0];
  }

  async getTopCoins(limit: number = 10, currency: string = "usd"): Promise<CoinPrice[]> {
    const url = `${this.baseUrl}/coins/markets?vs_currency=${currency}&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false&price_change_percentage=1h,24h`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      return data as CoinPrice[];
    } catch (error) {
      console.error("Error fetching top coins:", error);
      throw new Error("Failed to fetch top cryptocurrencies");
    }
  }

  async getSupportedCurrencies(): Promise<string[]> {
    const url = `${this.baseUrl}/simple/supported_vs_currencies`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      return data as string[];
    } catch (error) {
      console.error("Error fetching supported currencies:", error);
      throw new Error("Failed to fetch supported currencies");
    }
  }

  async searchCoins(query: string): Promise<Array<{ id: string; name: string; symbol: string }>> {
    const url = `${this.baseUrl}/search?query=${encodeURIComponent(query)}`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.coins || [];
    } catch (error) {
      console.error("Error searching coins:", error);
      throw new Error("Failed to search cryptocurrencies");
    }
  }

  async getPricesBySymbols(symbols: string[], currency: string = "usd"): Promise<CoinPrice[]> {
    // First, we need to get the coin IDs from symbols
    // This is a simplified approach - in production, you might want to cache this mapping
    const searchPromises = symbols.map(symbol => this.searchCoins(symbol));
    const searchResults = await Promise.all(searchPromises);
    
    const coinIds: string[] = [];
    for (let i = 0; i < symbols.length; i++) {
      const results = searchResults[i];
      const match = results.find(coin => 
        coin.symbol.toLowerCase() === symbols[i].toLowerCase()
      );
      if (match) {
        coinIds.push(match.id);
      }
    }

    if (coinIds.length === 0) {
      return [];
    }

    return await this.getMarketData(coinIds, currency);
  }

  // Helper method to get prices for specific symbols with better error handling
  async getPricesForPortfolio(symbols: string[], currency: string = "usd"): Promise<Map<string, CoinPrice>> {
    const priceMap = new Map<string, CoinPrice>();
    
    try {
      const prices = await this.getPricesBySymbols(symbols, currency);
      
      for (const price of prices) {
        priceMap.set(price.symbol.toUpperCase(), price);
      }
    } catch (error) {
      console.error("Error fetching portfolio prices:", error);
      // Return empty map on error - frontend should handle gracefully
    }
    
    return priceMap;
  }
} 