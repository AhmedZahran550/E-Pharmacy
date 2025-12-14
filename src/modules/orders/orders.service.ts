import { QueryConfig, QueryOptions } from '@/common/query-options';
import { DBService } from '@/database/db.service';
import { Order } from '@/database/entities/order.entity';
import { OrderItem } from '@/database/entities/order-item.entity';

import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FilterOperator } from 'nestjs-paginate';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
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
  ChangeType,
} from '@/database/entities/order-history.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateOrderDto, CreateOrderItemDto } from './dto/create-order.dto';
import { SystemNotificationsService } from '../notifications/system-notification.service';
import {
  SystemNotificationType,
  NotificationPriority,
} from '@/modules/notifications/dto/notification.enum';
import { NotificationChannel } from '@/database/entities/system-notification.entity';
import { AuthUserDto } from '../auth/dto/auth-user.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Item } from '@/database/entities/item.entity';

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
  ) {
    super(repository, ORDERS_PAGINATION_CONFIG);
  }

  async createOrder(createOrderDto: CreateOrderDto, authUser: AuthUserDto) {
    const queryRunner = await this.startTransaction(this.dataSource);
    const manager = queryRunner.manager;
    try {
      const { items, type, branch } = createOrderDto;

      let orderItemsEntities: OrderItem[] = [];
      const orderInstance = manager.create(Order, {
        user: { id: authUser.id },
        branch: { id: branch.id },
        type,
        status: OrderStatus.NEW,
      });
      const savedOrder = await manager.save(orderInstance);
      // Create OrderItem entities first to calculate totals
      if (items && items?.length > 0) {
        orderItemsEntities = await this.createOrderItems(
          savedOrder,
          manager,
          items,
        );
      }
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
        actorName: authUser.firstName + ' ' + authUser.lastName,
        changeType: ChangeType.CREATED,
        previous: null,
        current: {
          status: savedOrder.status,
          imageUrl: savedOrder.imageUrl,
        },
      });

      await queryRunner.commitTransaction();
      return savedOrder;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async updateOrderImage(
    orderId: string,
    image: Express.Multer.File,
    user: AuthUserDto,
  ) {
    const order = await this.findOneOrFail({
      where: { id: orderId, user: { id: user.id } },
    });
    const imageUrl = await this.storageService.saveFile(
      image,
      `${order.id}`,
      'orders',
    );
    order.imageUrl = imageUrl.url;
    await this.repository.save(order);
    return order;
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

  async updateOrder(
    orderId: string,
    updateOrderDto: UpdateOrderDto,
    userId: string,
  ) {
    const queryRunner = await this.startTransaction(this.dataSource);
    const manager = queryRunner.manager;
    try {
      const order = await this.repository.findOne({
        where: { id: orderId, user: { id: userId } } as any,
      });
      if (!order) throw new NotFoundException('Order not found');
      const updatedOrder = this.repository.merge(order, updateOrderDto);
      const saved = await this.repository.save(updatedOrder);
      if (updateOrderDto?.items?.length > 0) {
        await this.createOrderItems(saved, manager, updateOrderDto.items);
      }
      // record history for status change
      try {
        await this.dataSource.getRepository(OrderHistory).save({
          order: { id: order.id } as any,
          actorType: ActorType.USER,
          actorId: userId,
          actorName: order.user.firstName + ' ' + order.user.lastName,
          changeType: ChangeType.UPDATED,
          previous: { status: order.status },
          current: { status: updateOrderDto.status },
        } as any);
      } catch (e) {
        // ignore history save errors to not block main flow
      }
      await queryRunner.commitTransaction();
      return saved;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
  async findOrderHistory(orderId: string, userId: string) {
    const qb = this.dataSource
      .getRepository(OrderHistory)
      .createQueryBuilder('orderHistory')
      .leftJoin('orderHistory.order', 'order')
      .where('order.id = :orderId', { orderId })
      .andWhere('order.user_id = :userId', { userId })
      .orderBy('orderHistory.metadata.createdAt', 'DESC');
    return qb.getMany();
  }

  private async createOrderItems(
    order: Order,
    manager: EntityManager,
    items: CreateOrderItemDto[],
  ) {
    const existingItems = await manager.find(Item, {
      where: { id: In(items.map((item) => item.id)) } as any,
    });
    if (existingItems.length !== items.length) {
      throw new NotFoundException({
        message: 'Some items not found',
        code: 'ITEM_NOT_FOUND',
      });
    }
    await manager.delete(OrderItem, { order: { id: order.id } });
    const orderItemsEntities: OrderItem[] = [];
    for (const itemDto of items) {
      const orderItem = new OrderItem();
      orderItem.item = { id: itemDto.id } as any;
      orderItem.quantity = itemDto.quantity;
      orderItem.order = order;
      orderItemsEntities.push(orderItem);
    }
    return await manager.save(orderItemsEntities);
  }
}
