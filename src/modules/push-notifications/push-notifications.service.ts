import { Injectable, Logger } from '@nestjs/common';
import { FirebaseService } from './firebase.service';
import * as admin from 'firebase-admin';

@Injectable()
export class PushNotificationsService {
  private readonly logger = new Logger(PushNotificationsService.name);

  constructor(private firebaseService: FirebaseService) {}

  async sendPushNotification(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, unknown>,
  ): Promise<void> {
    if (!tokens || tokens.length === 0) {
      this.logger.warn('No push tokens provided');
      return;
    }

    // Filter out invalid tokens (basic validation)
    const validTokens = tokens.filter((token) => this.isValidFCMToken(token));

    if (validTokens.length === 0) {
      this.logger.warn('No valid FCM push tokens found');
      return;
    }

    const messaging = this.firebaseService.getMessaging();

    // Check if Firebase is initialized
    if (!messaging) {
      this.logger.warn(
        'Firebase is not initialized. Skipping push notification.',
      );
      return;
    }

    // Prepare the message
    const message: admin.messaging.MulticastMessage = {
      tokens: validTokens,
      notification: {
        title,
        body,
      },
      data: data ? this.sanitizeData(data) : undefined,
      android: {
        priority: 'high',
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
          },
        },
      },
    };

    try {
      const response = await messaging.sendEachForMulticast(message);

      this.logger.log(
        `Successfully sent ${response.successCount} out of ${validTokens.length} notifications`,
      );

      if (response.failureCount > 0) {
        this.handleFailures(response.responses, validTokens);
      }
    } catch (error) {
      this.logger.error('Error sending FCM push notifications', error.stack);
      throw error;
    }
  }

  private isValidFCMToken(token: string): boolean {
    // Basic FCM token validation (non-empty string)
    return typeof token === 'string' && token.trim().length > 0;
  }

  private sanitizeData(data: Record<string, unknown>): Record<string, string> {
    // FCM requires all data values to be strings
    const sanitized: Record<string, string> = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] =
        typeof value === 'string' ? value : JSON.stringify(value);
    }
    return sanitized;
  }

  private handleFailures(
    responses: admin.messaging.SendResponse[],
    tokens: string[],
  ): void {
    responses.forEach((response, index) => {
      if (!response.success) {
        const token = tokens[index];
        const error = response.error;

        this.logger.error(
          `Failed to send notification to token ${token.substring(0, 10)}...`,
          error?.message,
        );

        // Handle specific FCM error codes
        if (
          error?.code === 'messaging/invalid-registration-token' ||
          error?.code === 'messaging/registration-token-not-registered'
        ) {
          this.logger.warn(
            `Token ${token.substring(0, 10)}... is invalid or not registered. Consider removing it from the database.`,
          );
          // TODO: Emit event or handle token invalidation here
        }
      }
    });
  }
}
