import { handleError } from '@/database/db.errors';
import { DBService } from '@/database/db.service';
import {
  PointRelatedEntityType,
  PointsTransactionType,
} from '@/database/entities/loyalty-points.entity';
import {
  Order,
  OrderStatus,
  OrderType,
} from '@/database/entities/order.entity';
import { Plan, PlanType } from '@/database/entities/plan.entity';
import {
  Subscription,
  SubscriptionStatus,
} from '@/database/entities/subscription.entity';
import {
  Transaction,
  TransactionStatus,
  TransactionType,
} from '@/database/entities/transaction.entity';
import { User, UserStatus } from '@/database/entities/user.entity';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { add, differenceInMonths } from 'date-fns';
import {
  DataSource,
  EntityManager,
  MoreThan,
  QueryRunner,
  Repository,
} from 'typeorm';
import { AuthUserDto } from '../auth/dto/auth-user.dto';
import { LoyaltyPointsService } from '../loyalty-points/loyalty-points.service';
import { PromosService } from '../promos/promos.service';
import { CreateSubscriptionOrderDto } from './dto/create-subscription-order.dto';
import { OrderHistoryService } from './order-history.service';
import { TransactionsService } from '../transactions/transactions.service';
import { NotificationType } from '../notifications/dto/notification.enum';
import {
  PayerType,
  Payment,
  PaymentStatus,
} from '@/database/entities/payment.entity';
import { OrderItem } from '@/database/entities/order-item.entity';
import { ErrorCodes } from '@/common/error-codes';
import { Auth } from 'firebase-admin/lib/auth/auth';

@Injectable()
export class SubscriptionOrdersService extends DBService<Order> {
  constructor(
    @InjectRepository(Order)
    protected repository: Repository<Order>,
    private promosService: PromosService,
    private loyaltyPointsService: LoyaltyPointsService,
    private orderHistoryService: OrderHistoryService,
    private dataSource: DataSource,
    private transactionsService: TransactionsService,
  ) {
    super(repository);
  }

  async createNewSubscription(
    createSubscriptionOrderDto: CreateSubscriptionOrderDto,
    authUser: AuthUserDto,
  ): Promise<Transaction> {
    const queryRunner = await this.startTransaction(this.dataSource);
    const { appliedCode } = createSubscriptionOrderDto;
    try {
      const plan = await queryRunner.manager.findOneOrFail(Plan, {
        where: { id: createSubscriptionOrderDto.planId },
      });
      const user = await queryRunner.manager.findOneOrFail(User, {
        where: { id: authUser.id },
      });
      const existingSubscription = await queryRunner.manager.findOne(
        Subscription,
        {
          where: {
            user: { id: user.id },
            status: SubscriptionStatus.ACTIVE,
            endDate: MoreThan(new Date()),
          },
        },
      );
      if (existingSubscription) {
        throw new ConflictException({
          code: ErrorCodes.ACTIVE_SUBSCRIPTION_EXISTS,
          message: 'User already has an active subscription.',
        });
      }
      let subTotal = plan.price;
      let totalDiscount = 0;
      let subscriptionUsers = [user];
      if (plan.type === PlanType.FAMILY) {
        const members = await queryRunner.manager.find(User, {
          where: {
            familyId: user.familyId,
          },
        });
        subTotal = plan.pricePerMember * members.length; // +1 for the owner
        subscriptionUsers = [...members];
      }
      let subscription = queryRunner.manager.create(Subscription, {
        plan: {
          id: createSubscriptionOrderDto.planId,
        },
        user: { id: user.id },
        status: SubscriptionStatus.NEW,
        startDate: new Date(),
        endDate: add(new Date(), { years: 1 }),
      });
      subscription = await queryRunner.manager.save(subscription);
      const transaction = await this.createOrderwithTransaction(
        queryRunner,
        subscription,
        createSubscriptionOrderDto,
        authUser,
        subscriptionUsers,
        subTotal,
        totalDiscount,
        appliedCode,
      );
      await queryRunner.commitTransaction();
      return transaction;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      handleError(error);
    } finally {
      await queryRunner.release();
    }
  }

