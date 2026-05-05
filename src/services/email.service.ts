import nodemailer, { Transporter } from 'nodemailer';
import { config } from '../config/index.js';
import { logger } from '../lib/logger.js';
import { AppError } from '../utils/errors.js';

interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
}

export class EmailService {
    private static transporter: Transporter;

    /**
     * Initialize SMTP transporter
     */
    static initialize(): void {
        this.transporter = nodemailer.createTransport({
            host: config.SMTP_HOST,
            port: config.SMTP_PORT,
            secure: config.SMTP_PORT === 465,
            auth: {
                user: config.SMTP_USER,
                pass: config.SMTP_PASS
            }
        });

        logger.info('Email service initialized');
    }

    /**
     * Send email
     */
    static async send(options: EmailOptions): Promise<void> {
        if (!this.transporter) {
            this.initialize();
        }

        try {
            await this.transporter.sendMail({
                from: `${config.SMTP_FROM_NAME} <${config.SMTP_FROM_EMAIL}>`,
                to: options.to,
                subject: options.subject,
                html: options.html,
                text: options.text
            });

            logger.info(`Email sent to ${options.to}: ${options.subject}`);
        } catch (error: any) {
            logger.error(`Failed to send email to ${options.to}:`, error);
            throw new AppError(
                'Failed to send email',
                500,
                'EMAIL_SEND_FAILED'
            );
        }
    }

    /**
     * Send verification email
     */
    static async sendVerificationEmail(
        email: string,
        token: string,
        fullName?: string
    ): Promise<void> {
        const verificationUrl = `${config.API_URL}/api/auth/verify-email?token=${token}`;
        const name = fullName || email.split('@')[0];

        const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #007bff;">Verify Your Email</h1>
        </div>
        <div style="color: #333; line-height: 1.6;">
          <p>Hi ${name},</p>
          <p>Welcome to <strong>Manifex</strong>! We're excited to have you on board.</p>
          <p>To complete your registration and start exploring our platform, please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #007bff; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Verify Email Address</a>
          </div>
          <p>This link will expire in 24 hours. If the button above doesn't work, you can copy and paste the following link into your browser:</p>
          <p style="word-break: break-all; color: #007bff;">${verificationUrl}</p>
          <p>If you didn't create an account with us, you can safely ignore this email.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #888; text-align: center;">&copy; ${new Date().getFullYear()} Manifex. All rights reserved.</p>
        </div>
      </div>
    `;

        await this.send({
            to: email,
            subject: 'Confirm your Manifex account',
            html,
            text: `Please verify your email by clicking: ${verificationUrl}`
        });
    }

    /**
     * Send password reset email
     */
    static async sendPasswordResetEmail(
        email: string,
        token: string,
        fullName?: string
    ): Promise<void> {
        const resetUrl = config.PASSWORD_RESET_URL
            ? `${config.PASSWORD_RESET_URL}?token=${token}`
            : `${config.API_URL}/api/auth/reset-password?token=${token}`;
        const name = fullName || email.split('@')[0];

        const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #dc3545;">Reset Your Password</h1>
        </div>
        <div style="color: #333; line-height: 1.6;">
          <p>Hi ${name},</p>
          <p>We received a request to reset the password for your <strong>Manifex</strong> account.</p>
          <p>If you made this request, please click the button below to set a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #dc3545; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Reset Password</a>
          </div>
          <p><strong>Note:</strong> This link will expire in 1 hour for security reasons.</p>
          <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #888; text-align: center;">&copy; ${new Date().getFullYear()} Manifex. All rights reserved.</p>
        </div>
      </div>
    `;

        await this.send({
            to: email,
            subject: 'Reset your Manifex password',
            html,
            text: `Click to reset your password: ${resetUrl}`
        });
    }

    /**
     * Send welcome email
     */
    static async sendWelcomeEmail(
        email: string,
        fullName?: string
    ): Promise<void> {
        const name = fullName || email.split('@')[0];

        const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #28a745;">Welcome to Manifex!</h1>
        </div>
        <div style="color: #333; line-height: 1.6;">
          <p>Hi ${name},</p>
          <p>We're thrilled to have you join the <strong>Manifex</strong> community!</p>
          <p>Your account has been successfully set up. You can now log in and start using all the features we offer.</p>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold;">Quick Tips:</p>
            <ul style="margin: 10px 0;">
              <li>Complete your profile</li>
              <li>Explore the dashboard</li>
              <li>Set up your preferences</li>
            </ul>
          </div>
          <p>If you have any questions, just reply to this email. We're here to help!</p>
          <p>Best regards,<br>The Manifex Team</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #888; text-align: center;">&copy; ${new Date().getFullYear()} Manifex. All rights reserved.</p>
        </div>
      </div>
    `;

        await this.send({
            to: email,
            subject: 'Welcome to Manifex!',
            html,
            text: `Welcome to Manifex, ${name}!`
        });
    }

    /**
     * Send email changed notification
     */
    static async sendEmailChangeNotification(
        email: string,
        fullName?: string
    ): Promise<void> {
        const name = fullName || email.split('@')[0];

        const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #17a2b8;">Email Address Updated</h1>
        </div>
        <div style="color: #333; line-height: 1.6;">
          <p>Hi ${name},</p>
          <p>This is a notification to inform you that your <strong>Manifex</strong> account email address has been successfully changed.</p>
          <p>If you did not make this change, please contact our support team immediately to secure your account.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #888; text-align: center;">&copy; ${new Date().getFullYear()} Manifex. All rights reserved.</p>
        </div>
      </div>
    `;

        await this.send({
            to: email,
            subject: 'Your Manifex email has been changed',
            html,
            text: `Your email has been updated successfully.`
        });
    }

    /**
     * Send password changed notification
     */
    static async sendPasswordChangeNotification(
        email: string,
        fullName?: string
    ): Promise<void> {
        const name = fullName || email.split('@')[0];

        const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #ffc107;">Password Changed</h1>
        </div>
        <div style="color: #333; line-height: 1.6;">
          <p>Hi ${name},</p>
          <p>This is a notification to inform you that the password for your <strong>Manifex</strong> account has been successfully changed.</p>
          <p>If you did not change your password, please use the "Forgot Password" feature on the login page or contact support immediately.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #888; text-align: center;">&copy; ${new Date().getFullYear()} Manifex. All rights reserved.</p>
        </div>
      </div>
    `;

        await this.send({
            to: email,
            subject: 'Your Manifex password has been changed',
            html,
            text: 'Your password has been successfully changed.'
        });
    }
}
