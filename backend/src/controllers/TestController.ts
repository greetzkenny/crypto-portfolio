import { Request, Response } from "oak";
import { UserRepository } from "../repositories/UserRepository.ts";

export class TestController {
  private userRepository: UserRepository;

  constructor(userRepository: UserRepository) {
    this.userRepository = userRepository;
  }

  testDbConnection = async (ctx: { request: Request; response: Response }) => {
    try {
      // Test basic database connectivity
      const testUser = await this.userRepository.findByUsername("simpletest");
      
      ctx.response.status = 200;
      ctx.response.body = {
        message: "Database connection successful",
        userFound: !!testUser,
        userData: testUser ? {
          id: testUser.id,
          username: testUser.username,
          hasPasswordHash: !!testUser.passwordHash,
          passwordHashLength: testUser.passwordHash?.length,
          passwordHashPreview: testUser.passwordHash?.substring(0, 20)
        } : null
      };
    } catch (error) {
      console.error("Test endpoint error:", error);
      ctx.response.status = 500;
      ctx.response.body = {
        error: "Database test failed",
        details: error.message
      };
    }
  };
} 