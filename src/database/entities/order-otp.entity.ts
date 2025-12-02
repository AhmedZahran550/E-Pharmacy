import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Order } from './order.entity';
import { Exclude } from 'class-transformer';

@Entity({ name: 'order_otp' })
export class OrderOtp extends BaseEntity {
  @Column({
    select: false,
  })
  otp: string;

  @Column()
  expiresAt: Date;

  @Column({ default: false })
  isVerified: boolean;

  @ManyToOne(() => Order, (order) => order.orderOtps, {
    onDelete: 'CASCADE',
  })
  order: Order;
}
