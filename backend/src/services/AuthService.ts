import { create, verify } from "djwt";
import { UserRepository } from "../repositories/UserRepository.ts";
import { PortfolioRepository } from "../repositories/PortfolioRepository.ts";
import { AuthResponse, JWTPayload, LoginRequest, RegisterRequest } from "../types/index.ts";

// Web Crypto API based password hashing (more reliable than bcrypt in Deno)
class PasswordUtil {
  static async hash(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const passwordData = encoder.encode(password);
    
    const key = await crypto.subtle.importKey(
      "raw",
      passwordData,
      { name: "PBKDF2" },
      false,
      ["deriveBits"]
    );
    
    const hashBuffer = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: "SHA-256"
      },
      key,
      256
    );
    
    const hashArray = new Uint8Array(hashBuffer);
    const combined = new Uint8Array(salt.length + hashArray.length);
    combined.set(salt);
    combined.set(hashArray, salt.length);
    
    return btoa(String.fromCharCode(...combined));
  }
  
  static async compare(password: string, hash: string): Promise<boolean> {
    try {
      const encoder = new TextEncoder();
      
      // Decode the base64 hash
      const hashBytes = Uint8Array.from(atob(hash), c => c.charCodeAt(0));
      
      const salt = hashBytes.slice(0, 16);
      const storedHash = hashBytes.slice(16);
      
      const passwordData = encoder.encode(password);
      const key = await crypto.subtle.importKey(
        "raw",
        passwordData,
        { name: "PBKDF2" },
        false,
        ["deriveBits"]
      );
      
      const hashBuffer = await crypto.subtle.deriveBits(
        {
          name: "PBKDF2",
          salt: salt,
          iterations: 100000,
          hash: "SHA-256"
        },
        key,
        256
      );
      
      const computedHash = new Uint8Array(hashBuffer);
      
      // Constant time comparison
      if (computedHash.length !== storedHash.length) return false;
      let result = 0;
      for (let i = 0; i < computedHash.length; i++) {
        result |= computedHash[i] ^ storedHash[i];
      }
      return result === 0;
    } catch (error) {
      console.error("Password comparison error:", error);
      return false;
    }
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
      console.log("Registration attempt for username:", username);
      
      // Check if user already exists
      const existingUser = await this.userRepository.findByUsername(username);
      if (existingUser) {
        throw new Error("Username already exists");
      }

      // Hash password using Web Crypto API
      console.log("Hashing password...");
      const passwordHash = await PasswordUtil.hash(password);
      console.log("Password hashed successfully");

      // Create user
      console.log("Creating user in database...");
      const user = await this.userRepository.create(username, passwordHash);
      console.log("User created with ID:", user.id);

      // Create default portfolio for the user
      try {
        console.log("Creating default portfolio...");
        await this.portfolioRepository.create(user.id, "Default Portfolio");
        console.log("Default portfolio created");
      } catch (portfolioError) {
        console.error("Failed to create default portfolio:", portfolioError);
        // Don't fail registration if portfolio creation fails
      }

      // Generate JWT token
      console.log("Generating JWT token...");
      const token = await this.generateToken(user.id, user.username);
      console.log("JWT token generated successfully");

      return {
        userId: user.id,
        username: user.username,
        token,
      };
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  }

  async login(request: LoginRequest): Promise<AuthResponse> {
    const { username, password } = request;

    try {
      console.log("Login attempt for username:", username);
      
      // Find user
      const user = await this.userRepository.findByUsername(username);
      if (!user) {
        throw new Error("Invalid credentials");
      }
      console.log("User found in database");

      // Verify password using Web Crypto API
      console.log("Verifying password...");
      const isValidPassword = await PasswordUtil.compare(password, user.passwordHash);
      if (!isValidPassword) {
        console.log("Password verification failed");
        throw new Error("Invalid credentials");
      }
      console.log("Password verified successfully");

      // Generate JWT token
      const token = await this.generateToken(user.id, user.username);

      return {
        userId: user.id,
        username: user.username,
        token,
      };
    } catch (error) {
      console.error("Login error:", error);
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
      const isValidPassword = await PasswordUtil.compare(currentPassword, user.passwordHash);
      if (!isValidPassword) {
        throw new Error("Invalid current password");
      }

      // Hash new password
      const newPasswordHash = await PasswordUtil.hash(newPassword);

      // Update user
      await this.userRepository.update(userId, { passwordHash: newPasswordHash });
    } catch (error) {
      console.error("Change password error:", error);
      throw error;
    }
  }
} 