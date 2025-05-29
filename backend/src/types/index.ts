// Type definitions for the Crypto Portfolio Tracker

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Portfolio {
  id: string;
  userId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Holding {
  id: string;
  portfolioId: string;
  symbol: string;
  amount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Cryptocurrency {
  id: string; // CoinGecko ID
  symbol: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PriceHistory {
  id: string;
  cryptocurrencyId: string;
  price: number;
  marketCap?: number;
  volume24h?: number;
  priceChange1h?: number;
  priceChange24h?: number;
  currency: string;
  timestamp: Date;
}

// API Response Types
export interface CoinPrice {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_1h_in_currency?: number;
  price_change_percentage_24h?: number;
  market_cap?: number;
  total_volume?: number;
}

// Request/Response DTOs
export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  userId: string;
  username: string;
  token: string;
}

export interface HoldingRequest {
  symbol: string;
  amount: number;
}

export interface PortfolioWithHoldings extends Portfolio {
  holdings: Holding[];
}

export interface HoldingWithPrice extends Holding {
  currentPrice?: number;
  totalValue?: number;
  priceChange24h?: number;
}

export interface PortfolioSummary {
  portfolio: Portfolio;
  holdings: HoldingWithPrice[];
  totalValue: number;
  totalChange24h: number;
}

// JWT Payload
export interface JWTPayload {
  userId: string;
  username: string;
  iat: number;
  exp: number;
}

// Database connection config
export interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

// Application config
export interface AppConfig {
  port: number;
  host: string;
  database: DatabaseConfig;
  jwt: {
    secret: string;
    expiresIn: string;
  };
  cors: {
    origin: string;
  };
  coinGeckoApiUrl: string;
} 