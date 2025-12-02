import { Column, CreateDateColumn, Entity } from 'typeorm';

@Entity({ name: 'activity_log' })
export class ActivityLog {
  @Column({ primary: true })
  id: string;

  @Column({ name: 'user_id', nullable: true, type: 'uuid' })
  userId?: string;

  // @ManyToOne(() => User)
  // user?: Partial<User>;

  @Column({ nullable: true })
  url?: string;
  @Column({ nullable: true })
  resource?: string;

  @Column()
  method: string;

  @Column({ name: 'status_code', nullable: true })
  statusCode?: string;

  @Column({ name: 'req_body', nullable: true })
  reqBody?: string;

  @Column({ name: 'user_agent', nullable: true })
  userAgent?: string;

  @Column({ nullable: true, type: 'jsonb' })
  error?: string;

  @Column()
  clientIp: string;

  @Column({ name: 'request_time_in_millis', nullable: true })
  requestTimeInMillis?: number;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp with time zone',
  })
  createdAt?: Date;
}
