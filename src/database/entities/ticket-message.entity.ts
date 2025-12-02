import { Check, Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Ticket } from './ticket.entity';
import { User } from './user.entity';
import { Employee } from './employee.entity';

@Entity({ name: 'ticket_message' })
@Index('TICKET_MESSAGE_TICKET_USER_IDX', ['ticket', 'user'])
@Index('TICKET_MESSAGE_TICKET_Employee_IDX', ['ticket', 'employee'])
@Check(`("user_id" IS NOT NULL OR "employee_id" IS NOT NULL)`)
export class TicketMessage extends BaseEntity {
  @Column('text')
  content: string;

  @ManyToOne(() => Ticket, (ticket) => ticket.messages, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  ticket: Ticket;

  @ManyToOne(() => User, { eager: true, nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ nullable: true })
  userId: string;

  @ManyToOne(() => Employee, { eager: true, nullable: true })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Column({ nullable: true })
  employeeId: string;
}
