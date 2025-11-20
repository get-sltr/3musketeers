import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { Logger } from 'winston';
import { createLogger } from '../shared/utils/logger';
import { ErosError } from '../shared/types/eros.types';

export interface ServerConfig {
  port: number;
  host: string;
  jwtSecret: string;
  environment: 'development' | 'production';
  logLevel: string;
}

export class ErosAPIServer {
  private fastify: FastifyInstance;
  private logger: Logger;
  private config: ServerConfig;

  constructor(config: ServerConfig) {
    this.config = config;
    this.logger = createLogger('ErosAPIServer');
    this.fastify = Fastify({
      logger: this.config.environment === 'development',
      requestIdHeader: 'x-request-id',
      requestIdLogLabel: 'reqId'
    });
  }

  /**
   * Initialize and start the server
   */
  async start(): Promise<void> {
    try {
      // Register plugins
      await this.registerPlugins();

      // Register middleware
      await this.registerMiddleware();

      // Register routes
      await this.registerRoutes();

      // Register error handler
      this.registerErrorHandler();

      // Start listening
      await this.fastify.listen({ port: this.config.port, host: this.config.host });

      this.logger.info('EROS API Server started', {
        port: this.config.port,
        host: this.config.host,
        environment: this.config.environment
      });
    } catch (error) {
      this.logger.error('Failed to start EROS API Server', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Stop the server gracefully
   */
  async stop(): Promise<void> {
    await this.fastify.close();
    this.logger.info('EROS API Server stopped');
  }

  /**
   * Register Fastify plugins
   */
  private async registerPlugins(): Promise<void> {
    // CORS
    await this.fastify.register(cors, {
      origin: true,
      credentials: true
    });

    // JWT
    await this.fastify.register(jwt, {
      secret: this.config.jwtSecret,
      sign: { expiresIn: '24h' }
    });

    this.logger.debug('Plugins registered');
  }

  /**
   * Register middleware
   */
  private async registerMiddleware(): Promise<void> {
    // Request logging
    this.fastify.addHook('onRequest', async (request, reply) => {
      this.logger.debug(`${request.method} ${request.url}`);
    });

    // Response logging
    this.fastify.addHook('onResponse', async (request, reply) => {
      this.logger.debug(`${request.method} ${request.url} - ${reply.statusCode}`);
    });

    this.logger.debug('Middleware registered');
  }

  /**
   * Register all API routes
   */
  private async registerRoutes(): Promise<void> {
    // Health check (no auth required)
    this.fastify.get('/health', async (request, reply) => {
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      };
    });

    // API v1 routes
    const apiPrefix = '/api/v1';

    // Auth routes (no auth required)
    await this.registerAuthRoutes(apiPrefix);

    // Protected routes (require auth)
    // These will be added after implementing route handlers

    this.logger.debug('Routes registered');
  }

  /**
   * Register authentication routes
   */
  private async registerAuthRoutes(prefix: string): Promise<void> {
    this.fastify.post(`${prefix}/auth/register`, async (request: FastifyRequest, reply: FastifyReply) => {
      return { message: 'Register endpoint - to be implemented' };
    });

    this.fastify.post(`${prefix}/auth/login`, async (request: FastifyRequest, reply: FastifyReply) => {
      return { message: 'Login endpoint - to be implemented' };
    });

    this.fastify.post(`${prefix}/auth/refresh`, async (request: FastifyRequest, reply: FastifyReply) => {
      return { message: 'Refresh endpoint - to be implemented' };
    });

    this.fastify.post(`${prefix}/auth/logout`, async (request: FastifyRequest, reply: FastifyReply) => {
      return { message: 'Logout endpoint - to be implemented' };
    });
  }

  /**
   * Global error handler
   */
  private registerErrorHandler(): void {
    this.fastify.setErrorHandler((error, request, reply) => {
      this.logger.error('Request error', {
        path: request.url,
        method: request.method,
        error: error instanceof Error ? error.message : String(error)
      });

      if (error instanceof ErosError) {
        reply.code(error.statusCode).send({
          success: false,
          error: {
            code: error.code,
            message: error.message,
            details: error.details
          }
        });
      } else {
        reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'An unexpected error occurred'
          }
        });
      }
    });
  }
}

/**
 * Factory function to create and start the server
 */
export async function createAndStartServer(config: ServerConfig): Promise<ErosAPIServer> {
  const server = new ErosAPIServer(config);
  await server.start();
  return server;
}