  async updateFamilySubscription(
    createSubscriptionOrderDto: CreateSubscriptionOrderDto,
    user: AuthUserDto,
  ) {
    const queryRunner = await this.startTransaction(this.dataSource);
    try {
      const [newMembers, subscription] = await Promise.all([
        await queryRunner.manager.find(User, {
          where: {
            familyId: user.familyId,
            status: UserStatus.PENDING_SUBSCRIPTION,
          },
        }),
        await queryRunner.manager.findOneOrFail(Subscription, {
          where: {
            user: { id: user.id },
            status: SubscriptionStatus.ACTIVE,
          },
          relations: ['plan'],
        }),
      ]);
      if (newMembers?.length === 0) {
        throw new NotFoundException({
          code: ErrorCodes.USER_NOT_FOUND,
          message: 'No new members found to add to the subscription.',
        });
      }
      const today = new Date();
      const monthsRemaining =
        differenceInMonths(subscription.endDate, today) + 1; // +1 to include the current month
      const totalMonths = differenceInMonths(
        subscription.endDate,
        subscription.startDate,
      );
      const monthlyPricePerMember =
        subscription.plan.pricePerMember / totalMonths;
      const subTotal =
        monthlyPricePerMember * monthsRemaining * newMembers.length;

      const transaction = await this.createOrderwithTransaction(
        queryRunner,
        subscription,
        createSubscriptionOrderDto,
        user,
        newMembers,
        subTotal,
        0,
        null,
      );
      await queryRunner.commitTransaction();
      return transaction;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      handleError(error);
    } finally {
      await queryRunner.release();
    }
  }

  async completeSubcriptionOrder(order: Order): Promise<Order> {
    const queryRunner = await this.startTransaction(this.dataSource);
    try {
      const subscriptionOrder: Order = await this.findOpenSubscriptionOrder(
        order.id,
        order.user,
        queryRunner.manager,
      );
      const previousStatus = subscriptionOrder.status;
      subscriptionOrder.status = OrderStatus.COMPLETED;
      subscriptionOrder.paidAmount = order.totalAmount;
      const usersIds = subscriptionOrder.orderItems.map((item) => item.userId);
      subscriptionOrder.transactions.forEach((transaction) => {
        transaction.status = TransactionStatus.COMPLETED;
      });
      subscriptionOrder.finalizedDate = new Date();
      const updatedOrder = await queryRunner.manager.save(
        Order,
        subscriptionOrder,
      );

      await this.orderHistoryService.trackOrderHistory(
        queryRunner.manager,
        updatedOrder,
        previousStatus,
        OrderStatus.COMPLETED,
        order.user.id,
        'Subscription order completed',
      );

      const subscription = subscriptionOrder.subscription;
      subscription.status = SubscriptionStatus.ACTIVE;
      subscription.startDate = new Date();
      subscriptionOrder.subscription.endDate = add(new Date(), { years: 1 });
      subscription.endDate = add(new Date(), { years: 1 });

      await Promise.all([
        await queryRunner.manager.save(Subscription, subscription),
        await queryRunner.manager.update(User, usersIds, {
          status: UserStatus.ACTIVE,
        }),
      ]);
      // Handle referral points if appliedCode starts with 'R'
      if (subscriptionOrder.appliedCode?.startsWith('R')) {
        const referralUser = await queryRunner.manager.findOneOrFail(User, {
          where: {
            referralCode: subscriptionOrder.appliedCode,
          },
        });
        await this.loyaltyPointsService.awardLoyaltyPoints({
          user: referralUser,
          relatedEntity: {
            type: PointRelatedEntityType.ORDER,
            id: subscriptionOrder.id,
          },
          manager: queryRunner.manager,
          type: PointsTransactionType.REFERRAL,
          notificationType: NotificationType.REFERRAL_REWARD,
        });
      }
      // Add points to subscriber
      await this.loyaltyPointsService.awardLoyaltyPoints({
        user: order.user,
        relatedEntity: {
          id: subscriptionOrder.id,
          type: PointRelatedEntityType.ORDER,
        },
        manager: queryRunner.manager,
        type: PointsTransactionType.SUBSCRIPTION,
        notificationType: NotificationType.POINTS_EARNED,
      });

      await queryRunner.commitTransaction();
      return updatedOrder;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      handleError(error);
    } finally {
      await queryRunner.release();
    }
  }

