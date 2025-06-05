import { Application } from "@oak/oak";
import { loadConfig } from "./config/app.ts";
import { createDatabasePool } from "./config/database.ts";
import { PortfolioRepository } from "./repositories/PortfolioRepository.ts";
import { CoinGeckoService } from "./services/CoinGeckoService.ts";
import { PortfolioController } from "./controllers/PortfolioController.ts";
import { CryptoController } from "./controllers/CryptoController.ts";
import { createRoutes } from "./routes/index.ts";
import { createCorsMiddleware } from "./middleware/cors.ts";

async function main() {
  try {
    console.log("🚀 Starting Crypto Portfolio Tracker API...");

    // Load configuration
    const config = await loadConfig();
    console.log(`📊 Loaded configuration for ${config.database.database} database`);

    // Initialize database connection
    const dbPool = createDatabasePool(config.database);
    console.log("🗄️  Database connection pool created");

    // Initialize repositories
    const portfolioRepository = new PortfolioRepository();
    console.log("📦 Repositories initialized");

    // Initialize services
    const coinGeckoService = new CoinGeckoService(config.coinGeckoApiUrl);
    console.log("🔧 Services initialized");

    // Initialize controllers
    const portfolioController = new PortfolioController(portfolioRepository, coinGeckoService);
    const cryptoController = new CryptoController(coinGeckoService);
    console.log("🎮 Controllers initialized");

    // Create Oak application
    const app = new Application();

    // Global error handler
    app.use(async (ctx, next) => {
      try {
        await next();
      } catch (error) {
        console.error("Unhandled error:", error);
        
        // Handle specific error types
        if (error instanceof Error) {
          if (error.message.includes("database") || error.message.includes("PostgreSQL")) {
            ctx.response.status = 500;
            ctx.response.body = { 
              error: "Database connection error",
              message: "Please try again later"
            };
            return;
          }
        }

        // Generic error response
        ctx.response.status = 500;
        ctx.response.body = { 
          error: "Internal server error",
          message: Deno.env.get("NODE_ENV") === "development" ? (error instanceof Error ? error.message : String(error)) : "An unexpected error occurred"
        };
      }
    });

    // Request logging middleware
    app.use(async (ctx, next) => {
      const start = Date.now();
      await next();
      const ms = Date.now() - start;
      console.log(`${ctx.request.method} ${ctx.request.url.pathname} - ${ctx.response.status} - ${ms}ms`);
    });

    // CORS middleware
    app.use(createCorsMiddleware(config.cors.origin));

    // Routes
    const router = createRoutes(portfolioController, cryptoController);
    app.use(router.routes());
    app.use(router.allowedMethods());

    // 404 handler
    app.use((ctx) => {
      ctx.response.status = 404;
      ctx.response.body = { error: "Not found" };
    });

    // Start server
    console.log(`🌐 Server starting on ${config.host}:${config.port}`);
    console.log(`🔗 API available at http://${config.host}:${config.port}`);
    console.log(`📚 Health check: http://${config.host}:${config.port}/health`);
    
    await app.listen({ hostname: config.host, port: config.port });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    Deno.exit(1);
  }
}

// Handle graceful shutdown
Deno.addSignalListener("SIGINT", () => {
  console.log("\n🛑 Received SIGINT, shutting down gracefully...");
  Deno.exit(0);
});

// SIGTERM is not supported on Windows, only add it on non-Windows platforms
if (Deno.build.os !== "windows") {
  Deno.addSignalListener("SIGTERM", () => {
    console.log("\n🛑 Received SIGTERM, shutting down gracefully...");
    Deno.exit(0);
  });
}

if (import.meta.main) {
  await main();
} 