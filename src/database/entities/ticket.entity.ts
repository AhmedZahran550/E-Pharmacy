import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { DateColumn } from '../../common/decorators/date-column.decorator';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { TicketMessage } from './ticket-message.entity';
import { Employee } from './employee.entity';

export enum TicketStatus {
  OPEN = 'OPEN',
  ESCALATED = 'ESCALATED',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export enum TicketPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum TicketType {
  // Account & Profile
  LOGIN_OR_PASSWORD_ISSUE = 'LOGIN_OR_PASSWORD_ISSUE',
  PROBLEM_UPDATING_PERSONAL_INFORMATION = 'PROBLEM_UPDATING_PERSONAL_INFORMATION',
  ACCOUNT_VERIFICATION_ISSUE = 'ACCOUNT_VERIFICATION_ISSUE',
  REQUEST_TO_DELETE_ACCOUNT = 'REQUEST_TO_DELETE_ACCOUNT',
  ACCOUNT_SECURITY_CONCERN = 'ACCOUNT_SECURITY_CONCERN',
  // Subscriptions & Billing
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  INCORRECT_CHARGE_OR_BILLING_INQUIRY = 'INCORRECT_CHARGE_OR_BILLING_INQUIRY',
  QUESTION_ABOUT_SUBSCRIPTION_PLANS = 'QUESTION_ABOUT_SUBSCRIPTION_PLANS',
  REQUEST_TO_UPGRADEDOWNGRADE_SUBSCRIPTION = 'REQUEST_TO_UPGRADEDOWNGRADE_SUBSCRIPTION',
  CANCELLATION_REQUEST = 'CANCELLATION_REQUEST',
  INVOICE_OR_RECEIPT_REQUEST = 'INVOICE_OR_RECEIPT_REQUEST',
  // Medical Network & Providers
  PROVIDER_INFORMATION_IS_INCORRECT = 'PROVIDER_INFORMATION_IS_INCORRECT',
  DIFFICULTY_FINDING_A_DOCTORSPECIALIST = 'DIFFICULTY_FINDING_A_DOCTORSPECIALIST',
  PROVIDER_NOT_ACCEPTING_THE_DISCOUNTSERVICE = 'PROVIDER_NOT_ACCEPTING_THE_DISCOUNTSERVICE',
  FEEDBACK_OR_COMPLAINT_ABOUT_A_PROVIDER = 'FEEDBACK_OR_COMPLAINT_ABOUT_A_PROVIDER',
  SUGGEST_A_NEW_PROVIDER_TO_ADD_TO_THE_NETWORK = 'SUGGEST_A_NEW_PROVIDER_TO_ADD_TO_THE_NETWORK',
  // Orders & Services
  PROBLEM_CREATING_AN_ORDER = 'PROBLEM_CREATING_AN_ORDER',
  DISCOUNT_WAS_NOT_APPLIED = 'DISCOUNT_WAS_NOT_APPLIED',
  NEED_TO_MODIFY_OR_CANCEL_AN_ORDER = 'NEED_TO_MODIFY_OR_CANCEL_AN_ORDER',
  QUESTION_ABOUT_A_SPECIFIC_SERVICE_OR_OFFER = 'QUESTION_ABOUT_A_SPECIFIC_SERVICE_OR_OFFER',
  SERVICE_RECEIVED_WAS_NOT_AS_DESCRIBED = 'SERVICE_RECEIVED_WAS_NOT_AS_DESCRIBED',
  // Points & Rewards Program
  POINTS_NOT_ADDED_TO_MY_ACCOUNT = 'POINTS_NOT_ADDED_TO_MY_ACCOUNT',
  INCORRECT_POINTS_BALANCE = 'INCORRECT_POINTS_BALANCE',
  PROBLEM_REDEEMING_POINTS = 'PROBLEM_REDEEMING_POINTS',
  QUESTION_ABOUT_THE_REWARDS_PROGRAM = 'QUESTION_ABOUT_THE_REWARDS_PROGRAM',
  // Technical Issue
  APP_IS_CRASHING_OR_FREEZING = 'APP_IS_CRASHING_OR_FREEZING',
  A_FEATURE_IS_NOT_WORKING_BUG_REPORT = 'A_FEATURE_IS_NOT_WORKING_BUG_REPORT',
  RECEIVING_AN_ERROR_MESSAGE = 'RECEIVING_AN_ERROR_MESSAGE',
  WEBSITE_LOADING_OR_DISPLAY_ISSUE = 'WEBSITE_LOADING_OR_DISPLAY_ISSUE',
  PROBLEM_UPLOADING_A_DOCUMENT = 'PROBLEM_UPLOADING_A_DOCUMENT',
  // General Inquiry & Feedback
  GENERAL_QUESTION = 'GENERAL_QUESTION',
  SUGGESTION_FOR_A_NEW_FEATURE = 'SUGGESTION_FOR_A_NEW_FEATURE',
  PROVIDE_A_COMPLIMENT_OR_POSITIVE_FEEDBACK = 'PROVIDE_A_COMPLIMENT_OR_POSITIVE_FEEDBACK',
  OTHER = 'OTHER',
}
@Entity({ name: 'ticket' })
@Index('TICKET_USER_employee_IDX', ['user', 'employee'])
@Check(`("user_id" IS NOT NULL OR "employee_id" IS NOT NULL)`)
export class Ticket extends BaseEntity {
  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: TicketStatus,
    default: TicketStatus.OPEN,
  })
  status: string;

  @Column({
    type: 'enum',
    enum: TicketPriority,
    default: TicketPriority.MEDIUM,
  })
  priority: string;

  @DateColumn({ nullable: true })
  closedAt: Date;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ nullable: true })
  userId: string;

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Column({ nullable: true })
  employeeId: string;

  @OneToMany(() => TicketMessage, (message) => message.ticket)
  messages: TicketMessage[];

  @Column({ type: 'enum', enum: TicketType })
  type: TicketType;

  @Column({ nullable: true })
  subject: string;

  @Column({ nullable: true, type: 'jsonb' })
  attachment?: {
    url: string;
  };
}
