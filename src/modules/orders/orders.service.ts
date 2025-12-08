import { QueryConfig, QueryOptions } from '@/common/query-options';
import { DBService } from '@/database/db.service';
import { OrderOtp } from '@/database/entities/order-otp.entity';
import { Order, OrderStatus } from '@/database/entities/order.entity';

import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { addMinutes, differenceInYears } from 'date-fns';
import { FilterOperator, FilterSuffix } from 'nestjs-paginate';
import {
  DataSource,
  EntityManager,
  In,
  QueryRunner,
  Repository,
} from 'typeorm';
import { Decimal } from 'decimal.js';
import {
  NotificationChannel,
  NotificationType,
  RelatedEntityType,
  SystemNotificationType,
} from '../notifications/dto/notification.enum';
import { ErrorCodes } from '@/common/error-codes';
import { LocalizationService } from '@/i18n/localization.service';
import { NotificationsService } from '../notifications/notifications.service';
import { handleError } from '@/database/db.errors';
import { AuthUserDto } from '../auth/dto/auth-user.dto';
import { OrderAction } from './dto/order-action.dto';

const ORDERS_PAGINATION_CONFIG: QueryConfig<Order> = {
  sortableColumns: ['metadata.createdAt'],
  filterableColumns: {
    'branch.id': [FilterOperator.EQ],
    'branch.provider.id': [FilterOperator.EQ],
    'user.id': [FilterOperator.EQ],
    'user.familyId': [FilterOperator.EQ],
    'user.customer.id': [FilterOperator.EQ],
    user_id: [FilterOperator.EQ],
    status: [FilterOperator.EQ, FilterOperator.IN],
    isOpen: [FilterOperator.EQ],
    orderNo: [FilterOperator.EQ, FilterOperator.CONTAINS],
    'metadata.createdAt': [
      FilterOperator.GTE,
      FilterOperator.LTE,
      FilterOperator.EQ,
      FilterOperator.BTW,
    ],
  },
  searchableColumns: ['orderNo', 'user.mobile'],
  relations: ['user'],
  defaultSortBy: [['metadata.createdAt', 'DESC']],
};

@Injectable()
export class OrdersService extends DBService<Order> {
  constructor(
    @InjectRepository(Order)
    protected repository: Repository<Order>,
    private dataSource: DataSource,
    private notificationsService: NotificationsService,
    private readonly i18n: LocalizationService,
  ) {
    super(repository, ORDERS_PAGINATION_CONFIG);
  }
}
