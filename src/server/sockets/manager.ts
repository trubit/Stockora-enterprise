import type { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { redis } from '../database/redis.js';
import { logger } from '../logger.js';
import { config } from '../../config/environment.js';
import jwt from 'jsonwebtoken';

interface JwtTokenPayload {
  id: string;
  roleName: string;
}

export class SocketManager {
  private static instance: SocketManager | null = null;
  private io: SocketServer | null = null;
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  private subClient: any = null;

  private constructor() {}

  public static getInstance(): SocketManager {
    if (!SocketManager.instance) {
      SocketManager.instance = new SocketManager();
    }
    return SocketManager.instance;
  }

  public initialize(server: HttpServer): SocketServer {
    if (this.io) return this.io;

    this.io = new SocketServer(server, {
      cors: {
        origin: config.corsOrigin,
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    try {
      const pubClient = redis;
      this.subClient = redis.duplicate();
      this.io.adapter(createAdapter(pubClient, this.subClient));
      logger.info('Socket.IO Redis Pub/Sub adapter registered.');
    } catch (err) {
      logger.error('Failed to configure Socket.IO Redis adapter:', err);
    }

    // JWT authentication middleware on handshake
    this.io.use((socket: Socket, next) => {
      const token =
        (socket.handshake.auth?.token as string | undefined) ||
        (socket.handshake.headers?.authorization?.replace('Bearer ', '') ?? '');

      if (!token) {
        // Allow unauthenticated connections for public broadcasts, but no room join
        return next();
      }

      try {
        const decoded = jwt.verify(token, config.jwtSecret) as JwtTokenPayload;
        // Attach user info to socket data
        socket.data.userId = decoded.id;
        socket.data.roleName = decoded.roleName;
      } catch {
        // Invalid token — proceed as unauthenticated (don't reject outright)
        logger.warn(`[Socket] Invalid JWT on handshake from ${socket.id}`);
      }
      next();
    });

    this.setupListeners();
    logger.info('Socket.IO server initialized successfully.');
    return this.io;
  }

  private setupListeners(): void {
    if (!this.io) return;

    this.io.on('connection', (socket: Socket) => {
      logger.info(`Client connected: ${socket.id} (user=${socket.data.userId ?? 'anon'}, role=${socket.data.roleName ?? 'none'})`);

      // Join personal user room
      if (socket.data.userId) {
        socket.join(`user:${socket.data.userId}`);
      }

      // Join role-based room
      if (socket.data.roleName) {
        socket.join(`role:${socket.data.roleName}`);
      }

      socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
      });
    });
  }

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  public emitGlobal(event: string, payload: any): void {
    if (!this.io) {
      logger.warn('Cannot emit event; Socket.IO is not initialized.');
      return;
    }
    this.io.emit(event, payload);
  }

  /**
   * Emit to a named room (e.g. 'user:<id>' or 'role:<roleName>').
   */
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  public emitToRoom(room: string, event: string, payload: any): void {
    if (!this.io) {
      logger.warn('Cannot emit to room; Socket.IO is not initialized.');
      return;
    }
    this.io.to(room).emit(event, payload);
  }

  public async shutdown(): Promise<void> {
    if (this.subClient) {
      try {
        await this.subClient.quit();
        logger.info('Socket.IO subscriber Redis client closed.');
      } catch (err) {
        logger.error('Error closing Socket.IO subscriber Redis:', err);
      }
    }

    if (!this.io) return;
    await new Promise<void>((resolve) => {
      this.io!.close(() => {
        logger.info('Socket.IO server closed.');
        resolve();
      });
    });
  }
}
