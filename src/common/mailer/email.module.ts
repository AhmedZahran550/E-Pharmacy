import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { EmailService } from './email.service';

@Module({
  imports: [
    MailerModule.forRootAsync({
      // Import ConfigService to use .env variables
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        // Transport configuration (your existing SMTP settings)
        transport: {
          host: config.get('SMTP_HOST'),
          port: config.get('SMTP_PORT'),
          secure: true, // or false depending on your port
          auth: {
            user: config.get('SMTP_USER'),
            pass: config.get('SMTP_PASS'),
          },
        },
        // Default mail options
        defaults: {
          from: `"Pharmacy" <${config.get('SMTP_FROM')}>`,
        },
        // Template engine configuration
        template: {
          dir: join(__dirname, '../..', 'templates'), // Path to your templates folder
          adapter: new HandlebarsAdapter(), // Use Handlebars
          options: {
            strict: true,
          },
        },
      }),
    }),
  ],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
