import { query, transaction } from "../config/database.ts";
import { User } from "../types/index.ts";

export class UserRepository {
  async findById(id: string): Promise<User | null> {
    try {
      const result = await query<User>(
        "SELECT id, username, password_hash as passwordHash, created_at as createdAt, updated_at as updatedAt FROM users WHERE id = $1",
        [id]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error("Error finding user by ID:", error);
      throw new Error("Failed to find user");
    }
  }

  async findByUsername(username: string): Promise<User | null> {
    try {
      const result = await query<User>(
        "SELECT id, username, password_hash as passwordHash, created_at as createdAt, updated_at as updatedAt FROM users WHERE username = $1",
        [username]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error("Error finding user by username:", error);
      throw new Error("Failed to find user");
    }
  }

  async create(username: string, passwordHash: string): Promise<User> {
    try {
      const id = crypto.randomUUID();
      const result = await query<User>(
        `INSERT INTO users (id, username, password_hash) 
         VALUES ($1, $2, $3) 
         RETURNING id, username, password_hash as passwordHash, created_at as createdAt, updated_at as updatedAt`,
        [id, username, passwordHash]
      );
      return result.rows[0];
    } catch (error) {
      console.error("Error creating user:", error);
      if ((error as any).message?.includes("duplicate key value")) {
        throw new Error("Username already exists");
      }
      throw new Error("Failed to create user");
    }
  }

  async update(id: string, updates: Partial<Pick<User, 'username' | 'passwordHash'>>): Promise<User | null> {
    try {
      const fields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (updates.username) {
        fields.push(`username = $${paramIndex++}`);
        values.push(updates.username);
      }

      if (updates.passwordHash) {
        fields.push(`password_hash = $${paramIndex++}`);
        values.push(updates.passwordHash);
      }

      if (fields.length === 0) {
        return this.findById(id);
      }

      values.push(id);
      const result = await query<User>(
        `UPDATE users SET ${fields.join(', ')} 
         WHERE id = $${paramIndex} 
         RETURNING id, username, password_hash as passwordHash, created_at as createdAt, updated_at as updatedAt`,
        values
      );

      return result.rows[0] || null;
    } catch (error) {
      console.error("Error updating user:", error);
      throw new Error("Failed to update user");
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const result = await query(
        "DELETE FROM users WHERE id = $1",
        [id]
      );
      return result.rowCount > 0;
    } catch (error) {
      console.error("Error deleting user:", error);
      throw new Error("Failed to delete user");
    }
  }

  async exists(username: string): Promise<boolean> {
    try {
      const result = await query(
        "SELECT 1 FROM users WHERE username = $1",
        [username]
      );
      return result.rows.length > 0;
    } catch (error) {
      console.error("Error checking if user exists:", error);
      throw new Error("Failed to check user existence");
    }
  }
} 