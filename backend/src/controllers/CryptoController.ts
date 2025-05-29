import { Context } from "@oak/oak";
import { CoinGeckoService } from "../services/CoinGeckoService.ts";

export class CryptoController {
  private coinGeckoService: CoinGeckoService;

  constructor(coinGeckoService: CoinGeckoService) {
    this.coinGeckoService = coinGeckoService;
  }

  async getTopCoins(ctx: Context) {
    try {
      const limit = parseInt(ctx.request.url.searchParams.get("limit") || "10");
      const currency = ctx.request.url.searchParams.get("currency") || "usd";

      if (limit < 1 || limit > 100) {
        ctx.response.status = 400;
        ctx.response.body = { error: "Limit must be between 1 and 100" };
        return;
      }

      const coins = await this.coinGeckoService.getTopCoins(limit, currency);
      ctx.response.status = 200;
      ctx.response.body = coins;
    } catch (error) {
      console.error("Get top coins error:", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Failed to fetch top cryptocurrencies" };
    }
  }

  async getPrices(ctx: Context) {
    try {
      const coinsParam = ctx.request.url.searchParams.get("coins");
      const currency = ctx.request.url.searchParams.get("currency") || "usd";

      if (!coinsParam) {
        ctx.response.status = 400;
        ctx.response.body = { error: "Coins parameter is required" };
        return;
      }

      const coinIds = coinsParam.split(",").map(id => id.trim()).filter(id => id.length > 0);
      
      if (coinIds.length === 0) {
        ctx.response.status = 400;
        ctx.response.body = { error: "At least one coin ID is required" };
        return;
      }

      if (coinIds.length > 50) {
        ctx.response.status = 400;
        ctx.response.body = { error: "Maximum 50 coins allowed per request" };
        return;
      }

      const prices = await this.coinGeckoService.getMarketData(coinIds, currency);
      ctx.response.status = 200;
      ctx.response.body = prices;
    } catch (error) {
      console.error("Get prices error:", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Failed to fetch cryptocurrency prices" };
    }
  }

  async getCoinPrice(ctx: Context) {
    try {
      const coinId = ctx.params.coinId;
      const currency = ctx.request.url.searchParams.get("currency") || "usd";

      if (!coinId) {
        ctx.response.status = 400;
        ctx.response.body = { error: "Coin ID is required" };
        return;
      }

      const price = await this.coinGeckoService.getCoinPrice(coinId, currency);
      ctx.response.status = 200;
      ctx.response.body = price;
    } catch (error) {
      console.error("Get coin price error:", error);
      if (error.message.includes("not found")) {
        ctx.response.status = 404;
        ctx.response.body = { error: error.message };
      } else {
        ctx.response.status = 500;
        ctx.response.body = { error: "Failed to fetch cryptocurrency price" };
      }
    }
  }

  async searchCoins(ctx: Context) {
    try {
      const query = ctx.request.url.searchParams.get("q");

      if (!query) {
        ctx.response.status = 400;
        ctx.response.body = { error: "Search query is required" };
        return;
      }

      if (query.length < 2) {
        ctx.response.status = 400;
        ctx.response.body = { error: "Search query must be at least 2 characters long" };
        return;
      }

      const results = await this.coinGeckoService.searchCoins(query);
      ctx.response.status = 200;
      ctx.response.body = results;
    } catch (error) {
      console.error("Search coins error:", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Failed to search cryptocurrencies" };
    }
  }

  async getSupportedCurrencies(ctx: Context) {
    try {
      const currencies = await this.coinGeckoService.getSupportedCurrencies();
      ctx.response.status = 200;
      ctx.response.body = currencies;
    } catch (error) {
      console.error("Get supported currencies error:", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Failed to fetch supported currencies" };
    }
  }

  async getPricesBySymbols(ctx: Context) {
    try {
      const symbolsParam = ctx.request.url.searchParams.get("symbols");
      const currency = ctx.request.url.searchParams.get("currency") || "usd";

      if (!symbolsParam) {
        ctx.response.status = 400;
        ctx.response.body = { error: "Symbols parameter is required" };
        return;
      }

      const symbols = symbolsParam.split(",").map(s => s.trim().toUpperCase()).filter(s => s.length > 0);
      
      if (symbols.length === 0) {
        ctx.response.status = 400;
        ctx.response.body = { error: "At least one symbol is required" };
        return;
      }

      if (symbols.length > 20) {
        ctx.response.status = 400;
        ctx.response.body = { error: "Maximum 20 symbols allowed per request" };
        return;
      }

      const prices = await this.coinGeckoService.getPricesBySymbols(symbols, currency);
      ctx.response.status = 200;
      ctx.response.body = prices;
    } catch (error) {
      console.error("Get prices by symbols error:", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Failed to fetch cryptocurrency prices by symbols" };
    }
  }
} 