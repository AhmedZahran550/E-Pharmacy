import { QueryConfig, QueryOptions } from '@/common/query-options';
import { DBService } from '@/database/db.service';
import { OrderOtp } from '@/database/entities/order-otp.entity';
import { Order, OrderStatus } from '@/database/entities/order.entity';
import { TransactionStatus } from '@/database/entities/transaction.entity';
import { OrderOtpService } from '@/modules/orders/order-otp.service';
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
import { OrderHistoryService } from './order-history.service';
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
    private orderOtpService: OrderOtpService,
    private notificationsService: NotificationsService,
    private readonly i18n: LocalizationService,
    private orderHistoryService: OrderHistoryService,
  ) {
    super(repository, ORDERS_PAGINATION_CONFIG);
  }

  findByUser(query: QueryOptions, user: AuthUserDto) {
    const qb = this.repository
      .createQueryBuilder('order')
      .innerJoinAndSelect('order.branch', 'branch')
      .innerJoinAndSelect('branch.provider', 'provider')
      .innerJoinAndSelect('order.orderItems', 'orderItem')
      .innerJoinAndSelect('order.user', 'user')
      .addSelect('order.isOpen')
      .addSelect('order.remainingAmount');
    if (user.familyId && query?.filter?.['user.familyId']) {
      qb.where('user.familyId = :familyId AND user.id != :userId', {
        familyId: user.familyId,
        userId: user.id,
      });
    } else {
      qb.where('user.id = :userId', { userId: user.id });
    }
    return this.findAll(query, qb);
  }

  private buildOrderQuery(id: string) {
    const qb = this.repository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.orderItems', 'orderItem')
      .innerJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('order.branch', 'branch')
      .leftJoinAndSelect('branch.provider', 'provider')
      .leftJoinAndSelect('order.payments', 'payments')
      .leftJoinAndSelect('orderItem.item', 'item')
      .leftJoinAndSelect('order.orderOtps', 'orderOtp')
      .where('order.id = :id', { id })
      .addSelect('order.isOpen');
    return qb;
  }

  async findOrderWithOtp(id: string, user?: AuthUserDto) {
    const qb = this.buildOrderQuery(id)
      .addSelect('orderOtp.otp')
      .leftJoinAndSelect('order.branchRatings', 'branchRating');
    if (user && user?.isFamilyManager) {
      qb.andWhere('user.familyId = :familyId', {
        familyId: user.familyId,
      });
    } else if (user) {
      qb.andWhere('user.id = :userId', { userId: user.id });
    }

    const order = await qb.getOneOrFail();
    return order;
  }

  async findOrder(id: string) {
    const order = await this.buildOrderQuery(id)
      .leftJoinAndSelect('order.transactions', 'transactions')
      .getOneOrFail();
    return order;
  }

  private generateOTP(): string {
    // return Math.floor(100000 + Math.random() * 900000).toString();
    return String(999999);
  }

  async generateOrderOTP(
    orderId: string,
    manager: EntityManager,
  ): Promise<{ otp: string; expiresAt: Date }> {
    const order = await this.findOrder(orderId);
    const otp = this.generateOTP();
    const expiresAt = addMinutes(new Date(), 10);
    const otpRecord = manager.save(OrderOtp, {
      order,
      otp,
      expiresAt,
      isVerified: false,
    });
    return { otp, expiresAt };
  }

  async isOrderOtpVerified(order: Order): Promise<boolean> {
    return this.orderOtpService.isOrderOtpVerified(order);
  }

  async findByProvider(providerId: string, query: QueryOptions) {
    const qb = this.repository
      .createQueryBuilder('order')
      .innerJoinAndSelect('order.branch', 'branch')
      .innerJoinAndSelect('order.user', 'user')
      .innerJoin('branch.provider', 'provider')
      .where('provider.id = :providerId', { providerId })
      .addSelect('order.isOpen')
      .addSelect('order.remainingAmount');
    return this.findAll(query, qb);
  }

  async findByBranch(branchId: string, query: QueryOptions) {
    const qb = this.repository
      .createQueryBuilder('order')
      .innerJoinAndSelect('order.orderItems', 'orderItem')
      .innerJoinAndSelect('orderItem.item', 'item')
      .innerJoinAndSelect('order.user', 'user')
      .innerJoin('order.branch', 'branch')
      .where('branch.id = :branchId', { branchId })
      .addSelect('order.isOpen')
      .addSelect('order.remainingAmount');
    return this.findAll(query, qb);
  }
  async findByCustomer(customerId: string, query: QueryOptions) {
    const qb = this.repository
      .createQueryBuilder('order')
      .innerJoinAndSelect('order.orderItems', 'orderItem')
      .innerJoinAndSelect('orderItem.item', 'item')
      .innerJoinAndSelect('order.user', 'user')
      .innerJoin('order.branch', 'branch')
      .where('user.customer_id = :customerId', { customerId })
      .addSelect('order.isOpen')
      .addSelect('order.remainingAmount');
    return this.findAll(query, qb);
  }

  async markOrderAsFailed(
    orderId: string,
    reason: string,
    entityManager: EntityManager,
  ): Promise<void> {
    const order = await entityManager.findOne(Order, {
      where: { id: orderId },
      relations: ['transactions', 'branch'],
    });

    if (!order) {
      throw new NotFoundException({
        message: `Order with ID ${orderId} not found`,
        code: ErrorCodes.ORDER_NOT_FOUND,
      });
    }

    order.status = OrderStatus.CANCELED;
    order.finalizedDate = new Date();
    order.cancellationReason = reason;
    // send notification to the provider-user that the order status has changed to CANCELED
    await this.notificationsService.sendSystemNotification({
      manager: entityManager,
      order,
      type: SystemNotificationType.CANCELED,
      channel: NotificationChannel.PROVIDER_PORTAL,
    });
    if (order.transactions) {
      order.transactions.forEach((transaction) => {
        transaction.status = TransactionStatus.FAILED;
      });
      await entityManager.save(order.transactions);
    }
    await entityManager.save(order);
  }

  async updateOrderStatus(
    order: Order,
    entityManager: EntityManager,
    updatedBy: string,
  ): Promise<void> {
    const totalPaid = new Decimal(order.paidAmount || 0);
    const total = new Decimal(order.totalAmount);
    if (totalPaid.equals(total)) {
      order.status = OrderStatus.PENDING_CONFIRMATION;
      if (order.branch.provider.requireOrderOTP) {
        order.status = OrderStatus.PENDING_VERIFICATION;
      }
      await this.orderHistoryService.trackOrderHistory(
        entityManager,
        order,
        OrderStatus.PENDING_PAYMENT,
        order.status,
        updatedBy,
      );
    }
    await (entityManager ?? this.repository.manager).update(Order, order.id, {
      status: order.status,
      paidAmount: order.paidAmount,
    });
  }

  async findByClosingBill(
    id: string,
    query: QueryOptions,
    providerId?: string,
  ) {
    const qb = this.repository
      .createQueryBuilder('order')
      .innerJoinAndSelect('order.branch', 'branch')
      .where('order.closing_bill_id =:id', { id });
    if (providerId) {
      qb.andWhere('branch.provider_id = :providerId', { providerId });
    }
    return this.findAll(query, qb);
  }

  async rejectOrder(
    orderId: string,
    requestedBy: AuthUserDto,
    reason: string,
  ): Promise<Order> {
    const queryRunner = await this.startTransaction(this.dataSource);
    try {
      const order = await queryRunner.manager.findOneOrFail(Order, {
        where: {
          id: orderId,
          status: OrderStatus.PENDING_APPROVAL,
        },
        relations: ['user.customer', 'transactions', 'branch'],
      });
      const previousStatus = order.status;
      order.status = OrderStatus.REJECTED;
      order.finalizedDate = new Date();
      order.rejectionReason = reason;
      order.metadata = {
        ...order.metadata,
        deletedBy: requestedBy.id,
      };
      await this.orderHistoryService.trackOrderHistory(
        queryRunner.manager,
        order,
        previousStatus,
        OrderStatus.REJECTED,
        requestedBy.id,
        reason,
      );
      await this.notificationsService.sendOrderStatusNotification({
        queryRunner,
        order,
        action: OrderAction.REJECT,
        reason,
      });
      const savedOrder = await queryRunner.manager.save(Order, order);
      await queryRunner.commitTransaction();
      return savedOrder;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      handleError(error);
    } finally {
      await queryRunner.release();
    }
  }
  async cancelOrder(
    orderId: string,
    requestedBy: AuthUserDto,
    reason?: string,
  ): Promise<Order> {
    const queryRunner = await this.startTransaction(this.dataSource);
    try {
      const order = await queryRunner.manager.findOne(Order, {
        where: {
          id: orderId,
          status: In([
            OrderStatus.NEW,
            OrderStatus.PENDING_PAYMENT,
            OrderStatus.PENDING_APPROVAL,
          ]),
        },
        relations: ['user', 'transactions', 'branch'],
      });
      if (!order) {
        throw new NotFoundException({
          message: `Order with ID ${orderId} not found or cannot be canceled in its current state.`,
          code: ErrorCodes.ORDER_NOT_FOUND,
        });
      }
      const previousStatus = order.status;
      order.status = OrderStatus.CANCELED;
      order.finalizedDate = new Date();
      order.cancellationReason = reason;
      order.metadata = {
        ...order.metadata,
        deletedBy: requestedBy.id,
      };
      await this.orderHistoryService.trackOrderHistory(
        queryRunner.manager,
        order,
        previousStatus,
        OrderStatus.CANCELED,
        requestedBy.id,
        `Order canceled by ${requestedBy.firstName} - ${reason || 'No reason provided'}`,
      );
      await this.notificationsService.sendOrderStatusNotification({
        queryRunner,
        order,
        action: OrderAction.CANCEL,
        reason,
      });
      const savedOrder = await queryRunner.manager.save(Order, order);
      await queryRunner.commitTransaction();
      return savedOrder;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      handleError(error);
    } finally {
      await queryRunner.release();
    }
  }
  async approveOrder(orderId: string, user: AuthUserDto) {
    const queryRunner = await this.startTransaction(this.dataSource);
    try {
      const order = await queryRunner.manager.findOneOrFail(Order, {
        where: {
          id: orderId,
          status: OrderStatus.PENDING_APPROVAL,
        },
        relations: ['user.customer', 'branch'],
      });
      await this.orderHistoryService.trackOrderHistory(
        queryRunner.manager,
        order,
        order.status,
        OrderStatus.PENDING_PAYMENT,
        user.id,
        'Order approved by the Pharmacy Admin',
      );
      order.status = OrderStatus.PENDING_PAYMENT;
      await this.notificationsService.sendOrderStatusNotification({
        queryRunner,
        order,
        action: OrderAction.APPROVE,
      });
      return await queryRunner.manager.save(Order, order);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      handleError(error);
    } finally {
      await queryRunner.release();
    }
  }

  findAllByAdmin(query: QueryOptions) {
    const qb = this.repository
      .createQueryBuilder('order')
      .innerJoin('order.user', 'user')
      .addSelect([
        'user.id',
        'user.firstName',
        'user.lastName',
        'user.mobile',
        'user.nationalId',
        'user.passportId',
      ])
      .innerJoinAndSelect('order.orderItems', 'orderItem')
      .innerJoinAndSelect('orderItem.item', 'item');
    return this.findAll(query, qb);
  }

  async orderPaymentRequest(
    orderId: string,
    paymentByUserId: string,
    user: AuthUserDto,
  ) {
    const queryRunner = await this.startTransaction(this.dataSource);
    try {
      const order = await queryRunner.manager.findOneOrFail(Order, {
        where: { id: orderId, user: { id: user.id } },
        relations: ['branch'],
      });
      if (order.status !== OrderStatus.PENDING_PAYMENT) {
        throw new ConflictException({
          message: `Order with ID ${orderId} is not in a state that allows payment requests.`,
          code: ErrorCodes.ORDER_STATUS_NOT_ALLOWED,
        });
      }
      await this.notificationsService.notifyUser({
        recipientId: paymentByUserId,
        relatedEntity: {
          id: order.id,
          type: RelatedEntityType.ORDER,
          orderNo: order.orderNo,
        },
        manager: queryRunner.manager,
        type: NotificationType.PAYMENT_FOR_OTHERS_REQUEST,
      });
      await queryRunner.commitTransaction();
      return order;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      handleError(error);
    } finally {
      await queryRunner.release();
    }
  }
  async rejectPaymentForOthersRequest(orderId: string, user: AuthUserDto) {
    const queryRunner = await this.startTransaction(this.dataSource);
    try {
      const order = await queryRunner.manager.findOneOrFail(Order, {
        where: { id: orderId, status: OrderStatus.PENDING_PAYMENT },
        relations: ['user', 'branch'],
      });
      await this.notificationsService.notifyUser({
        recipientId: order.user.id,
        relatedEntity: {
          id: order.id,
          type: RelatedEntityType.ORDER,
          orderNo: order.orderNo,
        },
        manager: queryRunner.manager,
        type: NotificationType.PAYMENT_FOR_OTHERS_REJECTED,
      });
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      handleError(error);
    } finally {
      await queryRunner.release();
    }
  }
}
