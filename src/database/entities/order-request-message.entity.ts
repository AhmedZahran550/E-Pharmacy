import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { OrderRequest } from './order-request.entity';
import { User } from './user.entity';
import { Employee } from './employee.entity';

export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  DOCUMENT = 'DOCUMENT',
  SYSTEM = 'SYSTEM',
}

export enum SenderRole {
  USER = 'USER',
  DOCTOR = 'DOCTOR',
  SYSTEM = 'SYSTEM',
}

@Entity('order_request_messages')
export class OrderRequestMessage extends BaseEntity {
  @Column({ type: 'enum', enum: MessageType })
  type: MessageType;

  @Column({ type: 'enum', enum: SenderRole })
  senderRole: SenderRole;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'jsonb', nullable: true })
  messageMetadata: {
    imageUrl?: string;
    documentUrl?: string;
    fileName?: string;
  };

  @Column({ type: 'boolean', default: false })
  isRead: boolean;

  @Column({ type: 'timestamp', nullable: true })
  readAt: Date;

  // Relationships
  @ManyToOne(() => OrderRequest, (orderRequest) => orderRequest.messages)
  @JoinColumn({ name: 'order_request_id' })
  orderRequest: OrderRequest;

  @Column({ type: 'uuid' })
  orderRequestId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'sender_user_id' })
  senderUser: User;

  @Column({ type: 'uuid', nullable: true })
  senderUserId: string;

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'sender_doctor_id' })
  senderDoctor: Employee;

  @Column({ type: 'uuid', nullable: true })
  senderDoctorId: string;
}
