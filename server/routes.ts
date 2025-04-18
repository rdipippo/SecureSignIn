import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { setupPasswordReset } from "./password-reset";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);
  
  // Set up password reset routes
  setupPasswordReset(app);
  
  const httpServer = createServer(app);

  return httpServer;
}
