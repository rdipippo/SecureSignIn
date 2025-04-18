import { Express, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { storage } from "./storage";
import { sendPasswordResetEmail } from "./email";
import { hashPassword } from "./auth";

// Schema for requesting password reset
const requestResetSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

// Schema for validating reset token and new password
const resetPasswordSchema = z.object({
  token: z.string().min(10, "Invalid reset token"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export function setupPasswordReset(app: Express) {
  // Request a password reset (sends an email with a reset link)
  app.post("/api/request-password-reset", async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body
      const result = requestResetSchema.safeParse(req.body);
      
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ message: validationError.message });
      }
      
      const { email } = result.data;
      
      // Find user by email
      const user = await storage.getUserByEmail(email);
      
      // Always return success, even if user not found (security best practice)
      // This prevents user enumeration attacks
      if (!user) {
        console.log(`Password reset requested for non-existent email: ${email}`);
        return res.status(200).json({ 
          message: "If your email is registered, you will receive a password reset link shortly" 
        });
      }
      
      // Generate password reset token
      const token = await storage.createPasswordResetToken(user.id);
      
      // Get application URL from environment or use a default
      const appBaseUrl = process.env.APP_URL || `http://${req.headers.host}`;
      const resetUrl = `${appBaseUrl}/reset-password`;
      
      // Send the password reset email
      const emailSent = await sendPasswordResetEmail(
        user.email,
        token,
        resetUrl
      );
      
      if (!emailSent) {
        console.error(`Failed to send password reset email to ${user.email}`);
        return res.status(500).json({ message: "Failed to send password reset email" });
      }
      
      return res.status(200).json({ 
        message: "If your email is registered, you will receive a password reset link shortly" 
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Reset password with a valid token
  app.post("/api/reset-password", async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body
      const result = resetPasswordSchema.safeParse(req.body);
      
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ message: validationError.message });
      }
      
      const { token, password } = result.data;
      
      // Get token from database
      const resetToken = await storage.getPasswordResetToken(token);
      
      // Check if token exists, is valid and not expired
      if (!resetToken) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }
      
      if (resetToken.used) {
        return res.status(400).json({ message: "This reset token has already been used" });
      }
      
      const now = new Date();
      if (now > resetToken.expiresAt) {
        return res.status(400).json({ message: "Reset token has expired" });
      }
      
      // Hash the new password
      const hashedPassword = await hashPassword(password);
      
      // Update the user's password
      const updated = await storage.updateUserPassword(resetToken.userId, hashedPassword);
      
      if (!updated) {
        return res.status(500).json({ message: "Failed to update password" });
      }
      
      // Mark token as used
      await storage.markTokenAsUsed(resetToken.id);
      
      return res.status(200).json({ message: "Password has been reset successfully" });
    } catch (error) {
      next(error);
    }
  });
}