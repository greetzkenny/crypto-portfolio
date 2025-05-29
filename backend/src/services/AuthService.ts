import { create, verify } from "djwt";
import { UserRepository } from "../repositories/UserRepository.ts";
import { PortfolioRepository } from "../repositories/PortfolioRepository.ts";
import { AuthResponse, JWTPayload, LoginRequest, RegisterRequest } from "../types/index.ts";

// Simplified password hashing for debugging
class SimplePasswordUtil {
  static async hash(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + "salt123"); // Simple salt
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  }
  
  static async compare(password: string, hash: string): Promise<boolean> {
    const computedHash = await this.hash(password);
    return computedHash === hash;
  }
}

export class AuthService {
  private userRepository: UserRepository;
  private portfolioRepository: PortfolioRepository;
  private jwtSecret: string;
  private jwtExpiresIn: string;

  constructor(userRepository: UserRepository, portfolioRepository: PortfolioRepository, jwtSecret: string, jwtExpiresIn: string) {
    this.userRepository = userRepository;
    this.portfolioRepository = portfolioRepository;
    this.jwtSecret = jwtSecret;
    this.jwtExpiresIn = jwtExpiresIn;
  }

  async register(request: RegisterRequest): Promise<AuthResponse> {
    const { username, password } = request;

    try {
      // Check if user already exists
      const existingUser = await this.userRepository.findByUsername(username);
      if (existingUser) {
        throw new Error("Username already exists");
      }

      // Hash password using simple method
      const passwordHash = await SimplePasswordUtil.hash(password);

      // Create user
      const user = await this.userRepository.create(username, passwordHash);

      // Create default portfolio for the user
      try {
        await this.portfolioRepository.create(user.id, "Default Portfolio");
      } catch (portfolioError) {
        console.error("❌ Failed to create default portfolio:", portfolioError);
        // Don't fail registration if portfolio creation fails
      }

      // Generate JWT token
      const token = await this.generateToken(user.id, user.username);

      return {
        userId: user.id,
        username: user.username,
        token,
      };
    } catch (error) {
      console.error("❌ Registration error:", error);
      throw error;
    }
  }

  async login(request: LoginRequest): Promise<AuthResponse> {
    const { username, password } = request;

    try {
      console.log("🔐 Login attempt for:", username);
      
      // Find user
      const user = await this.userRepository.findByUsername(username);
      if (!user) {
        console.log("❌ User not found");
        throw new Error("Invalid credentials");
      }

      console.log("✅ User found, checking password...");
      console.log("📦 Stored hash:", user.passwordHash);

      // Ensure we have a valid password hash
      if (!user.passwordHash || typeof user.passwordHash !== 'string') {
        console.error("🚨 Invalid password hash for user:", username);
        throw new Error("Invalid credentials");
      }

      // Verify password using simple method
      const isValidPassword = await SimplePasswordUtil.compare(password, user.passwordHash);
      console.log("🎯 Password verification result:", isValidPassword);
      
      if (!isValidPassword) {
        console.log("❌ Password verification failed");
        throw new Error("Invalid credentials");
      }

      console.log("✅ Password verified successfully");

      // Generate JWT token
      const token = await this.generateToken(user.id, user.username);

      return {
        userId: user.id,
        username: user.username,
        token,
      };
    } catch (error) {
      console.error("❌ Login error:", error);
      throw error;
    }
  }

  async verifyToken(token: string): Promise<JWTPayload> {
    try {
      const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(this.jwtSecret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign", "verify"]
      );

      const payload = await verify(token, key);
      return payload as JWTPayload;
    } catch (error) {
      throw new Error("Invalid token");
    }
  }

  private async generateToken(userId: string, username: string): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = this.parseExpiresIn(this.jwtExpiresIn);

    const payload: JWTPayload = {
      userId,
      username,
      iat: now,
      exp: now + expiresIn,
    };

    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(this.jwtSecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"]
    );

    return await create({ alg: "HS256", typ: "JWT" }, payload, key);
  }

  private parseExpiresIn(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new Error("Invalid expiresIn format");
    }

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case "s":
        return value;
      case "m":
        return value * 60;
      case "h":
        return value * 60 * 60;
      case "d":
        return value * 60 * 60 * 24;
      default:
        throw new Error("Invalid expiresIn unit");
    }
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }

      // Verify current password
      const isValidPassword = await SimplePasswordUtil.compare(currentPassword, user.passwordHash);
      if (!isValidPassword) {
        throw new Error("Invalid current password");
      }

      // Hash new password
      const newPasswordHash = await SimplePasswordUtil.hash(newPassword);

      // Update user
      await this.userRepository.update(userId, { passwordHash: newPasswordHash });
    } catch (error) {
      console.error("Change password error:", error);
      throw error;
    }
  }
} 