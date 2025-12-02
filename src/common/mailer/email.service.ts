import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  // Inject MailerService instead of creating a transporter manually
  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  async sendPasswordResetEmail(email: string, resetToken: string) {
    const resetUrl = `${this.configService.get('FRONTEND_URL')}/reset-password?token=${resetToken}`;

    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Password Reset Request for Pharmacy',
        template: './password-reset', // Points to password-reset.hbs
        context: {
          // Variables to pass to the template
          appName: 'Pharmacy',
          resetUrl: resetUrl,
          year: new Date().getFullYear(),
        },
      });
      this.logger.log(`Password reset email sent to ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email to ${email}`,
        error,
      );
      throw error;
    }
  }

  async sendWelcomeEmail(email: string, verificationToken: string) {
    const verificationUrl = `${this.configService.get('FRONTEND_URL')}/email-verification?token=${verificationToken}`;

    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Verify Your Email Address for Pharmacy',
        template: './email-verification', // Name of the template file without extension
        context: {
          // Data to be sent to the template
          verificationUrl: verificationUrl,
          year: new Date().getFullYear(),
        },
      });
      this.logger.log(`Verification email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${email}`, error);
      throw error;
    }
  }
}
