import { Context, Next } from "@oak/oak";
import { AuthService } from "../services/AuthService.ts";

export function createAuthMiddleware(authService: AuthService) {
  return async (ctx: Context, next: Next) => {
    try {
      const authHeader = ctx.request.headers.get("Authorization");
      
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        ctx.response.status = 401;
        ctx.response.body = { error: "No token provided" };
        return;
      }

      const token = authHeader.substring(7);
      const payload = await authService.verifyToken(token);
      
      // Add user info to context state
      ctx.state.userId = payload.userId;
      ctx.state.username = payload.username;
      
      await next();
    } catch (error) {
      console.error("Auth middleware error:", error);
      ctx.response.status = 401;
      ctx.response.body = { error: "Invalid token" };
    }
  };
}

// Optional auth middleware - doesn't fail if no token provided
export function createOptionalAuthMiddleware(authService: AuthService) {
  return async (ctx: Context, next: Next) => {
    try {
      const authHeader = ctx.request.headers.get("Authorization");
      
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        const payload = await authService.verifyToken(token);
        
        // Add user info to context state
        ctx.state.userId = payload.userId;
        ctx.state.username = payload.username;
      }
      
      await next();
    } catch (error) {
      // Silently continue without auth for optional middleware
      await next();
    }
  };
} 