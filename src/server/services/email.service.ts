import nodemailer from 'nodemailer';
import { logger } from '../logger.js';
import { ResilientExecutor } from '../utils/resiliency/index.js';

export class EmailService {
  private static transporter: nodemailer.Transporter | null = null;

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  private static getTransporter(): any {
    if (this.transporter) return this.transporter;

    const host = process.env.SMTP_HOST;
    if (!host || host === 'your_smtp_host_here') {
      logger.warn('[Email Service] SMTP configurations missing. Falling back to local console mock.');
      this.transporter = {
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        sendMail: async (options: any) => {
          logger.info(`[MOCK MAIL to: ${options.to}] | Subject: ${options.subject} | Text: ${options.text}`);
          return { messageId: 'mock-uuid-12345' };
        },
      } as unknown as nodemailer.Transporter;
      return this.transporter;
    }

    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    return this.transporter;
  }

  private static async send(options: nodemailer.SendMailOptions): Promise<void> {
    const transporter = this.getTransporter();
    await ResilientExecutor.execute(
      {
        name: 'EmailService',
        retryCount: 3,
        timeoutMs: 5000,
        backoffType: 'EXPONENTIAL',
        jitterType: 'DECORRELATED',
        bulkheadMaxConcurrency: 5,
        isIdempotent: true,
      },
      async () => {
        await transporter.sendMail(options);
      }
    );
  }

  public static async sendWelcome(email: string, username: string): Promise<void> {
    await this.send({
      from: process.env.EMAIL_FROM || 'noreply@stockora.com',
      to: email,
      subject: 'Welcome to Stockora Enterprise!',
      text: `Hello ${username},\n\nWelcome to Stockora Enterprise! Your account has been registered successfully.`,
    });
  }

  public static async sendVerificationLink(email: string, link: string): Promise<void> {
    await this.send({
      from: process.env.EMAIL_FROM || 'noreply@stockora.com',
      to: email,
      subject: 'Verify your Stockora Account',
      text: `Please verify your email by clicking the following link: ${link}`,
    });
  }

  public static async sendPasswordReset(email: string, link: string): Promise<void> {
    await this.send({
      from: process.env.EMAIL_FROM || 'noreply@stockora.com',
      to: email,
      subject: 'Reset your Stockora Password',
      text: `To reset your password, please click the following link: ${link}. This link will expire in 1 hour.`,
    });
  }
}
