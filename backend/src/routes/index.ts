import { Router } from "@oak/oak";
import { PortfolioController } from "../controllers/PortfolioController.ts";
import { CryptoController } from "../controllers/CryptoController.ts";

export function createRoutes(
  portfolioController: PortfolioController,
  cryptoController: CryptoController
): Router {
  const router = new Router();

  // Health check
  router.get("/health", (ctx) => {
    ctx.response.body = { status: "ok", timestamp: new Date().toISOString() };
  });

  // Portfolio routes (now public)
  router.get("/api/portfolio", (ctx) => portfolioController.getPortfolio(ctx));
  router.get("/api/portfolio/summary", (ctx) => portfolioController.getPortfolioWithPrices(ctx));
  router.post("/api/portfolio", (ctx) => portfolioController.updateHolding(ctx));
  router.post("/api/portfolio/add", (ctx) => portfolioController.addHolding(ctx));
  router.post("/api/portfolio/remove", (ctx) => portfolioController.removeHolding(ctx));

  // Crypto routes (public)
  router.get("/api/crypto/top", (ctx) => cryptoController.getTopCoins(ctx));
  router.get("/api/crypto/prices", (ctx) => cryptoController.getPrices(ctx));
  router.get("/api/crypto/prices/symbols", (ctx) => cryptoController.getPricesBySymbols(ctx));
  router.get("/api/crypto/price/:coinId", (ctx) => cryptoController.getCoinPrice(ctx));
  router.get("/api/crypto/search", (ctx) => cryptoController.searchCoins(ctx));
  router.get("/api/crypto/supported-currencies", (ctx) => cryptoController.getSupportedCurrencies(ctx));

  return router;
} 