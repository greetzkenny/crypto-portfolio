import { Context } from "@oak/oak";
import { AuthService } from "../services/AuthService.ts";
import { LoginRequest, RegisterRequest } from "../types/index.ts";

export class AuthController {
  private authService: AuthService;

  constructor(authService: AuthService) {
    this.authService = authService;
  }

  async register(ctx: Context) {
    try {
      const body = await ctx.request.body({ type: "json" }).value;
      const request: RegisterRequest = {
        username: body.username,
        password: body.password,
      };

      // Basic validation
      if (!request.username || !request.password) {
        ctx.response.status = 400;
        ctx.response.body = { error: "Username and password are required" };
        return;
      }

      if (request.username.length < 3) {
        ctx.response.status = 400;
        ctx.response.body = { error: "Username must be at least 3 characters long" };
        return;
      }

      if (request.password.length < 6) {
        ctx.response.status = 400;
        ctx.response.body = { error: "Password must be at least 6 characters long" };
        return;
      }

      const response = await this.authService.register(request);
      ctx.response.status = 201;
      ctx.response.body = response;
    } catch (error) {
      console.error("Registration error in controller:", error);
      
      // Handle specific error types
      if (error instanceof Error) {
        if (error.message.includes("Username already exists")) {
          ctx.response.status = 409;
          ctx.response.body = { error: "Username already exists" };
          return;
        }
        if (error.message.includes("crypto") || error.message.includes("password")) {
          ctx.response.status = 500;
          ctx.response.body = { error: "Password processing failed. Please try again." };
          return;
        }
      }

      // Generic error response
      ctx.response.status = 400;
      ctx.response.body = { 
        error: error instanceof Error ? error.message : "Registration failed",
        details: "Please check your input and try again"
      };
    }
  }

  async login(ctx: Context) {
    try {
      const body = await ctx.request.body({ type: "json" }).value;
      const request: LoginRequest = {
        username: body.username,
        password: body.password,
      };

      // Basic validation
      if (!request.username || !request.password) {
        ctx.response.status = 400;
        ctx.response.body = { error: "Username and password are required" };
        return;
      }

      const response = await this.authService.login(request);
      ctx.response.status = 200;
      ctx.response.body = response;
    } catch (error) {
      console.error("Login error in controller:", error);
      
      // Handle specific error types
      if (error instanceof Error) {
        if (error.message.includes("crypto") || error.message.includes("password")) {
          ctx.response.status = 500;
          ctx.response.body = { error: "Password verification failed. Please try again." };
          return;
        }
      }

      // Generic unauthorized response for login failures
      ctx.response.status = 401;
      ctx.response.body = { 
        error: "Invalid credentials",
        details: "Please check your username and password"
      };
    }
  }

  async verifyToken(ctx: Context) {
    try {
      const authHeader = ctx.request.headers.get("Authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        ctx.response.status = 401;
        ctx.response.body = { error: "No token provided" };
        return;
      }

      const token = authHeader.substring(7);
      const payload = await this.authService.verifyToken(token);
      
      ctx.response.status = 200;
      ctx.response.body = { 
        valid: true, 
        userId: payload.userId, 
        username: payload.username 
      };
    } catch (error) {
      console.error("Token verification error in controller:", error);
      ctx.response.status = 401;
      ctx.response.body = { error: "Invalid token" };
    }
  }

  async changePassword(ctx: Context) {
    try {
      const body = await ctx.request.body({ type: "json" }).value;
      const { currentPassword, newPassword } = body;

      // Basic validation
      if (!currentPassword || !newPassword) {
        ctx.response.status = 400;
        ctx.response.body = { error: "Current password and new password are required" };
        return;
      }

      if (newPassword.length < 6) {
        ctx.response.status = 400;
        ctx.response.body = { error: "New password must be at least 6 characters long" };
        return;
      }

      // Get user ID from context (set by auth middleware)
      const userId = ctx.state.userId;
      if (!userId) {
        ctx.response.status = 401;
        ctx.response.body = { error: "Authentication required" };
        return;
      }

      await this.authService.changePassword(userId, currentPassword, newPassword);
      
      ctx.response.status = 200;
      ctx.response.body = { message: "Password changed successfully" };
    } catch (error) {
      console.error("Change password error in controller:", error);
      
      // Handle specific error types
      if (error instanceof Error) {
        if (error.message.includes("crypto") || error.message.includes("password")) {
          ctx.response.status = 500;
          ctx.response.body = { error: "Password processing failed. Please try again." };
          return;
        }
        if (error.message.includes("Invalid current password")) {
          ctx.response.status = 400;
          ctx.response.body = { error: "Current password is incorrect" };
          return;
        }
      }

      ctx.response.status = 400;
      ctx.response.body = { 
        error: error instanceof Error ? error.message : "Failed to change password",
        details: "Please try again"
      };
    }
  }
} 