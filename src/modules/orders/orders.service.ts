import { QueryConfig } from '@/common/query-options';
import { DBService } from '@/database/db.service';
import { Order } from '@/database/entities/order.entity';

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FilterOperator } from 'nestjs-paginate';
import { DataSource, Repository } from 'typeorm';
import { LocalizationService } from '@/i18n/localization.service';
import { NotificationsService } from '../notifications/notifications.service';

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
