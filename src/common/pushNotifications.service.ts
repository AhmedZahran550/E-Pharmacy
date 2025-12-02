import { Injectable, Inject, Logger } from '@nestjs/common';
import Expo, { ExpoPushSuccessTicket, ExpoPushTicket } from 'expo-server-sdk';

@Injectable()
export class PushNotificationsService {
  private readonly logger = new Logger(PushNotificationsService.name);
  private expo: Expo;
  constructor() {
    this.expo = new Expo();
  }

  async sendPushNotification(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, unknown>,
  ): Promise<void> {
    const validTokens = tokens.filter((token) => Expo.isExpoPushToken(token));

    if (validTokens.length === 0) {
      this.logger.warn('No valid Expo push tokens found');
      return;
    }

    const messages = validTokens.map((token) => ({
      to: token,
      sound: 'default',
      title,
      body,
      data,
    }));

    const chunks = this.expo.chunkPushNotifications(messages);

    for (const chunk of chunks) {
      try {
        const receipts = await this.expo.sendPushNotificationsAsync(chunk);
        this.handleReceipts(receipts);
      } catch (error) {
        this.logger.error('Error sending Expo push notifications', error.stack);
        throw error;
      }
    }
  }

  private async handleReceipts(receipts: ExpoPushTicket[]): Promise<void> {
    const receiptIds = receipts
      .filter(
        (ticket): ticket is ExpoPushSuccessTicket =>
          ticket.status === 'ok' && 'id' in ticket,
      )
      .map((ticket) => ticket.id);

    if (receiptIds.length === 0) return;

    try {
      const receiptResults =
        await this.expo.getPushNotificationReceiptsAsync(receiptIds);

      for (const [receiptId, receipt] of Object.entries(receiptResults)) {
        if (receipt?.status === 'error') {
          this.logger.error(
            `Error for receipt ID ${receiptId}:`,
            receipt.message,
          );

          if (receipt.details?.error === 'DeviceNotRegistered') {
            const token = receipt.details.expoPushToken;
            // Emit event or handle token invalidation here
          }
        }
      }
    } catch (error) {
      this.logger.error('Error handling receipts', error.stack);
    }
  }
}
