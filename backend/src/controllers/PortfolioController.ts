import { Context } from "@oak/oak";
import { PortfolioRepository } from "../repositories/PortfolioRepository.ts";
import { CoinGeckoService } from "../services/CoinGeckoService.ts";
import { HoldingRequest, PortfolioSummary, HoldingWithPrice } from "../types/index.ts";

export class PortfolioController {
  private portfolioRepository: PortfolioRepository;
  private coinGeckoService: CoinGeckoService;

  constructor(portfolioRepository: PortfolioRepository, coinGeckoService: CoinGeckoService) {
    this.portfolioRepository = portfolioRepository;
    this.coinGeckoService = coinGeckoService;
  }

  async getPortfolio(ctx: Context) {
    try {
      const userId = ctx.params.userId || ctx.state.userId;
      if (!userId) {
        ctx.response.status = 400;
        ctx.response.body = { error: "User ID is required" };
        return;
      }

      const portfolio = await this.portfolioRepository.getOrCreatePortfolio(userId);
      const holdings = await this.portfolioRepository.getHoldingsByPortfolioId(portfolio.id);

      ctx.response.status = 200;
      ctx.response.body = {
        portfolio,
        holdings,
      };
    } catch (error) {
      console.error("Get portfolio error:", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Failed to get portfolio" };
    }
  }

  async getPortfolioWithPrices(ctx: Context) {
    try {
      const userId = ctx.params.userId || ctx.state.userId;
      if (!userId) {
        ctx.response.status = 400;
        ctx.response.body = { error: "User ID is required" };
        return;
      }

      const currency = ctx.request.url.searchParams.get("currency") || "usd";
      
      const portfolio = await this.portfolioRepository.getOrCreatePortfolio(userId);
      const holdings = await this.portfolioRepository.getHoldingsByPortfolioId(portfolio.id);

      if (holdings.length === 0) {
        const summary: PortfolioSummary = {
          portfolio,
          holdings: [],
          totalValue: 0,
          totalChange24h: 0,
        };
        ctx.response.status = 200;
        ctx.response.body = summary;
        return;
      }

      // Get current prices for all holdings
      const symbols = holdings.map(h => h.symbol);
      const priceMap = await this.coinGeckoService.getPricesForPortfolio(symbols, currency);

      // Calculate holdings with prices
      const holdingsWithPrices: HoldingWithPrice[] = holdings.map(holding => {
        const price = priceMap.get(holding.symbol);
        const currentPrice = price?.current_price || 0;
        const totalValue = currentPrice * holding.amount;
        const priceChange24h = price?.price_change_percentage_24h || 0;

        return {
          ...holding,
          currentPrice,
          totalValue,
          priceChange24h,
        };
      });

      // Calculate portfolio totals
      const totalValue = holdingsWithPrices.reduce((sum, h) => sum + (h.totalValue || 0), 0);
      const totalChange24h = holdingsWithPrices.length > 0
        ? holdingsWithPrices.reduce((sum, h) => sum + (h.priceChange24h || 0), 0) / holdingsWithPrices.length
        : 0;

      const summary: PortfolioSummary = {
        portfolio,
        holdings: holdingsWithPrices,
        totalValue,
        totalChange24h,
      };

      ctx.response.status = 200;
      ctx.response.body = summary;
    } catch (error) {
      console.error("Get portfolio with prices error:", error);
      ctx.response.status = 500;
      ctx.response.body = { error: "Failed to get portfolio with prices" };
    }
  }

  async addHolding(ctx: Context) {
    try {
      const userId = ctx.params.userId || ctx.state.userId;
      if (!userId) {
        ctx.response.status = 400;
        ctx.response.body = { error: "User ID is required" };
        return;
      }

      const body = await ctx.request.body({ type: "json" }).value;
      const request: HoldingRequest = {
        symbol: body.symbol,
        amount: body.amount,
      };

      // Validation
      if (!request.symbol || !request.amount) {
        ctx.response.status = 400;
        ctx.response.body = { error: "Symbol and amount are required" };
        return;
      }

      if (request.amount <= 0) {
        ctx.response.status = 400;
        ctx.response.body = { error: "Amount must be positive" };
        return;
      }

      const portfolio = await this.portfolioRepository.getOrCreatePortfolio(userId);
      const holding = await this.portfolioRepository.addHolding(
        portfolio.id,
        request.symbol,
        request.amount
      );

      ctx.response.status = 200;
      ctx.response.body = holding;
    } catch (error) {
      console.error("Add holding error:", error);
      ctx.response.status = 400;
      ctx.response.body = { error: error.message || "Failed to add holding" };
    }
  }

  async removeHolding(ctx: Context) {
    try {
      const userId = ctx.params.userId || ctx.state.userId;
      if (!userId) {
        ctx.response.status = 400;
        ctx.response.body = { error: "User ID is required" };
        return;
      }

      const body = await ctx.request.body({ type: "json" }).value;
      const request: HoldingRequest = {
        symbol: body.symbol,
        amount: body.amount,
      };

      // Validation
      if (!request.symbol || !request.amount) {
        ctx.response.status = 400;
        ctx.response.body = { error: "Symbol and amount are required" };
        return;
      }

      if (request.amount <= 0) {
        ctx.response.status = 400;
        ctx.response.body = { error: "Amount must be positive" };
        return;
      }

      const portfolio = await this.portfolioRepository.getOrCreatePortfolio(userId);
      const holding = await this.portfolioRepository.removeHolding(
        portfolio.id,
        request.symbol,
        request.amount
      );

      ctx.response.status = 200;
      ctx.response.body = holding;
    } catch (error) {
      console.error("Remove holding error:", error);
      ctx.response.status = 400;
      ctx.response.body = { error: error.message || "Failed to remove holding" };
    }
  }

  async updateHolding(ctx: Context) {
    try {
      const userId = ctx.params.userId || ctx.state.userId;
      if (!userId) {
        ctx.response.status = 400;
        ctx.response.body = { error: "User ID is required" };
        return;
      }

      const body = await ctx.request.body({ type: "json" }).value;
      const request: HoldingRequest = {
        symbol: body.symbol,
        amount: body.amount,
      };

      // Validation
      if (!request.symbol || request.amount === undefined) {
        ctx.response.status = 400;
        ctx.response.body = { error: "Symbol and amount are required" };
        return;
      }

      if (request.amount < 0) {
        ctx.response.status = 400;
        ctx.response.body = { error: "Amount cannot be negative" };
        return;
      }

      const portfolio = await this.portfolioRepository.getOrCreatePortfolio(userId);
      
      if (request.amount === 0) {
        // Delete holding if amount is 0
        await this.portfolioRepository.deleteHolding(portfolio.id, request.symbol);
        ctx.response.status = 200;
        ctx.response.body = { message: "Holding deleted" };
      } else {
        // Update holding
        const holding = await this.portfolioRepository.updateHolding(
          portfolio.id,
          request.symbol,
          request.amount
        );
        ctx.response.status = 200;
        ctx.response.body = holding;
      }
    } catch (error) {
      console.error("Update holding error:", error);
      ctx.response.status = 400;
      ctx.response.body = { error: error.message || "Failed to update holding" };
    }
  }
} 