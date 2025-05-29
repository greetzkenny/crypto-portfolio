import { Context, Next } from "@oak/oak";

export function createCorsMiddleware(origin: string = "*") {
  return async (ctx: Context, next: Next) => {
    // Set CORS headers
    ctx.response.headers.set("Access-Control-Allow-Origin", origin);
    ctx.response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    ctx.response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    ctx.response.headers.set("Access-Control-Allow-Credentials", "true");

    // Handle preflight requests
    if (ctx.request.method === "OPTIONS") {
      ctx.response.status = 200;
      return;
    }

    await next();
  };
} 