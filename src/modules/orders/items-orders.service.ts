import { ErrorCodes } from '@/common/error-codes';
import { handleError } from '@/database/db.errors';
import { DBService } from '@/database/db.service';
import { Cart } from '@/database/entities/cart.entity';
import { OrderItem } from '@/database/entities/order-item.entity';
import {
  Order,
  OrderStatus,
  OrderType,
} from '@/database/entities/order.entity';
import { Promo } from '@/database/entities/promo.entity';
import { SubscriptionStatus } from '@/database/entities/subscription.entity';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, QueryRunner, Repository } from 'typeorm';
import { AuthUserDto } from '../auth/dto/auth-user.dto';
import { LoyaltyPointsService } from '../loyalty-points/loyalty-points.service';
import {
  NotificationChannel,
  NotificationType,
  RelatedEntityType,
  SystemNotificationType,
} from '../notifications/dto/notification.enum';
import { PromoType } from '../promos/dto/Promo-type.model';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { OrderAction, OrderActionDto } from './dto/order-action.dto';
import { OrderHistoryService } from './order-history.service';
import { OrderOtpService } from './order-otp.service';
import { OrdersService } from './orders.service';
import { NotificationsService } from '../notifications/notifications.service';
import { UserType } from '@/database/entities/user.entity';
import { CacheService } from '@/common/cache.service';
import { CreateOrderPaymentsDto } from './dto/orderPayments.dto';
import {
  Transaction,
  TransactionStatus,
  TransactionType,
} from '@/database/entities/transaction.entity';
import { TransactionsService } from '../transactions/transactions.service';
import { v4 as uuid } from 'uuid';
import { Payment, PaymentStatus } from '@/database/entities/payment.entity';

@Injectable()
export class ItemsOrdersService extends DBService<Order> {
  constructor(
    @InjectRepository(Order)
    protected repository: Repository<Order>,
    @InjectRepository(Payment)
    protected paymentRepository: Repository<Payment>,
    private loyaltyPointsService: LoyaltyPointsService,
    private orderHistoryService: OrderHistoryService,
    private dataSource: DataSource,
    private orderOtpService: OrderOtpService,
    private ordersService: OrdersService,
    private notificationsService: NotificationsService,
    private subscriptionsService: SubscriptionsService,
    private cahceService: CacheService,
    private transactionsService: TransactionsService,
  ) {
    super(repository);
  }

  async createItemsOrder(
    cartId: string,
    createdBy: AuthUserDto,
  ): Promise<Order> {
    const queryRunner = await this.startTransaction(this.dataSource);
    const manager = queryRunner.manager;
    try {
      const cart = await this.findCart(
        manager,
        cartId,
        createdBy.branchId,
        createdBy.providerId,
      );
      const checkedOutCart = await this.checkoutCart(manager, cart);

      //get order items and check if any item is inpatient type
      const { orderItems, approvalRequired } = this.createOrderItemsFromCart(
        manager,
        checkedOutCart,
      );
      const order = await this.createOrderFromCart(
        manager,
        cart,
        orderItems,
        createdBy,
        approvalRequired,
      );
      if (approvalRequired) {
        await this.notificationsService.sendSystemNotification({
          manager,
          order,
          type: SystemNotificationType.ORDER_APPROVAL_REQUIRED,
          channel: NotificationChannel.ADMIN_PORTAL,
        });
      }
      await this.notificationsService.sendOrderStatusNotification({
        queryRunner,
        order,
      });
      // Refresh before commit
      const refreshedOrder = await manager.findOne(Order, {
        where: { id: order.id },
        relations: ['orderItems', 'orderItems.item'],
      });

      await queryRunner.commitTransaction();

      return refreshedOrder;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      handleError(error);
    } finally {
      await queryRunner.release();
    }
  }

