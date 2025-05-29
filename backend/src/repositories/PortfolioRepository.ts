import { query, transaction } from "../config/database.ts";
import { Portfolio, Holding, PortfolioWithHoldings } from "../types/index.ts";
import { Client } from "postgres";

export class PortfolioRepository {
  async findByUserId(userId: string): Promise<Portfolio | null> {
    const result = await query<Portfolio>(
      "SELECT id, user_id as userId, name, created_at as createdAt, updated_at as updatedAt FROM portfolios WHERE user_id = $1",
      [userId]
    );
    return result.rows[0] || null;
  }

  async findByUserIdWithHoldings(userId: string): Promise<PortfolioWithHoldings | null> {
    const portfolio = await this.findByUserId(userId);
    if (!portfolio) {
      return null;
    }

    const holdings = await this.getHoldingsByPortfolioId(portfolio.id);
    return {
      ...portfolio,
      holdings,
    };
  }

  async create(userId: string, name: string = "Default Portfolio"): Promise<Portfolio> {
    const id = crypto.randomUUID();
    const result = await query<Portfolio>(
      `INSERT INTO portfolios (id, user_id, name) 
       VALUES ($1, $2, $3) 
       RETURNING id, user_id as userId, name, created_at as createdAt, updated_at as updatedAt`,
      [id, userId, name]
    );
    return result.rows[0];
  }

  async getHoldingsByPortfolioId(portfolioId: string): Promise<Holding[]> {
    const result = await query<Holding>(
      "SELECT id, portfolio_id as portfolioId, symbol, amount, created_at as createdAt, updated_at as updatedAt FROM holdings WHERE portfolio_id = $1 ORDER BY symbol",
      [portfolioId]
    );
    return result.rows;
  }

  async addHolding(portfolioId: string, symbol: string, amount: number): Promise<Holding> {
    return await transaction(async (client: Client) => {
      // Check if holding already exists
      const existingResult = await client.queryObject<Holding>(
        "SELECT id, portfolio_id as portfolioId, symbol, amount, created_at as createdAt, updated_at as updatedAt FROM holdings WHERE portfolio_id = $1 AND symbol = $2",
        [portfolioId, symbol.toUpperCase()]
      );

      if (existingResult.rows.length > 0) {
        // Update existing holding
        const existing = existingResult.rows[0];
        const newAmount = existing.amount + amount;
        const updateResult = await client.queryObject<Holding>(
          `UPDATE holdings SET amount = $1 
           WHERE id = $2 
           RETURNING id, portfolio_id as portfolioId, symbol, amount, created_at as createdAt, updated_at as updatedAt`,
          [newAmount, existing.id]
        );
        return updateResult.rows[0];
      } else {
        // Create new holding
        const id = crypto.randomUUID();
        const insertResult = await client.queryObject<Holding>(
          `INSERT INTO holdings (id, portfolio_id, symbol, amount) 
           VALUES ($1, $2, $3, $4) 
           RETURNING id, portfolio_id as portfolioId, symbol, amount, created_at as createdAt, updated_at as updatedAt`,
          [id, portfolioId, symbol.toUpperCase(), amount]
        );
        return insertResult.rows[0];
      }
    });
  }

  async removeHolding(portfolioId: string, symbol: string, amount: number): Promise<Holding | null> {
    return await transaction(async (client: Client) => {
      // Get current holding
      const existingResult = await client.queryObject<Holding>(
        "SELECT id, portfolio_id as portfolioId, symbol, amount, created_at as createdAt, updated_at as updatedAt FROM holdings WHERE portfolio_id = $1 AND symbol = $2",
        [portfolioId, symbol.toUpperCase()]
      );

      if (existingResult.rows.length === 0) {
        throw new Error("Holding not found");
      }

      const existing = existingResult.rows[0];
      const newAmount = existing.amount - amount;

      if (newAmount < 0) {
        throw new Error("Insufficient holdings");
      }

      if (newAmount === 0) {
        // Delete holding
        await client.queryObject(
          "DELETE FROM holdings WHERE id = $1",
          [existing.id]
        );
        return null;
      } else {
        // Update holding
        const updateResult = await client.queryObject<Holding>(
          `UPDATE holdings SET amount = $1 
           WHERE id = $2 
           RETURNING id, portfolio_id as portfolioId, symbol, amount, created_at as createdAt, updated_at as updatedAt`,
          [newAmount, existing.id]
        );
        return updateResult.rows[0];
      }
    });
  }

  async updateHolding(portfolioId: string, symbol: string, amount: number): Promise<Holding> {
    if (amount <= 0) {
      throw new Error("Amount must be positive");
    }

    const result = await query<Holding>(
      `UPDATE holdings SET amount = $1 
       WHERE portfolio_id = $2 AND symbol = $3 
       RETURNING id, portfolio_id as portfolioId, symbol, amount, created_at as createdAt, updated_at as updatedAt`,
      [amount, portfolioId, symbol.toUpperCase()]
    );

    if (result.rows.length === 0) {
      throw new Error("Holding not found");
    }

    return result.rows[0];
  }

  async deleteHolding(portfolioId: string, symbol: string): Promise<boolean> {
    const result = await query(
      "DELETE FROM holdings WHERE portfolio_id = $1 AND symbol = $2",
      [portfolioId, symbol.toUpperCase()]
    );
    return result.rowCount > 0;
  }

  async getOrCreatePortfolio(userId: string): Promise<Portfolio> {
    let portfolio = await this.findByUserId(userId);
    if (!portfolio) {
      portfolio = await this.create(userId);
    }
    return portfolio;
  }
} 