import type { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import { logger } from '../logger.js';
import { config } from '../../config/environment.js';

export class SocketManager {
  private static instance: SocketManager | null = null;
  private io: SocketServer | null = null;

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

    this.setupListeners();
    logger.info('Socket.IO server initialized successfully.');
    return this.io;
  }

  private setupListeners(): void {
    if (!this.io) return;

    this.io.on('connection', (socket: Socket) => {
      logger.info(`Client connected to WebSocket: ${socket.id}`);

      socket.on('disconnect', () => {
        logger.info(`Client disconnected from WebSocket: ${socket.id}`);
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

  public async shutdown(): Promise<void> {
    if (!this.io) return;
    await new Promise<void>((resolve) => {
      this.io!.close(() => {
        logger.info('Socket.IO server closed.');
        resolve();
      });
    });
  }
}
