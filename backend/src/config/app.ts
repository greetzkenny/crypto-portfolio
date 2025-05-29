import { load } from "@std/dotenv";
import { AppConfig } from "../types/index.ts";

export async function loadConfig(): Promise<AppConfig> {
  // Load environment variables from .env file
  const env = await load();

  return {
    port: parseInt(env.PORT || "8090"),
    host: env.HOST || "localhost",
    database: {
      host: env.POSTGRES_HOST || "localhost",
      port: parseInt(env.POSTGRES_PORT || "5432"),
      user: env.POSTGRES_USER || "postgres",
      password: env.POSTGRES_PASSWORD || "postgress",
      database: env.POSTGRES_DB || "portfolio-tracker",
    },
    jwt: {
      secret: env.JWT_SECRET || "your-super-secret-jwt-key",
      expiresIn: env.JWT_EXPIRES_IN || "24h",
    },
    cors: {
      origin: env.CORS_ORIGIN || "http://localhost:3000",
    },
    coinGeckoApiUrl: env.COINGECKO_API_URL || "https://api.coingecko.com/api/v3",
  };
} 