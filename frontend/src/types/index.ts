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

// User and Auth Types
export interface User {
  id: string;
  username: string;
}

export interface AuthResponse {
  userId: string;
  username: string;
  token: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
}

// Portfolio Types
export interface Portfolio {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Holding {
  id: string;
  portfolioId: string;
  symbol: string;
  amount: number;
  createdAt: string;
  updatedAt: string;
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

export interface HoldingRequest {
  symbol: string;
  amount: number;
}

// UI State Types
export interface ThemeState {
  isDark: boolean;
  toggle: () => void;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (credentials: RegisterRequest) => Promise<void>;
  logout: () => void;
  setAuth: (user: User, token: string) => void;
}

export interface PortfolioState {
  portfolio: PortfolioSummary | null;
  isLoading: boolean;
  error: string | null;
  fetchPortfolio: () => Promise<void>;
  addHolding: (request: HoldingRequest) => Promise<void>;
  removeHolding: (request: HoldingRequest) => Promise<void>;
  updateHolding: (request: HoldingRequest) => Promise<void>;
  clearError: () => void;
}

export interface CryptoState {
  topCoins: CoinPrice[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  fetchTopCoins: (limit?: number, currency?: string) => Promise<void>;
  searchCoins: (query: string) => Promise<Array<{ id: string; name: string; symbol: string }>>;
  clearError: () => void;
} 