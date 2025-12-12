import { QueryConfig, QueryOptions } from '@/common/query-options';
import { DBService } from '@/database/db.service';
import { Order } from '@/database/entities/order.entity';

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
      const savedOrder = await manager.save(Order, {
        user: { id: authUser.id },
        branch: { id: createOrderDto.branch.id },
        type,
        status: OrderStatus.NEW,
        subTotal: 0,
        totalAmount: 0,
        paidAmount: 0,
      });

      // store items as JSON on the order (items: array of item ids)
      if (items && items.length > 0) {
        savedOrder.items = items;
        await manager.save(savedOrder);
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

      // create notification for user
      await this.notificationsService.create(
        {
          title: 'Order placed',
          message: `Your order ${savedOrder.orderNo} was created`,
          recipient: { id: authUser.id },
          type: NotificationType.PENDING_CONFIRMATION,
          relatedEntity: { type: RelatedEntityType.ORDER, id: savedOrder.id },
        } as any,
        { manager },
      );

      // notify provider admins for the branch's provider
      const branchEntity = await this.branchesService.findById(branch.id);
      if (branchEntity?.provider?.id) {
        const employees = await this.employeesService.findProviderEmployees(
          branchEntity.provider.id,
        );
        if (employees && (employees as any).data) {
          for (const emp of (employees as any).data) {
            try {
              const user = await this.usersService.findByEmail(emp.email);
              if (user && user.id) {
                await this.notificationsService.create(
                  {
                    title: `New order at ${branchEntity.localizedName?.en || ''}`,
                    message: `Order ${savedOrder.orderNo} requires your attention`,
                    recipient: { id: user.id },
                    type: NotificationType.PENDING_CONFIRMATION,
                    relatedEntity: {
                      type: RelatedEntityType.ORDER,
                      id: savedOrder.id,
                    },
                  } as any,
                  { manager },
                );
              }
            } catch (e) {
              // ignore missing user mapping
            }
          }
        }
      }
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
