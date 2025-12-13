import { QueryConfig, QueryOptions } from '@/common/query-options';
import { DBService } from '@/database/db.service';
import { Order } from '@/database/entities/order.entity';
import { OrderItem } from '@/database/entities/order-item.entity';

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FilterOperator } from 'nestjs-paginate';
import { DataSource, Repository } from 'typeorm';
import { StorageService } from '@/common/storage.service';
import { EmployeesService } from '../employees/employees.service';
import { UsersService } from '../users/users.service';
import { BranchesService } from '../branches/branches.service';
import {
  NotificationType,
  RelatedEntityType,
} from '@/modules/notifications/dto/notification.enum';
import { LocalizationService } from '@/i18n/localization.service';
import { OrderStatus } from '@/database/entities/order.entity';
import {
  OrderHistory,
  ActorType,
} from '@/database/entities/order-history.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { SystemNotificationsService } from '../notifications/system-notification.service';
import {
  SystemNotificationType,
  NotificationPriority,
} from '@/modules/notifications/dto/notification.enum';
import { NotificationChannel } from '@/database/entities/system-notification.entity';

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
    private storageService: StorageService,
    private employeesService: EmployeesService,
    private usersService: UsersService,
    private branchesService: BranchesService,
  ) {
    super(repository, ORDERS_PAGINATION_CONFIG);
  }

  async createOrder(
    createOrderDto: CreateOrderDto,
    image: Express.Multer.File,
    authUser: any,
  ) {
    const queryRunner = await this.startTransaction(this.dataSource);
    const manager = queryRunner.manager;
    try {
      const { items, branch, type } = createOrderDto;

      let subTotal = items.reduce(
        (total, item) => total + item.quantity * item.unitPrice,
        0,
      );
      const orderItemsEntities: OrderItem[] = [];
      const savedOrder = await manager.save(Order, {
        user: { id: authUser.id },
        branch: { id: createOrderDto.branch.id },
        type,
        status: OrderStatus.NEW,
        subTotal: subTotal ?? 0,
        totalAmount: subTotal ?? 0,
      });
      // Create OrderItem entities first to calculate totals
      if (items && items.length > 0) {
        for (const itemDto of items) {
          const orderItem = new OrderItem();
          orderItem.item = { id: itemDto.id } as any;
          orderItem.quantity = itemDto.quantity;
          orderItem.unitPrice = itemDto.unitPrice;
          orderItem.totalPrice = itemDto.quantity * itemDto.unitPrice;
          orderItem.order = savedOrder;
          orderItemsEntities.push(orderItem);
        }
        await manager.save(OrderItem, orderItemsEntities);
      }
      // save order image if provided
      if (image) {
        const filePath = `orders/${savedOrder.id}`;
        const obj = await this.storageService.saveFile(
          image,
          filePath,
          'orders',
        );
        savedOrder.imageUrl = obj.url;
        await manager.save(savedOrder);
      }

      // notify provider/branch via system notification
      const branchEntity = await this.branchesService.findById(branch.id);

      await this.notificationsService.createSystemNotification(
        {
          title: this.i18n.translate('notifications.NEW_ORDER.title'),
          message: this.i18n.translate('notifications.NEW_ORDER.body', {
            args: {
              orderNo: savedOrder.orderNo,
            },
          }),
          type: SystemNotificationType.NEW_ORDER,
          priority: NotificationPriority.HIGH,
          channel: NotificationChannel.PROVIDER_PORTAL,
          branch: { id: branch.id },
          provider: branchEntity?.provider
            ? { id: branchEntity.provider.id }
            : null,
          relatedEntityType: RelatedEntityType.ORDER,
          relatedEntityId: savedOrder.id,
          isRead: false,
        } as any,
        { manager },
      );
      // add order history entry (CREATED)
      await manager.save(OrderHistory, {
        order: { id: savedOrder.id } as any,
        actorType: ActorType.USER,
        actorId: authUser.id,
        actorName: (authUser?.fullName || authUser?.username) as any,
        changeType: 'CREATED',
        previous: null,
        current: {
          status: savedOrder.status,
          items: savedOrder.items,
          imageUrl: savedOrder.imageUrl,
        },
      } as any);

      await queryRunner.commitTransaction();
      return savedOrder;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findUserOrders(userId: string, query?: QueryOptions) {
    const qb = this.repository
      .createQueryBuilder('order')
      .where('order.user_id = :userId', { userId });
    return this.findAll(query, qb as any);
  }

  async findOrderDetails(orderId: string, userId: string) {
    const qb = this.repository
      .createQueryBuilder('order')
      .where('order.id = :orderId', { orderId })
      .andWhere('order.user_id = :userId', { userId });
    const order = await qb.getOne();
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async updateStatus(orderId: string, status: string, userId: string) {
    const order = await this.repository.findOne({
      where: { id: orderId, user: { id: userId } } as any,
    });
    if (!order) throw new NotFoundException('Order not found');
    const previousStatus = order.status;
    order.status = status as any;
    const saved = await this.repository.save(order);

    // record history for status change
    try {
      await this.dataSource.getRepository(OrderHistory).save({
        order: { id: order.id } as any,
        actorType: ActorType.USER,
        actorId: userId,
        changeType: 'STATUS_UPDATED',
        previous: { status: previousStatus },
        current: { status },
      } as any);
    } catch (e) {
      // ignore history save errors to not block main flow
    }

    return saved;
  }
}
