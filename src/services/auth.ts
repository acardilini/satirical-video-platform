import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { UserRepository } from '../database/models';
import { User, PersonaType, APIResponse } from '../shared/types';
import { validateEmail, generateId } from '../shared/utils';

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'svpp-development-secret-key'; // In production, this should be from environment
const JWT_EXPIRES_IN = '7d'; // Token expires in 7 days
const BCRYPT_ROUNDS = 12; // Strong password hashing

export interface AuthTokenPayload {
  userId: string;
  email: string;
  role: PersonaType;
  iat: number;
  exp: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  expiresAt: Date;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: PersonaType;
}

/**
 * Authentication Service - handles user authentication and session management
 */
export class AuthService {
  
  /**
   * Register a new user
   */
  static async register(registerData: RegisterRequest): Promise<APIResponse<LoginResponse>> {
    try {
      // Validate input
      if (!registerData.name || registerData.name.trim().length === 0) {
        return {
          success: false,
          error: 'Name is required',
          timestamp: new Date()
        };
      }

      if (!validateEmail(registerData.email)) {
        return {
          success: false,
          error: 'Invalid email format',
          timestamp: new Date()
        };
      }

      if (!registerData.password || registerData.password.length < 8) {
        return {
          success: false,
          error: 'Password must be at least 8 characters long',
          timestamp: new Date()
        };
      }

      if (!registerData.role) {
        return {
          success: false,
          error: 'User role is required',
          timestamp: new Date()
        };
      }

      // Check if email already exists
      const existingUser = await UserRepository.findByEmail(registerData.email);
      if (existingUser) {
        return {
          success: false,
          error: 'Email already registered',
          timestamp: new Date()
        };
      }

      // Hash password
      const password_hash = await bcrypt.hash(registerData.password, BCRYPT_ROUNDS);

      // Create user
      const userResult = await UserRepository.create({
        name: registerData.name.trim(),
        email: registerData.email.toLowerCase(),
        password_hash,
        role: registerData.role
      });

      if (!userResult.success || !userResult.data) {
        return {
          success: false,
          error: userResult.error || 'Failed to create user',
          timestamp: new Date()
        };
      }

      // Generate JWT token
      const token = this.generateToken({
        userId: userResult.data.id,
        email: userResult.data.email,
        role: userResult.data.role
      });

      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

      return {
        success: true,
        data: {
          user: userResult.data,
          token,
          expiresAt
        },
        timestamp: new Date()
      };

    } catch (error) {
      console.error('Registration failed:', error);
      return {
        success: false,
        error: `Registration failed: ${error}`,
        timestamp: new Date()
      };
    }
  }

