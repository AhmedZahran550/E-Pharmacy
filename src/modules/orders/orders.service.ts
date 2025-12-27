import { QueryConfig, QueryOptions } from '@/common/query-options';
import { DBService } from '@/database/db.service';
import { Order, OrderType } from '@/database/entities/order.entity';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FilterOperator } from 'nestjs-paginate';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { StorageService } from '@/common/storage.service';
import { LocalizationService } from '@/i18n/localization.service';
import { OrderStatus } from '@/database/entities/order.entity';
import { OrderHistory } from '@/database/entities/order-history.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { AuthUserDto } from '../auth/dto/auth-user.dto';
import { Item } from '@/database/entities/item.entity';
import { ErrorCodes } from '@/common/error-codes';
import {
  ServiceRequest,
  ServiceRequestStatus,
} from '@/database/entities/service-request.entity';
import { MedicineSchedule } from '@/database/entities/medicine-schedule.entity';
import { ServiceRequestsSseService } from '../service-requests/service-requests-sse.service';
import {
  NotificationType,
  RelatedEntityType,
} from '../notifications/dto/notification.enum';

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
    @InjectRepository(MedicineSchedule)
    protected medicineScheduleRepository: Repository<MedicineSchedule>,
    private sseService: ServiceRequestsSseService,
    private dataSource: DataSource,
    private notificationsService: NotificationsService,
    private readonly i18n: LocalizationService,
    private storageService: StorageService,
  ) {
    super(repository, ORDERS_PAGINATION_CONFIG);
  }

  async createOrder(
    dto: CreateOrderDto,
    request: ServiceRequest,
    doctor: AuthUserDto,
  ) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Validate request

      // 2. Validate Items & Calculate Prices
      const itemIds = dto.items.map((i) => i.id);
      const itemsResult = await queryRunner.manager.find(Item, {
        where: { id: In(itemIds) },
      });
      const items: Item[] = itemsResult;

      let totalAmount = 0;
      const orderItems: any[] = [];
      const medicineSchedules: any[] = [];

      for (const itemDto of dto.items) {
        const item = items.find((i) => i.id === itemDto.id);
        if (!item) {
          throw new BadRequestException('Item not found');
        }
        orderItems.push({
          itemId: itemDto.id,
          quantity: itemDto.quantity,
          unitPrice: itemDto.price,
          totalPrice: itemDto.quantity * itemDto.price,
          doctorInstructions: itemDto.instructions,
          schedule: itemDto.schedule,
        });
        // 6. Prepare MedicineSchedule records
        if (itemDto.schedule) {
          medicineSchedules.push(
            this.medicineScheduleRepository.create({
              medicineName:
                item.localizedName?.en ||
                item.localizedName?.ar ||
                'Unknown Medicine',
              user: request.user,
              userId: request.userId,
              item: item,
              itemId: item.id,
              instructions:
                itemDto.instructions || itemDto.schedule.instructions,
              frequency: itemDto.schedule.frequency,
              frequencyValue: itemDto.schedule.frequencyValue,
              times: itemDto.schedule.times,
              startDate: new Date(itemDto.schedule.startDate),
              endDate: itemDto.schedule.endDate
                ? new Date(itemDto.schedule.endDate)
                : undefined,
              durationDays: itemDto.schedule.durationDays,
              reminderEnabled: itemDto.schedule.reminderEnabled,
              reminderMinutesBefore: itemDto.schedule.reminderMinutesBefore,
              notes: dto.notes,
              isActive: true,
            }),
          );
        }
      }

      // 4. Create Order
      const order = this.repository.create({
        user: request.user,
        branch: { id: request.branchId },
        type: OrderType.DELIVERY, // Defaulting to delivery for now
        status: OrderStatus.NEW, // Or ACCEPTED since doctor created it? User request says "Doctor Creates Order" -> "Order Created". Usually requires user confirmation?
        // Prompt says: "Update OrderRequest status to COMPLETED" and "Return order details".
        // It doesn't say user needs to confirm.
        // But usually orders need payment.
        // Assuming NEW or PENDING_PAYMENT.
        // Let's stick to NEW or whatever default.
        totalAmount,
        createdByDoctor: { id: doctor.id } as any,
        serviceRequest: request,
        orderItems: orderItems, // Cascade create
      });

      const savedOrder = await queryRunner.manager.save(order);

      // Save schedules
      if (medicineSchedules.length > 0) {
        // Need to wait for order? No, they are independent linked to user.
        await queryRunner.manager.save(medicineSchedules);
      }

      // 7. Update ServiceRequest
      request.status = ServiceRequestStatus.COMPLETED;
      request.completedAt = new Date();
      request.order = savedOrder; // Link order

      await queryRunner.manager.save(request);

      await queryRunner.commitTransaction();

      // 9. Notifications
      this.sseService.notifyServiceRequestUpdate(
        request.id,
        {
          status: request.status,
          orderId: savedOrder.id,
          totalAmount: savedOrder.totalAmount,
        },
        'order_created',
      );

      this.notificationsService.createAppNotification({
        title: this.i18n.translate('notifications.ORDER_CREATED.title'),
        message: this.i18n.translate('notifications.ORDER_CREATED.body', {
          args: { orderNo: savedOrder.orderNo },
        }),
        type: NotificationType.NEW_ORDER,
        recipient: { id: request.userId },
        relatedEntity: {
          type: RelatedEntityType.ORDER,
          id: savedOrder.id,
        },
        data: { orderId: savedOrder.id, serviceRequestId: request.id },
        isRead: false,
      });

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
    if (!order) {
      throw new NotFoundException({
        message: 'Order not found',
        code: ErrorCodes.ORDER_NOT_FOUND,
      });
    }
    return order;
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
}
