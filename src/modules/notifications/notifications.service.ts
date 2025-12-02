import { PushNotificationsService } from '@/common/pushNotifications.service';
import { QueryConfig } from '@/common/query-options';
import { handleError } from '@/database/db.errors';
import { DBService } from '@/database/db.service';
import { Notification } from '@/database/entities/notification.entity';
import { User } from '@/database/entities/user.entity';
import { LocalizationService } from '@/i18n/localization.service';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { differenceInYears } from 'date-fns';
import { MulticastMessage } from 'firebase-admin/lib/messaging/messaging-api';
import { FilterOperator } from 'nestjs-paginate';
import { DataSource, EntityManager, QueryRunner, Repository } from 'typeorm';
import { AuthUserDto } from '../auth/dto/auth-user.dto';
import { CreateNotificationDto } from './dto/create-notification.dto';
import {
  AppNotificationData,
  NotificationChannel,
  NotificationType,
  RelatedEntityType,
  SystemNotificationType,
} from './dto/notification.enum';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { OrderStatusNotification } from './dto/orderStatus-notification.dto';
import { Order, OrderStatus } from '@/database/entities/order.entity';
import { SystemNotification } from '@/database/entities/system-notification.entity';
import { SystemNotificationsService } from './system-notification.service';
import { OrderAction } from '../orders/dto/order-action.dto';
import { UUIDObject } from '@/common/decorators/isObjId.decorator';

export const NOTIFICAION_PAGINATION_CONFIG: QueryConfig<Notification> = {
  sortableColumns: ['metadata.createdAt'],
  filterableColumns: {
    recipient_id: [FilterOperator.EQ],
    type: [FilterOperator.EQ],
    isRead: [FilterOperator.EQ],
    'metadata.createdAt': [
      FilterOperator.GTE,
      FilterOperator.LTE,
      FilterOperator.EQ,
    ],
  },
  defaultSortBy: [['metadata.createdAt', 'DESC']],
};

@Injectable()
export class NotificationsService extends DBService<
  Notification,
  CreateNotificationDto,
  UpdateNotificationDto
