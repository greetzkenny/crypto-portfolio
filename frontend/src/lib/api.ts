import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { 
  AuthResponse, 
  LoginRequest, 
  RegisterRequest, 
  CoinPrice, 
  PortfolioSummary,
  HoldingRequest 
} from '@/types';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: '/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Clear auth data on 401
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.api.post('/auth/login', credentials);
    return response.data;
  }

  async register(credentials: RegisterRequest): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await this.api.post('/auth/register', credentials);
    return response.data;
  }

  async verifyToken(): Promise<{ valid: boolean; userId: string; username: string }> {
    const response = await this.api.post('/auth/verify');
    return response.data;
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    const response = await this.api.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  }

  // Portfolio endpoints
  async getPortfolio(): Promise<{ portfolio: any; holdings: any[] }> {
    const response = await this.api.get('/portfolio');
    return response.data;
  }

  async getPortfolioSummary(currency: string = 'usd'): Promise<PortfolioSummary> {
    const response: AxiosResponse<PortfolioSummary> = await this.api.get(`/portfolio/summary?currency=${currency}`);
    return response.data;
  }

  async addHolding(request: HoldingRequest): Promise<any> {
    const response = await this.api.post('/portfolio/add', request);
    return response.data;
  }

  async removeHolding(request: HoldingRequest): Promise<any> {
    const response = await this.api.post('/portfolio/remove', request);
    return response.data;
  }

  async updateHolding(request: HoldingRequest): Promise<any> {
    const response = await this.api.post('/portfolio', request);
    return response.data;
  }

  // Crypto endpoints
  async getTopCoins(limit: number = 10, currency: string = 'usd'): Promise<CoinPrice[]> {
    const response: AxiosResponse<CoinPrice[]> = await this.api.get(`/crypto/top?limit=${limit}&currency=${currency}`);
    return response.data;
  }

  async getCoinPrices(coinIds: string[], currency: string = 'usd'): Promise<CoinPrice[]> {
    const response: AxiosResponse<CoinPrice[]> = await this.api.get(`/crypto/prices?coins=${coinIds.join(',')}&currency=${currency}`);
    return response.data;
  }

  async getCoinPrice(coinId: string, currency: string = 'usd'): Promise<CoinPrice> {
    const response: AxiosResponse<CoinPrice> = await this.api.get(`/crypto/price/${coinId}?currency=${currency}`);
    return response.data;
  }

  async searchCoins(query: string): Promise<Array<{ id: string; name: string; symbol: string }>> {
    const response = await this.api.get(`/crypto/search?q=${encodeURIComponent(query)}`);
    return response.data;
  }

  async getPricesBySymbols(symbols: string[], currency: string = 'usd'): Promise<CoinPrice[]> {
    const response: AxiosResponse<CoinPrice[]> = await this.api.get(`/crypto/prices/symbols?symbols=${symbols.join(',')}&currency=${currency}`);
    return response.data;
  }

  async getSupportedCurrencies(): Promise<string[]> {
    const response: AxiosResponse<string[]> = await this.api.get('/crypto/supported-currencies');
    return response.data;
  }
}

export const apiService = new ApiService();
export default apiService; 