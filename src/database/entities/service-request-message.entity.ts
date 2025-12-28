
import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { ServiceRequest } from './service-request.entity';
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

@Entity('service_request_messages')
export class ServiceRequestMessage extends BaseEntity {
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
  @ManyToOne(() => ServiceRequest, (serviceRequest) => serviceRequest.messages)
  @JoinColumn({ name: 'service_request_id' })
  request: ServiceRequest;

  @Column({ type: 'uuid', name: 'service_request_id' })
  requestId: string;

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