> {
  constructor(
    @InjectRepository(Notification)
    protected repository: Repository<Notification>,
    private dataSource: DataSource,
    private readonly i18n: LocalizationService,
    private readonly systemNotificationsService: SystemNotificationsService,
    private pushNotificationsService: PushNotificationsService,
  ) {
    super(repository, NOTIFICAION_PAGINATION_CONFIG);
  }

  findUnreadNotifications(userId: string) {
    return this.repository.find({
      where: {
        recipient: {
          id: userId,
        },
        isRead: false,
      },
      order: {
        metadata: {
          createdAt: 'DESC',
        },
      },
    });
  }

  async findUnreadCount(user: AuthUserDto) {
    const count = await this.repository.count({
      where: {
        recipient: {
          id: user.id,
        },
        isRead: false,
      },
    });
    return {
      count,
    };
  }

  markAsRead(id: string, user: AuthUserDto) {
    return this.update(
      id,
      {
        isRead: true,
      },
      {
        where: {
          recipient: { id: user.id },
        },
      },
    );
  }

  async notifyUser(
    notificationData: AppNotificationData,
    enablePushNotification = true,
  ) {
    let { recipientId, relatedEntity, manager, type, message, title } =
      notificationData;
    const shouldManageTransaction = !manager;
    let queryRunner: QueryRunner;
    if (shouldManageTransaction) {
      queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
      manager = queryRunner.manager;
    }
    try {
      let recipient = await manager.findOneOrFail(User, {
        where: {
          id: recipientId,
        },
        relations: ['deviceTokens', 'owner', 'owner.deviceTokens'],
      });
      const lang = recipient?.preferences?.language;
      const notification = await manager.save(Notification, {
        recipient,
        type,
        relatedEntity,
        isRead: false,
        title: this.i18n.t(`notifications.${type}.title`, {
          lang,
        }),
        message: message ?? this.i18n.t(`notifications.${type}.body`, { lang }),
      });

      if (shouldManageTransaction) {
        await queryRunner.commitTransaction();
      }
      if (!recipient?.deviceTokens || recipient?.deviceTokens?.length === 0) {
        return notification;
      }
      const tokens = recipient?.deviceTokens?.map(
        (token) => token?.deviceToken,
      );
      if (enablePushNotification) {
        await this.pushNotificationsService.sendPushNotification(
          tokens,
          notification.title,
          this.i18n.t(`notifications.${type}.body`, { lang }),
          {
            type: notification.type,
            notificationId: notification?.id,
            relatedEntity,
          },
        );
      }
      return notification;
    } catch (error) {
      if (shouldManageTransaction) {
        await queryRunner.rollbackTransaction();
      }
      handleError(error);
    } finally {
      if (shouldManageTransaction) {
        await queryRunner.release();
      }
    }
  }

  async sendSystemNotification({
    manager,
    order,
    type,
    channel,
    message,
  }: {
    manager: EntityManager;
    order?: Order;
    type: SystemNotificationType;
    channel: NotificationChannel;
    message?: string;
  }) {
    const notification: SystemNotification = {
      title: this.i18n.t(`notifications.${type}.title`),
      message: message ?? this.i18n.t(`notifications.${type}.body`),
      isRead: false,
      type,
      order,
      channel,
    };
    if (channel === NotificationChannel.PROVIDER_PORTAL && order) {
      notification.branch = order.branch;
    }
    return await this.systemNotificationsService.send(manager, notification);
  }

  // async sendOrderStatusNotification({
  //   order,
  //   queryRunner,
  //   action,
  //   reason,
  // }: OrderStatusNotification) {
  //   const shouldManageTransaction = !queryRunner;
  //   if (shouldManageTransaction) {
  //     queryRunner = this.dataSource.createQueryRunner();
  //     await queryRunner.connect();
  //     await queryRunner.startTransaction();
  //   }
  //   const manager = queryRunner.manager;
  //   try {
  //     if (order.status === OrderStatus.PENDING_VERIFICATION) {
  //       await this.sendSystemNotification({
  //         manager,
  //         order,
  //         type: SystemNotificationType.PENDING_VERIFICATION,
  //         channel: NotificationChannel.PROVIDER_PORTAL,
  //       });
  //       await this.notifyUser({
  //         recipientId: order.user.id,
  //         relatedEntity: {
  //           id: order.id,
  //           orderNo: order.orderNo,
  //           type: RelatedEntityType.ORDER,
  //         },
  //         type: NotificationType.PENDING_VERIFICATION,
  //         manager,
  //         title: 'your order pending verification',
  //       });
  //     } else if (order.status === OrderStatus.PENDING_CONFIRMATION) {
  //       await this.sendSystemNotification({
  //         manager,
  //         order,
  //         type: SystemNotificationType.PENDING_CONFIRMATION,
  //         channel: NotificationChannel.PROVIDER_PORTAL,
  //       });
  //       await this.notifyUser({
  //         recipientId: order.user.id,
  //         relatedEntity: {
  //           id: order.id,
  //           orderNo: order.orderNo,
  //           type: RelatedEntityType.ORDER,
  //         },
  //         type: NotificationType.PENDING_CONFIRMATION,
  //         manager,
  //         title: 'your order pending confirmation',
  //       });
  //     } else if (order.status === OrderStatus.PENDING_APPROVAL) {
  //       await this.notifyUser({
  //         recipientId: order.user.id,
  //         relatedEntity: {
  //           id: order.id,
  //           orderNo: order.orderNo,
  //           type: RelatedEntityType.ORDER,
  //         },
  //         type: NotificationType.PENDING_APPROVAL,
  //         manager,
  //       });
  //       if (order?.user?.customer) {
  //         await this.sendSystemNotification({
  //           manager,
  //           order,
  //           type: SystemNotificationType.PENDING_APPROVAL,
  //           channel: NotificationChannel.CUSTOMER_PORTAL,
  //           message: `pending approval order for user : ${order?.user?.firstName}`,
  //         });
  //       }
  //       await this.sendSystemNotification({
  //         manager,
  //         order,
  //         type: SystemNotificationType.PENDING_APPROVAL,
  //         channel: NotificationChannel.PROVIDER_PORTAL,
  //       });
  //     } else if (order.status === OrderStatus.REJECTED) {
  //       await this.notifyUser({
  //         recipientId: order.user.id,
  //         relatedEntity: {
  //           id: order.id,
  //           orderNo: order.orderNo,
  //           type: RelatedEntityType.ORDER,
  //         },
  //         type: NotificationType.ORDER_REJECTED,
  //         manager,
  //         message: reason,
  //       });
  //       await this.sendSystemNotification({
  //         manager,
  //         order,
  //         type: SystemNotificationType.ORDER_REJECTED,
  //         channel: NotificationChannel.PROVIDER_PORTAL,
  //         message: reason,
  //       });
  //       if (order?.user?.customer) {
  //         await this.sendSystemNotification({
  //           manager,
  //           order,
  //           type: SystemNotificationType.ORDER_REJECTED,
  //           channel: NotificationChannel.CUSTOMER_PORTAL,
  //           customer: order?.user?.customer,
  //           message: `order rejected for user : ${order?.user?.firstName} contact admin for details`,
  //         });
  //       }
  //     } else if (order.status === OrderStatus.CANCELED) {
  //       await this.notifyUser({
  //         recipientId: order.user.id,
  //         relatedEntity: {
  //           id: order.id,
  //           orderNo: order.orderNo,
  //           type: RelatedEntityType.ORDER,
  //         },
  //         type: NotificationType.ORDER_CANCELED,
  //         manager,
  //         title: 'Order Canceled',
  //         message: reason,
  //       });
  //       await this.sendSystemNotification({
  //         manager,
  //         order,
  //         type: SystemNotificationType.ORDER_CANCELED,
  //         channel: NotificationChannel.PROVIDER_PORTAL,
  //         message: reason,
  //       });
  //     } else if (
  //       order.status === OrderStatus.PENDING_PAYMENT &&
  //       action === OrderAction.REOPEN_CANCELED
  //     ) {
  //       await this.notifyUser({
  //         recipientId: order.user.id,
  //         relatedEntity: {
  //           id: order.id,
  //           orderNo: order.orderNo,
  //           type: RelatedEntityType.ORDER,
  //         },
  //         type: NotificationType.PENDING_PAYMENT,
  //         manager,
  //         title: 'Order Reopened',
  //         message: 'Your order is reOpened',
  //       });
  //       await this.sendSystemNotification({
  //         manager,
  //         order,
  //         type: SystemNotificationType.ORDER_REOPENED,
  //         channel: NotificationChannel.PROVIDER_PORTAL,
  //       });
  //     } else if (
  //       order.status === OrderStatus.PENDING_PAYMENT &&
  //       action === OrderAction.APPROVE
  //     ) {
  //       await this.notifyUser({
  //         recipientId: order.user.id,
  //         relatedEntity: {
  //           id: order.id,
  //           orderNo: order.orderNo,
  //           type: RelatedEntityType.ORDER,
  //         },
  //         type: NotificationType.ORDER_APPROVED,
  //         manager,
  //       });
  //       await this.sendSystemNotification({
  //         manager,
  //         order,
  //         type: SystemNotificationType.ORDER_APPROVED,
  //         channel: NotificationChannel.PROVIDER_PORTAL,
  //       });
  //       if (order?.user?.customer) {
  //         await this.sendSystemNotification({
  //           manager,
  //           order,
  //           type: SystemNotificationType.ORDER_APPROVED,
  //           channel: NotificationChannel.CUSTOMER_PORTAL,
  //           customer: order?.user?.customer,
  //           message: `order approved for user : ${order?.user?.firstName} and awaiting for Payment`,
  //         });
  //       }
  //     } else if (order.status === OrderStatus.PENDING_PAYMENT && !action) {
  //       await this.sendSystemNotification({
  //         manager,
  //         order,
  //         type: SystemNotificationType.PENDING_PAYMENT,
  //         channel: NotificationChannel.CUSTOMER_PORTAL,
  //         customer: order?.user?.customer,
  //         message: `new order placed for user${order?.user?.firstName}`,
  //       });
  //       await this.notifyUser({
  //         recipientId: order.user.id,
  //         relatedEntity: {
  //           id: order.id,
  //           orderNo: order.orderNo,
  //           type: RelatedEntityType.ORDER,
  //         },
  //         type: NotificationType.PENDING_PAYMENT,
  //         manager,
  //         title: `order status ${order.status}`,
  //       });
  //     } else if (order.status === OrderStatus.CONFIRMED) {
  //       await this.notifyUser({
  //         recipientId: order.user.id,
  //         relatedEntity: {
  //           id: order.id,
  //           orderNo: order.orderNo,
  //           type: RelatedEntityType.ORDER,
  //         },
  //         type: NotificationType.ORDER_CONFIRMED,
  //         manager,
  //         title: `order status ${order.status}`,
  //       });
  //     }
  //     if (shouldManageTransaction) {
  //       await queryRunner.commitTransaction();
  //     }
  //   } catch (error) {
  //     if (shouldManageTransaction) {
  //       await queryRunner.rollbackTransaction();
  //     }
  //     handleError(error);
  //   } finally {
  //     if (shouldManageTransaction) {
  //       await queryRunner.release();
  //     }
  //   }
  // }
}
