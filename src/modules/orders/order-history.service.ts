import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { OrderHistory } from '@/database/entities/order-history.entity';
import { Order, OrderStatus } from '@/database/entities/order.entity';
import { AuthUserDto } from '../auth/dto/auth-user.dto';
import { User } from '@/database/entities/user.entity';
import { Employee } from '@/database/entities/employee.entity';
import { Role } from '../auth/role.model';

@Injectable()
export class OrderHistoryService {
  constructor(
    @InjectRepository(OrderHistory)
    private orderHistoryRepository: Repository<OrderHistory>,
  ) {}

  async trackOrderHistory(
    manager: EntityManager,
    order: Order,
    fromStatus: OrderStatus,
    toStatus: OrderStatus,
    createdBy: string,
    reason?: string,
  ): Promise<void> {
    const history = manager.create(OrderHistory, {
      order,
      fromStatus,
      toStatus,
      reason,
    });
    await manager.save(OrderHistory, {
      ...history,
      metadata: { createdBy: createdBy },
    });
  }

  async getOrderHistory(orderId: string): Promise<OrderHistory[]> {
    return await this.orderHistoryRepository
      .createQueryBuilder('oh')
      .innerJoin('oh.order', 'o')
      .leftJoinAndMapOne(
        'oh.createdByEmployee',
        'employee', // Replace with your actual User entity name
        'createdEmployee',
        'createdEmployee.id = oh.created_by::uuid', // Adjust based on your actual column name
      )
      .leftJoinAndMapOne(
        'oh.createdByUser',
        'user', // Replace with your actual User entity name
        'createdUser',
        'createdUser.id = oh.created_by::uuid', // Adjust based on your actual column name
      )
      .where('o.id = :orderId', { orderId })
      .orderBy('oh.updated_at', 'DESC') // Adjust column name based on your metadata structure
      .getMany();
  }

  async getOrderHistoryWithMinimalCreator(orderId: string) {
    const historyList = await this.getOrderHistory(orderId);
    if (!historyList || historyList.length === 0) {
      return [];
    }
    return historyList.map((history) => {
      const createdBy =
        ((history as any).createdByUser as User) ??
        ((history as any).createdByEmployee as Employee);
      return {
        ...history,
        createdByUser: {
          firstName: createdBy?.firstName,
          lastName: createdBy?.lastName,
          email: createdBy?.email,
        },
        createdByEmployee: null,
      };
    });
  }
}