  private async createOrderFromCart(
    manager: EntityManager,
    cart: Cart,
    orderItems: OrderItem[],
    createdBy: AuthUserDto,
    approvalRequired: boolean,
  ): Promise<Order> {
    let status = OrderStatus.PENDING_PAYMENT;
    if (approvalRequired) {
      status = OrderStatus.PENDING_APPROVAL;
    } else if (cart.cartOffers && cart.totalAmount === 0) {
      status = OrderStatus.PENDING_CONFIRMATION;
      if (cart.branch?.provider?.requireOrderOTP) {
        status = OrderStatus.PENDING_VERIFICATION;
      }
    }
    const newOrder = manager.create(Order, {
      orderItems,
      status,
      subTotal: cart.subTotal,
      totalAmount: cart.totalAmount,
      totalDiscount: cart.totalDiscount,
      coverageAmount: cart.coverageAmount,
      type: OrderType.ITEM_ORDER,
      user: cart.user,
      cart,
      branch: cart.branch,
      metadata: {
        createdBy: createdBy.id,
      },
    });
    const order = await manager.save(newOrder);
    return order;
  }

  private async checkoutCart(
    manager: EntityManager,
    cart: Cart,
  ): Promise<Cart> {
    await manager.update(Cart, cart.id, {
      isCheckedOut: true,
    });
    return { ...cart, isCheckedOut: true };
  }