  async cancelSubscriptionOrder(
    orderId: string,
    user: AuthUserDto,
    reason: string,
  ) {
    const order = await this.findOpenSubscriptionOrder(orderId, user);
    const previousStatus = order.status;
    order.status = OrderStatus.CANCELED;
    order.cancellationReason = reason;
    order.finalizedDate = new Date();
    const updatedOrder = await this.repository.save(order);

    await this.orderHistoryService.trackOrderHistory(
      this.repository.manager,
      updatedOrder,
      previousStatus,
      OrderStatus.CANCELED,
      user.id,
      reason,
    );

    return updatedOrder;
  }

  async findOpenSubscriptionOrder(
    orderId: string,
    user: AuthUserDto | User,
    manager?: EntityManager,
  ) {
    let repository: Repository<Order>;
    if (manager) {
      repository = manager.getRepository(Order);
    } else {
      repository = this.repository;
    }
    console.log('Finding open subscription order:', orderId, user.id);
    return await repository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.subscription', 'subscription')
      .leftJoinAndSelect('order.transactions', 'transaction')
      .leftJoinAndSelect('order.orderItems', 'orderItems')
      .where('order.id = :orderId', { orderId })
      .andWhere('order.user.id = :userId', { userId: user.id })
      .andWhere('order.status IN (:...statuses)', {
        statuses: [OrderStatus.NEW, OrderStatus.PENDING_PAYMENT],
      })
      .andWhere('order.subscription IS NOT NULL') // Filter orders where subscription is not null
      .getOneOrFail();
  }

  private createSubscriptionOrderItems(
    members: User[],
    manager: EntityManager,
    pricePerMember: number,
  ): OrderItem[] {
    const orderItems = members.map((member) => {
      return manager.create(OrderItem, {
        user: { id: member.id },
        quantity: 1,
        unitPrice: pricePerMember,
        totalPrice: pricePerMember,
      });
    });
    return orderItems;
  }

  private async createOrderwithTransaction(
    queryRunner: QueryRunner,
    subscription: Subscription,
    createSubscriptionOrderDto: CreateSubscriptionOrderDto,
    user: AuthUserDto,
    subscriptionUsers: User[],
    subTotal: number,
    totalDiscount: number,
    appliedCode?: string,
  ) {
    const orderItems = this.createSubscriptionOrderItems(
      subscriptionUsers,
      queryRunner.manager,
      subTotal / subscriptionUsers.length,
    );
    // Validate appliedCode
    if (appliedCode) {
      const { discountAmount } = await this.promosService.findByCode(
        appliedCode,
        {
          manager: queryRunner.manager,
        },
      );
      totalDiscount += discountAmount;
    }
    const totalAmount = subTotal - totalDiscount;
    // Create and save the order
    let order = queryRunner.manager.create(Order, {
      user: { id: user.id },
      appliedCode: appliedCode?.toUpperCase() || null,
      subTotal,
      totalDiscount,
      type: OrderType.SUBSCRIPTION_ORDER,
      totalAmount,
      subscription,
      status: OrderStatus.PENDING_PAYMENT,
      orderItems,
    });
    order = await queryRunner.manager.save(order);
    const payment = await queryRunner.manager.save(Payment, {
      order: { id: order.id },
      idempotencyKey: createSubscriptionOrderDto.idempotencyKey,
      metadata: { createdBy: user.id },
      payerType: PayerType.USER,
      amount: totalAmount,
      status: PaymentStatus.PENDING,
    });
    const { transaction } = await this.transactionsService.createTransaction(
      {
        order: { id: order.id },
        type: TransactionType.ONLINE_PAYMENT,
        amount: totalAmount,
        paymentMethod: createSubscriptionOrderDto.paymentMethod,
        idempotencyKey: createSubscriptionOrderDto.idempotencyKey,
        metadata: { createdBy: user.id },
      },
      queryRunner,
      order,
      payment,
    );
    return transaction;
  }
}
