import { PushNotificationsService } from '../push-notifications/push-notifications.service';
import { QueryConfig } from '@/common/query-options';
import { DBService } from '@/database/db.service';
import { Notification } from '@/database/entities/notification.entity';
import { LocalizationService } from '@/i18n/localization.service';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FilterOperator } from 'nestjs-paginate';
import { DataSource, Repository } from 'typeorm';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';

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
export class AppNotificationService extends DBService<
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
