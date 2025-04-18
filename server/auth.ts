import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser, insertUserSchema, loginUserSchema, registerApiSchema } from "@shared/schema";
import { ZodError, z } from "zod";
import { fromZodError } from "zod-validation-error";
import { debug } from "./debug";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  // Use environment variable for session secret with a fallback
  const sessionSecret = process.env.SESSION_SECRET || 'some-secret-key-for-dev-only';
  
  const sessionSettings: session.SessionOptions = {
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        debug('auth', 'Login attempt', { username });
        const user = await storage.getUserByUsername(username);
        
        if (!user) {
          debug('auth', 'User not found', { username });
          return done(null, false, { message: "Invalid username or password" });
        }
        
        const isPasswordValid = await comparePasswords(password, user.password);
        debug('auth', 'Password validation', { 
          username, 
          isValid: isPasswordValid 
        });
        
        if (!isPasswordValid) {
          return done(null, false, { message: "Invalid username or password" });
        } else {
          debug('auth', 'Login successful', { userId: user.id, username: user.username });
          return done(null, user);
        }
      } catch (error) {
        debug('auth', 'Login error', { error });
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return done(new Error("User not found"), null);
      }
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      // Validate request
      const result = registerApiSchema.safeParse(req.body);
      
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ 
          message: validationError.message
        });
      }
      
      const { username, email, password } = result.data;

      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Check if email already exists
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already in use" });
      }

      // Create user with hashed password
      const user = await storage.createUser({
        username,
        email,
        password: await hashPassword(password),
      });

      // Filter out password before sending response
      const { password: _, ...safeUser } = user;

      // Login the user after registration
      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(safeUser);
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    try {
      debug('auth', 'Login API request received', { body: req.body });
      
      // Since loginUserSchema includes email field but login only provides username and password,
      // use a simpler schema for validation
      const loginRequestSchema = z.object({
        username: z.string().min(3, "Username must be at least 3 characters"),
        password: z.string().min(8, "Password must be at least 8 characters"),
      });
      
      const result = loginRequestSchema.safeParse(req.body);
      
      if (!result.success) {
        debug('auth', 'Login validation failed', { 
          error: result.error.format() 
        });
        const validationError = fromZodError(result.error);
        return res.status(400).json({ 
          message: validationError.message
        });
      }
      
      debug('auth', 'Login validation successful', { username: req.body.username });
      
      passport.authenticate("local", (err: Error, user: SelectUser | false, info: any) => {
        if (err) {
          debug('auth', 'Authentication error', { error: err });
          return next(err);
        }
        if (!user) {
          debug('auth', 'Authentication failed', { info });
          return res.status(401).json({ message: info.message || "Authentication failed" });
        }
        
        debug('auth', 'Authentication successful, proceeding to login', { 
          userId: user.id,
          username: user.username 
        });
        
        req.login(user, (err) => {
          if (err) {
            debug('auth', 'Login session error', { error: err });
            return next(err);
          }
          
          debug('auth', 'Login session created successfully');
          
          // Filter out password before sending response
          const { password, ...safeUser } = user;
          return res.status(200).json(safeUser);
        });
      })(req, res, next);
    } catch (error) {
      debug('auth', 'Unexpected login error', { error });
      next(error);
    }
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }
    
    // Filter out password before sending response
    const { password, ...safeUser } = req.user as SelectUser;
    res.json(safeUser);
  });
}
