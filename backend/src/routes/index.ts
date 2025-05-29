import { Router } from "@oak/oak";
import { AuthController } from "../controllers/AuthController.ts";
import { PortfolioController } from "../controllers/PortfolioController.ts";
import { CryptoController } from "../controllers/CryptoController.ts";
import { createAuthMiddleware, createOptionalAuthMiddleware } from "../middleware/auth.ts";
import { AuthService } from "../services/AuthService.ts";

export function createRoutes(
  authController: AuthController,
  portfolioController: PortfolioController,
  cryptoController: CryptoController,
  authService: AuthService
): Router {
  const router = new Router();
  const authMiddleware = createAuthMiddleware(authService);
  const optionalAuthMiddleware = createOptionalAuthMiddleware(authService);

  // Health check
  router.get("/health", (ctx) => {
    ctx.response.body = { status: "ok", timestamp: new Date().toISOString() };
  });

  // Auth routes (public)
  router.post("/api/auth/register", (ctx) => authController.register(ctx));
  router.post("/api/auth/login", (ctx) => authController.login(ctx));
  router.post("/api/auth/verify", (ctx) => authController.verifyToken(ctx));

  // Auth routes (protected)
  router.post("/api/auth/change-password", authMiddleware, (ctx) => authController.changePassword(ctx));

  // Portfolio routes (protected)
  router.get("/api/portfolio/:userId", authMiddleware, (ctx) => portfolioController.getPortfolio(ctx));
  router.get("/api/portfolio/:userId/summary", authMiddleware, (ctx) => portfolioController.getPortfolioWithPrices(ctx));
  router.post("/api/portfolio/:userId", authMiddleware, (ctx) => portfolioController.updateHolding(ctx));
  router.post("/api/portfolio/:userId/add", authMiddleware, (ctx) => portfolioController.addHolding(ctx));
  router.post("/api/portfolio/:userId/remove", authMiddleware, (ctx) => portfolioController.removeHolding(ctx));

  // Alternative portfolio routes using auth from token (no userId in URL)
  router.get("/api/portfolio", authMiddleware, (ctx) => portfolioController.getPortfolio(ctx));
  router.get("/api/portfolio/summary", authMiddleware, (ctx) => portfolioController.getPortfolioWithPrices(ctx));
  router.post("/api/portfolio", authMiddleware, (ctx) => portfolioController.updateHolding(ctx));
  router.post("/api/portfolio/add", authMiddleware, (ctx) => portfolioController.addHolding(ctx));
  router.post("/api/portfolio/remove", authMiddleware, (ctx) => portfolioController.removeHolding(ctx));

  // Crypto routes (public)
  router.get("/api/crypto/top", (ctx) => cryptoController.getTopCoins(ctx));
  router.get("/api/crypto/prices", (ctx) => cryptoController.getPrices(ctx));
  router.get("/api/crypto/prices/symbols", (ctx) => cryptoController.getPricesBySymbols(ctx));
  router.get("/api/crypto/price/:coinId", (ctx) => cryptoController.getCoinPrice(ctx));
  router.get("/api/crypto/search", (ctx) => cryptoController.searchCoins(ctx));
  router.get("/api/crypto/supported-currencies", (ctx) => cryptoController.getSupportedCurrencies(ctx));

  return router;
} 