import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { OrderOtp } from '@/database/entities/order-otp.entity';
import { Order } from '@/database/entities/order.entity';
import { addMinutes } from 'date-fns';

@Injectable()
export class OrderOtpService {
  constructor(
    @InjectRepository(OrderOtp)
    private otpRepository: Repository<OrderOtp>,
  ) {}

  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async createOrderOtp(
    order: Order,
    entityManager: EntityManager,
  ): Promise<OrderOtp> {
    const otp = this.generateOTP();
    const expiresAt = addMinutes(new Date(), 10);

    const otpRecord = this.otpRepository.create({
      order,
      otp,
      expiresAt,
      isVerified: false,
    });

    return entityManager.save(otpRecord);
  }

  /**
   * Checks if the order has a verified OTP
   * @param order The order to check
   * @returns True if the order has a verified OTP, false otherwise
   */
  isOrderOtpVerified(order: Order): boolean {
    if (!order.orderOtps || !order.orderOtps.length) {
      return false;
    }
    return !!order.orderOtps[order.orderOtps.length - 1].isVerified;
  }
}