  async confirmItemsOrder(
    orderId: string,
    confirmedBy: AuthUserDto,
  ): Promise<Order> {
    const queryRunner = await this.startTransaction(this.dataSource);

    try {
      const order = await this.findOrderForConfirmation(
        queryRunner.manager,
        orderId,
      );

      await this.confirmOrderStatus(queryRunner.manager, order, confirmedBy);
      await this.loyaltyPointsService.awardOrderPoints(
        order,
        queryRunner.manager,
      );
      await this.notificationsService.sendOrderStatusNotification({
        queryRunner,
        order,
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

  private async findOrderForConfirmation(
    manager: EntityManager,
    orderId: string,
  ): Promise<Order> {
    const order = await manager.findOne(Order, {
      where: {
        id: orderId,

        status: OrderStatus.PENDING_CONFIRMATION,
      },
      relations: [
        'transactions',
        'user',
        'orderItems',
        'branch',
        'branch.provider',
        'orderOtps',
      ],
    });

    if (!order) {
      throw new NotFoundException({
        message: `Order with ID ${orderId} not found or not in NEW or PAYMENT_PENDING status.`,
        code: ErrorCodes.ORDER_NOT_FOUND,
      });
    }

    if (
      order.branch?.provider?.requireOrderOTP &&
      !this.orderOtpService.isOrderOtpVerified(order)
    ) {
      throw new UnauthorizedException({
        message: 'Order requires OTP verification',
        code: ErrorCodes.OTP_VERIFICATION_REQUIRED,
      });
    }

    return order;
  }

  private async confirmOrderStatus(
    manager: EntityManager,
    order: Order,
    confirmedBy: AuthUserDto,
  ): Promise<Order> {
    const previousStatus = order.status;
    order.status = OrderStatus.CONFIRMED;
    order.finalizedDate = new Date();

    await this.orderHistoryService.trackOrderHistory(
      manager,
      order,
      previousStatus,
      OrderStatus.CONFIRMED,
      confirmedBy.id,
      'Order confirmed by user',
    );

    return await manager.save(Order, order);
  }

  async reOpenCanaledOrder(
    orderId: string,
    reOpenedBy: AuthUserDto,
    reason?: string,
  ): Promise<Order> {
    const queryRunner = await this.startTransaction(this.dataSource);
    try {
      const manager = queryRunner.manager;
      const order = await manager.findOneOrFail(Order, {
        where: { id: orderId, status: OrderStatus.CANCELED },
        relations: ['user'],
      });
      await this.orderHistoryService.trackOrderHistory(
        manager,
        order,
        order.status,
        OrderStatus.PENDING_PAYMENT,
        reOpenedBy.id,
        `Order Reopened By ${reOpenedBy.firstName} -reason ${reason || 'No reason provided'}`,
      );
      order.status = OrderStatus.PENDING_PAYMENT;
      order.finalizedDate = null;
      await this.notificationsService.sendOrderStatusNotification({
        queryRunner,
        order,
        action: OrderAction.REOPEN_CANCELED,
      });
      const reOpenedOrder = await manager.save(Order, order);
      await queryRunner.commitTransaction();
      return reOpenedOrder;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      handleError(error);
    } finally {
      await queryRunner.release();
    }
  }

  private createOrderItemsFromCart(manager: EntityManager, cart: Cart) {
    let approvalRequired = false;
    const orderItems = cart.cartItems.map((cartItem) => {
      if (cartItem.item.approvalRequired) approvalRequired = true;
      if (
        cartItem.unitPrice !== cartItem.item.price &&
        cartItem.item.isPriceEditable === false
      ) {
        // Throw error if cart item price does not match item price
        throw new BadRequestException({
          message: `The original price for item ID ${cartItem.item.id} has changed.`,
          code: ErrorCodes.CART_ITEM_PRICE_MISMATCH,
        });
      }
      return manager.create(OrderItem, {
        settlementPrice: cartItem?.item?.providerItems[0]?.settlementPrice,
        item: cartItem.item,
        quantity: cartItem.quantity,
        unitPrice: cartItem.unitPrice,
        totalPrice: cartItem.totalPrice,
        notes: cartItem.notes,
        extras: cartItem.extras,
      });
    });

    return { orderItems, approvalRequired };
  }

  private async findCart(
    manager: EntityManager,
    cartId: string,
    branchId: string,
    providerId: string,
  ): Promise<Cart> {
    const cart = await manager
      .createQueryBuilder(Cart, 'cart') // Start building query for Cart entity, aliased as 'cart'
      // Load specified relations using leftJoinAndSelect
      .leftJoinAndSelect('cart.cartItems', 'cartItems')
      .leftJoinAndSelect('cartItems.item', 'item') // Nested relation
      .leftJoinAndSelect(
        'item.providerItems',
        'pi',
        'pi.item_id = item.id AND pi.provider_id = :providerId',
        { providerId },
      )
      // Add the COALESCE expression to select the effective price
      .addSelect('COALESCE(pi.sellingPrice, item.price)', 'item_price')
      .addSelect('pi.settlementPrice')
      .leftJoinAndSelect('cart.branch', 'branch') // Alias for branch relation
      .leftJoinAndSelect('cart.user', 'user') // Alias for user relation
      .leftJoinAndSelect('user.customer', 'customer') // Nested relation
      .leftJoinAndSelect('cart.cartOffers', 'cartOffers') // Alias for cartOffers relation
      // Join the owner to be able to use in the COALESCE subquery.
      .leftJoin('user.owner', 'owner')
      // Map a single subscription property using COALESCE to choose the user's last subscription or the owner's
      .leftJoinAndMapOne(
        'user.subscription',
        'Subscription',
        'sub',
        `sub.id = (
          SELECT COALESCE(
            (SELECT s2.id FROM subscription s2 WHERE s2."user_id" = user.id ORDER BY s2."end_date" DESC LIMIT 1),
            (SELECT s3.id FROM subscription s3 WHERE s3."user_id" = owner.id ORDER BY s3."end_date" DESC LIMIT 1)
          )
       )`,
      )
      // Apply WHERE conditions
      .where('cart.id = :cartId', { cartId })
      // For relations used in WHERE, conditions are applied to their aliases
      .andWhere('cart.isCheckedOut = :isCheckedOut', { isCheckedOut: false })
      .andWhere('branch.id = :branchId', { branchId }) // Condition on the joined 'branch'
      .getOne();

    if (!cart) {
      throw new NotFoundException({
        message: `Cart not found or already checked out`,
        code: ErrorCodes.CART_NOT_FOUND,
      });
    }
    const subscription = (cart.user as any).subscription;
    if (
      !subscription ||
      subscription.status === SubscriptionStatus.EXPIRED ||
      subscription.endDate < new Date()
    ) {
      throw new ForbiddenException({
        message: `User has no active subscription.`,
        code: ErrorCodes.NO_ACTIVE_SUBSCRIPTION,
      });
    }
    if (!cart?.user?.idVerified) {
      throw new ForbiddenException({
        message: `User has not verified his identity.`,
        code: ErrorCodes.USER_IDENTITY_NOT_VERIFIED,
      });
    }
    if (
      cart?.user?.type === UserType.CORPORATE &&
      !cart?.user?.identityConfirmed
    ) {
      throw new ForbiddenException({
        message: `User has not verified his data.`,
        code: ErrorCodes.USER_IDENTITY_NOT_VERIFIED,
      });
    }

    return cart;
  }

  // Implement the applyPromotion logic
  async applyPromotion(
    orderId: string,
    promoCode: string,
    userId: string,
  ): Promise<Order> {
    const queryRunner = await this.startTransaction(this.dataSource);
    const manager = queryRunner.manager;
    try {
      const order = await manager.findOneOrFail(Order, {
        where: {
          id: orderId,
          user: { id: userId },
          status: OrderStatus.PENDING_PAYMENT,
        }, // Ensure the order belongs to the user
        relations: ['user', 'promo'], // Load user and promoCode
      });
      // Check if a promo is already applied
      if (order.promo) {
        throw new ForbiddenException({
          message: 'A promotion is already applied to this order',
          code: ErrorCodes.PROMO_ALREADY_APPLIED, // Define a new error code
        });
      }
      const promo = await manager.findOneOrFail(Promo, {
        where: {
          code: promoCode,
          type: PromoType.ORDER_DISCOUNT,
          isActive: true,
        },
      });
      await this.subscriptionsService.validatePromo(promo, userId, manager);
      order.totalDiscount += promo.discountAmount;
      order.totalAmount = Math.max(0, order.subTotal - order.totalDiscount); // Ensure totalAmount is not negative
      order.promo = promo;
      promo.usageCount += 1;
      const [promotedOrder] = await Promise.all([
        await manager.save(order),
        await manager.save(promo),
        await this.cahceService.mdel('promo:all', `promo:${promo.id}`),
      ]);
      await queryRunner.commitTransaction();
      return promotedOrder;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      handleError(error);
    } finally {
      await queryRunner.release();
    }
  }

  // remove promotion from order
  async removePromotion(
    orderId: string,
    promoCode: string,
    userId: string,
  ): Promise<Order> {
    const queryRunner = await this.startTransaction(this.dataSource);
    const manager = queryRunner.manager;
    try {
      const order = await manager.findOneOrFail(Order, {
        where: {
          id: orderId,
          user: { id: userId },
          status: OrderStatus.PENDING_PAYMENT,
        }, // Ensure the order belongs to the user
        relations: ['user', 'promo'], // Load user and promoCode
      });
      // Check if a promo is already applied
      if (!order.promo) {
        throw new ForbiddenException({
          message: 'No promotion is applied to this order',
          code: ErrorCodes.PROMO_NOT_APPLIED, // Define a new error code
        });
      }
      // Check if the promo code matches the applied promotion
      if (order.promo.code !== promoCode) {
        throw new ForbiddenException({
          message:
            'The provided promo code does not match the applied promotion',
          code: ErrorCodes.PROMO_NOT_APPLIED, // Define a new error code
        });
      }
      const promo = await manager.findOneOrFail(Promo, {
        where: {
          code: promoCode,
          type: PromoType.ORDER_DISCOUNT,
          isActive: true,
        },
      });
      order.totalDiscount -= promo.discountAmount;
      order.totalAmount = Math.max(0, order.subTotal - order.totalDiscount); // Ensure totalAmount is not negative
      order.promo = null; // Remove the promo from the order
      promo.usageCount -= 1;
      const [promotedOrder] = await Promise.all([
        await manager.save(order),
        await manager.save(promo),
        await this.cahceService.mdel('promo:all', `promo:${promo.id}`),
      ]);
      await queryRunner.commitTransaction();
      return promotedOrder;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      handleError(error);
    } finally {
      await queryRunner.release();
    }
  }

  async verifyOrderOTP(
    orderId: string,
    otp: string,
    confirmedBy: AuthUserDto,
  ): Promise<Order> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const order = await this.ordersService.findOrderWithOtp(orderId);

      if (!order.orderOtps?.length) {
        throw new UnauthorizedException({
          message: 'No OTP found for this order',
          code: ErrorCodes.OTP_NOT_FOUND,
        });
      }

      const latestOtp = order.orderOtps[order.orderOtps.length - 1];

      // if (latestOtp.expiresAt < new Date()) {
      //   throw new UnauthorizedException({
      //     message: 'OTP has expired',
      //     code: ErrorCodes.OTP_EXPIRED,
      //   });
      // }

      if (latestOtp.otp !== otp) {
        throw new UnauthorizedException({
          message: 'Invalid OTP',
          code: ErrorCodes.OTP_INVALID,
        });
      }

      latestOtp.isVerified = true;
      await queryRunner.manager.save(latestOtp);
      await this.confirmOrderStatus(queryRunner.manager, order, confirmedBy);
      await this.loyaltyPointsService.awardOrderPoints(
        order,
        queryRunner.manager,
      );
      await this.notificationsService.sendOrderStatusNotification({
        queryRunner,
        order,
      });
      await queryRunner.commitTransaction();
      return order;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async orderAction(
    orderId: string,
    action: OrderActionDto,
    user: AuthUserDto,
  ) {
    switch (action.type) {
      case OrderAction.NOTIFY_USER:
        const order = await this.findOneOrFail({
          where: { id: orderId, branch: { id: user.branchId } },
          relations: ['user'],
        });
        return this.notificationsService.notifyUser({
          recipientId: order.user.id,
          relatedEntity: { type: RelatedEntityType.ORDER, id: orderId },
          type: NotificationType.PENDING_PAYMENT,
        });
      case OrderAction.CONFIRM:
        return this.confirmItemsOrder(orderId, user);
      case OrderAction.REOPEN_CANCELED:
        return this.reOpenCanaledOrder(orderId, user);
      case OrderAction.CANCEL:
        return this.ordersService.cancelOrder(orderId, user, action.reason);
      default:
        throw new BadRequestException({
          message: `Invalid action ${action.type}`,
          code: ErrorCodes.INVALID_ACTION,
        });
    }
  }

  async createOrderPayment(
    orderPaymentsDto: CreateOrderPaymentsDto,
    orderId: string,
    user: AuthUserDto,
  ) {
    let order = await this.ordersService.findOneOrFail({
      where: {
        id: orderId,
        user: { id: user.id },
        status: OrderStatus.PENDING_PAYMENT,
      },
      relations: [
        'user',
        'transactions',
        'branch',
        'branch.provider',
        'payments',
        'promo',
      ],
    });
    const payment = await this.paymentRepository.save({
      idempotencyKey: orderPaymentsDto.idempotencyKey,
      payerType: orderPaymentsDto.payerType,
      order: { id: orderId },
      metadata: { createdBy: user.id },
      amount: order.remainingAmount,
      status: PaymentStatus.PENDING,
    });
    const queryRunner = await this.startTransaction(this.dataSource);
    try {
      if (orderPaymentsDto.promoCode) {
        order = await this.handlePromotion(
          queryRunner,
          order,
          orderPaymentsDto.promoCode,
        );
      }
      const transactions = [];
      const balanceTransaction = orderPaymentsDto.options.find(
        (option) => option.type === TransactionType.BALANCE,
      );
      const onlineTransaction = orderPaymentsDto.options.find(
        (option) => option.type === TransactionType.ONLINE_PAYMENT,
      );
      if (balanceTransaction) {
        const { transaction } =
          await this.transactionsService.createTransaction(
            {
              ...balanceTransaction,
              idempotencyKey: uuid(),
              order: { id: orderId },
              metadata: { createdBy: user.id },
            },
            queryRunner,
            order,
            payment,
          );
        transactions.push(transaction);
      }
      if (onlineTransaction) {
        const { transaction } =
          await this.transactionsService.createTransaction(
            {
              ...onlineTransaction,
              idempotencyKey: uuid(),
              order: { id: orderId },
              metadata: { createdBy: user.id },
            },
            queryRunner,
            order,
            payment,
          );
        transactions.push(transaction);
      }
      payment.transactions = [...transactions];
      const updatedPayment = await queryRunner.manager.save(Payment, {
        ...payment,
        status: transactions.every(
          (t) => t.status === TransactionStatus.COMPLETED,
        )
          ? PaymentStatus.SUCCEEDED
          : PaymentStatus.PENDING,
        amount: transactions.reduce((acc, t) => acc + t.amount, 0),
      });
      await queryRunner.commitTransaction();
      // send order updates notifications
      if (
        order.status === OrderStatus.PENDING_CONFIRMATION ||
        order.status === OrderStatus.PENDING_VERIFICATION
      ) {
        await this.notificationsService.sendOrderStatusNotification({
          queryRunner,
          order,
        });
      }
      return updatedPayment;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await this.updatePayment(payment.id, error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async updatePayment(paymentId: string, error: any) {
    try {
      await this.paymentRepository.update(paymentId, {
        status: PaymentStatus.FAILED,
        error,
      });
    } catch (error) {
      console.error('Error updating payment status:', error);
    }
  }

  private async handlePromotion(
    queryRunner: QueryRunner,
    order: Order,
    promoCode: string,
  ): Promise<Order> {
    // Check if a promo is already applied
    if (order.promo) {
      throw new ForbiddenException({
        message: 'A promotion is already applied to this order',
        code: ErrorCodes.PROMO_ALREADY_APPLIED, // Define a new error code
      });
    }
    const promo = await queryRunner.manager.findOneOrFail(Promo, {
      where: {
        code: promoCode,
        type: PromoType.ORDER_DISCOUNT,
        isActive: true,
      },
    });
    await this.validatePromo(promo, order.user.id, queryRunner.manager);
    order.totalDiscount += promo.discountAmount;
    order.totalAmount = Math.max(0, order.subTotal - order.totalDiscount); // Ensure totalAmount is not negative
    order.promo = promo;
    order.appliedCode = promoCode;
    promo.usageCount += 1;
    const [updatedOrder] = await Promise.all([
      await queryRunner.manager.save(order),
      await queryRunner.manager.save(Promo, promo),
      await this.cahceService.mdel('promo:all', `promo:${promo.id}`),
    ]);
    return updatedOrder;
  }

  private async validatePromo(
    promo: Promo,
    userId: string,
    manager: EntityManager,
  ) {
    const now = new Date();
    if (promo.startDate > now || promo.endDate < now) {
      throw new BadRequestException({
        message: 'Promo code is outside its valid date range',
        code: ErrorCodes.PROMO_CODE_EXPIRED, // Define a new error code
      });
    }

    if (promo.maxMembers && promo.usageCount >= promo.maxMembers) {
      throw new BadRequestException({
        message: 'Promo code has no usage left',
        code: ErrorCodes.PROMO_CODE_NOT_ACTIVE,
      });
    }
    // Check if user has used this promo before on an ITEM_ORDER
    // This check is specific to ITEM_ORDER based on the subscription service example
    const existingPromoUsage = await manager.findOne(Order, {
      where: {
        user: { id: userId },
        promo: { id: promo.id }, // Check by promo ID
      },
    });
    if (existingPromoUsage) {
      throw new BadRequestException({
        message:
          'Promo code has already been used by this user for an item order',
        code: ErrorCodes.PROMO_CODE_ALREADY_USED,
      });
    }
  }
}