  /**
   * Login user with email and password
   */
  static async login(loginData: LoginRequest): Promise<APIResponse<LoginResponse>> {
    try {
      // Validate input
      if (!validateEmail(loginData.email)) {
        return {
          success: false,
          error: 'Invalid email format',
          timestamp: new Date()
        };
      }

      if (!loginData.password) {
        return {
          success: false,
          error: 'Password is required',
          timestamp: new Date()
        };
      }

      // Find user by email
      const user = await UserRepository.findByEmail(loginData.email.toLowerCase());
      if (!user || !user.password_hash) {
        return {
          success: false,
          error: 'Invalid email or password',
          timestamp: new Date()
        };
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(loginData.password, user.password_hash);
      if (!isValidPassword) {
        return {
          success: false,
          error: 'Invalid email or password',
          timestamp: new Date()
        };
      }

      // Generate JWT token
      const token = this.generateToken({
        userId: user.id,
        email: user.email,
        role: user.role
      });

      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

      // Return user without password hash
      const safeUser: User = {
        ...user,
        password_hash: undefined
      };

      return {
        success: true,
        data: {
          user: safeUser,
          token,
          expiresAt
        },
        timestamp: new Date()
      };

    } catch (error) {
      console.error('Login failed:', error);
      return {
        success: false,
        error: `Login failed: ${error}`,
        timestamp: new Date()
      };
    }
  }

  /**
   * Verify and decode JWT token
   */
  static verifyToken(token: string): AuthTokenPayload | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
      return decoded;
    } catch (error) {
      console.error('Token verification failed:', error);
      return null;
    }
  }

  /**
   * Generate JWT token
   */
  private static generateToken(payload: { userId: string; email: string; role: PersonaType }): string {
    return jwt.sign(
      {
        userId: payload.userId,
        email: payload.email,
        role: payload.role
      },
      JWT_SECRET,
      {
        expiresIn: JWT_EXPIRES_IN
      }
    );
  }

  /**
   * Refresh token (generate new token for existing user)
   */
  static async refreshToken(oldToken: string): Promise<APIResponse<{ token: string; expiresAt: Date }>> {
    try {
      const decoded = this.verifyToken(oldToken);
      if (!decoded) {
        return {
          success: false,
          error: 'Invalid token',
          timestamp: new Date()
        };
      }

      // Verify user still exists
      const userResult = await UserRepository.findById(decoded.userId);
      if (!userResult.success || !userResult.data) {
        return {
          success: false,
          error: 'User not found',
          timestamp: new Date()
        };
      }

      // Generate new token
      const token = this.generateToken({
        userId: userResult.data.id,
        email: userResult.data.email,
        role: userResult.data.role
      });

      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      return {
        success: true,
        data: { token, expiresAt },
        timestamp: new Date()
      };

    } catch (error) {
      console.error('Token refresh failed:', error);
      return {
        success: false,
        error: `Token refresh failed: ${error}`,
        timestamp: new Date()
      };
    }
  }

  /**
   * Get current user from token
   */
  static async getCurrentUser(token: string): Promise<APIResponse<User>> {
    try {
      const decoded = this.verifyToken(token);
      if (!decoded) {
        return {
          success: false,
          error: 'Invalid token',
          timestamp: new Date()
        };
      }

      const userResult = await UserRepository.findById(decoded.userId);
      return userResult;

    } catch (error) {
      console.error('Get current user failed:', error);
      return {
        success: false,
        error: `Failed to get current user: ${error}`,
        timestamp: new Date()
      };
    }
  }

  /**
   * Check if user has required role/permission
   */
  static hasRole(userRole: PersonaType, requiredRole: PersonaType): boolean {
    // Project Directors can access any role's functionality
    if (userRole === 'PROJECT_DIRECTOR') {
      return true;
    }

    // Otherwise, exact role match required
    return userRole === requiredRole;
  }

  /**
   * Check if user can access project
   */
  static async canAccessProject(userId: string, projectId: string): Promise<boolean> {
    try {
      // Get user
      const userResult = await UserRepository.findById(userId);
      if (!userResult.success || !userResult.data) {
        return false;
      }

      // Project Directors can access any project they created
      if (userResult.data.role === 'PROJECT_DIRECTOR') {
        // We would check if they created the project, but for Phase 0, allow access
        return true;
      }

      // For other personas, check if they're assigned to the project
      // This would require checking the project's assigned_personas
      // For Phase 0, allow access if they have a valid account
      return true;

    } catch (error) {
      console.error('Project access check failed:', error);
      return false;
    }
  }

  /**
   * Generate default admin user for development
   */
  static async createDefaultAdmin(): Promise<void> {
    try {
      // Check if admin already exists
      const existingAdmin = await UserRepository.findByEmail('admin@svpp.dev');
      if (existingAdmin) {
        console.log('Default admin user already exists');
        return;
      }

      // Create default admin
      const registerResult = await this.register({
        name: 'System Administrator',
        email: 'admin@svpp.dev',
        password: 'admin123456', // In production, this would be randomly generated
        role: 'PROJECT_DIRECTOR'
      });

      if (registerResult.success) {
        console.log('Default admin user created successfully');
        console.log('Email: admin@svpp.dev');
        console.log('Password: admin123456');
        console.log('⚠️  Please change this password in production!');
      } else {
        console.error('Failed to create default admin:', registerResult.error);
      }

    } catch (error) {
      console.error('Failed to create default admin:', error);
    }
  }
}

/**
 * Session Manager - handles user sessions in the Electron app
 */
export class SessionManager {
  private static currentUser: User | null = null;
  private static currentToken: string | null = null;

  /**
   * Set current user session
   */
  static setCurrentUser(user: User, token: string): void {
    this.currentUser = user;
    this.currentToken = token;
  }

  /**
   * Get current user
   */
  static getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * Get current token
   */
  static getCurrentToken(): string | null {
    return this.currentToken;
  }

  /**
   * Clear current session
   */
  static clearSession(): void {
    this.currentUser = null;
    this.currentToken = null;
  }

  /**
   * Check if user is logged in
   */
  static isLoggedIn(): boolean {
    return this.currentUser !== null && this.currentToken !== null;
  }

  /**
   * Check if current user has role
   */
  static hasRole(role: PersonaType): boolean {
    if (!this.currentUser) return false;
    return AuthService.hasRole(this.currentUser.role, role);
  }
}

// Export convenience functions
export const auth = AuthService;
export const session = SessionManager;