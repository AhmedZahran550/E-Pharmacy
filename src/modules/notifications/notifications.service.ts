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
    private pushNotificationsService: PushNotificationsService,
  ) {
    super(repository, NOTIFICAION_PAGINATION_CONFIG);
  }
}
