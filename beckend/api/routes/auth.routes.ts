import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Logger } from 'winston';
import { createLogger } from '../../shared/utils/logger';
import { DatabaseClient } from '../../shared/database/client';
import bcrypt from 'bcrypt';

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  userId?: string;
  token?: string;
  refreshToken?: string;
  message?: string;
  error?: string;
}

export class AuthRoutes {
  private logger: Logger;
  private db: DatabaseClient;
  private saltRounds = 10;

  constructor(db: DatabaseClient) {
    this.logger = createLogger('AuthRoutes');
    this.db = db;
  }

  /**
   * Register authentication routes
   */
  public registerRoutes(fastify: FastifyInstance, prefix: string): void {
    fastify.post(`${prefix}/auth/register`, async (request: FastifyRequest, reply: FastifyReply) => {
      return this.handleRegister(request, reply);
    });

    fastify.post(`${prefix}/auth/login`, async (request: FastifyRequest, reply: FastifyReply) => {
      return this.handleLogin(request, reply);
    });

    fastify.post(`${prefix}/auth/refresh`, async (request: FastifyRequest, reply: FastifyReply) => {
      return this.handleRefresh(request, reply);
    });

    fastify.post(`${prefix}/auth/logout`, async (request: FastifyRequest, reply: FastifyReply) => {
      return this.handleLogout(request, reply);
    });

    this.logger.info('Auth routes registered');
  }

  /**
   * Handle user registration
   */
  private async handleRegister(request: FastifyRequest, reply: FastifyReply): Promise<AuthResponse> {
    try {
      const { email, password, name } = request.body as RegisterRequest;

      // Validate input
      if (!email || !password || !name) {
        reply.code(400);
        return {
          success: false,
          error: 'Email, password, and name are required'
        };
      }

      if (password.length < 8) {
        reply.code(400);
        return {
          success: false,
          error: 'Password must be at least 8 characters'
        };
      }

      // Check if user exists
      const { data: existing } = await this.db.getClient()
        .from('users')
        .select('id')
        .eq('email', email.toLowerCase())
        .single();

      if (existing) {
        reply.code(409);
        return {
          success: false,
          error: 'User already exists'
        };
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, this.saltRounds);

      // Create user
      const { data: user, error } = await this.db.getClient()
        .from('users')
        .insert({
          email: email.toLowerCase(),
          password_hash: hashedPassword,
          name,
          created_at: new Date(),
          updated_at: new Date()
        })
        .select('id')
        .single();

      if (error) {
        this.logger.error('Failed to create user', { error: error.message });
        reply.code(500);
        return {
          success: false,
          error: 'Failed to create user'
        };
      }

      // Generate tokens
      const token = fastify.jwt.sign({ userId: user.id, email }, { expiresIn: '24h' });
      const refreshToken = fastify.jwt.sign({ userId: user.id }, { expiresIn: '30d' });

      // Store refresh token
      await this.db.getClient()
        .from('refresh_tokens')
        .insert({
          user_id: user.id,
          token: refreshToken,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          created_at: new Date()
        });

      this.logger.info('User registered', { userId: user.id, email });

      return {
        success: true,
        userId: user.id,
        token,
        refreshToken,
        message: 'User registered successfully'
      };
    } catch (error) {
      this.logger.error('Registration error', {
        error: error instanceof Error ? error.message : String(error)
      });

      reply.code(500);
      return {
        success: false,
        error: 'Registration failed'
      };
    }
  }

  /**
   * Handle user login
   */
  private async handleLogin(request: FastifyRequest, reply: FastifyReply): Promise<AuthResponse> {
    try {
      const { email, password } = request.body as LoginRequest;

      // Validate input
      if (!email || !password) {
        reply.code(400);
        return {
          success: false,
          error: 'Email and password are required'
        };
      }

      // Get user
      const { data: user, error } = await this.db.getClient()
        .from('users')
        .select('id, password_hash, email')
        .eq('email', email.toLowerCase())
        .single();

      if (error || !user) {
        reply.code(401);
        return {
          success: false,
          error: 'Invalid email or password'
        };
      }

      // Verify password
      const passwordMatch = await bcrypt.compare(password, user.password_hash);

      if (!passwordMatch) {
        reply.code(401);
        return {
          success: false,
          error: 'Invalid email or password'
        };
      }

      // Generate tokens
      const token = (request.server as any).jwt.sign({ userId: user.id, email: user.email }, { expiresIn: '24h' });
      const refreshToken = (request.server as any).jwt.sign({ userId: user.id }, { expiresIn: '30d' });

      // Store refresh token
      await this.db.getClient()
        .from('refresh_tokens')
        .insert({
          user_id: user.id,
          token: refreshToken,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          created_at: new Date()
        });

      this.logger.info('User logged in', { userId: user.id, email: user.email });

      return {
        success: true,
        userId: user.id,
        token,
        refreshToken,
        message: 'Login successful'
      };
    } catch (error) {
      this.logger.error('Login error', {
        error: error instanceof Error ? error.message : String(error)
      });

      reply.code(500);
      return {
        success: false,
        error: 'Login failed'
      };
    }
  }

  /**
   * Handle token refresh
   */
  private async handleRefresh(request: FastifyRequest, reply: FastifyReply): Promise<AuthResponse> {
    try {
      const { refreshToken } = request.body as { refreshToken: string };

      if (!refreshToken) {
        reply.code(400);
        return {
          success: false,
          error: 'Refresh token is required'
        };
      }

      // Verify refresh token
      let decoded: any;
      try {
        decoded = (request.server as any).jwt.verify(refreshToken);
      } catch (error) {
        reply.code(401);
        return {
          success: false,
          error: 'Invalid or expired refresh token'
        };
      }

      // Check if refresh token exists in database
      const { data: storedToken, error } = await this.db.getClient()
        .from('refresh_tokens')
        .select('*')
        .eq('token', refreshToken)
        .eq('user_id', decoded.userId)
        .single();

      if (error || !storedToken) {
        reply.code(401);
        return {
          success: false,
          error: 'Refresh token not found or expired'
        };
      }

      // Get user for email
      const { data: user } = await this.db.getClient()
        .from('users')
        .select('id, email')
        .eq('id', decoded.userId)
        .single();

      if (!user) {
        reply.code(401);
        return {
          success: false,
          error: 'User not found'
        };
      }

      // Generate new access token
      const newToken = (request.server as any).jwt.sign({ userId: user.id, email: user.email }, { expiresIn: '24h' });

      this.logger.info('Token refreshed', { userId: user.id });

      return {
        success: true,
        token: newToken,
        message: 'Token refreshed successfully'
      };
    } catch (error) {
      this.logger.error('Token refresh error', {
        error: error instanceof Error ? error.message : String(error)
      });

      reply.code(500);
      return {
        success: false,
        error: 'Token refresh failed'
      };
    }
  }

  /**
   * Handle logout
   */
  private async handleLogout(request: FastifyRequest, reply: FastifyReply): Promise<{ success: boolean; message?: string }> {
    try {
      // Verify user is authenticated
      if (!request.user) {
        reply.code(401);
        return { success: false };
      }

      const userId = (request.user as any).userId || (request.user as any).sub;

      // Invalidate all refresh tokens for user
      await this.db.getClient()
        .from('refresh_tokens')
        .delete()
        .eq('user_id', userId);

      this.logger.info('User logged out', { userId });

      return {
        success: true,
        message: 'Logout successful'
      };
    } catch (error) {
      this.logger.error('Logout error', {
        error: error instanceof Error ? error.message : String(error)
      });

      reply.code(500);
      return { success: false };
    }
  }
}
