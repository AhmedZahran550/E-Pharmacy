// import {
//   QueryConfig,
//   QueryOptions,
//   TransactionOptions,
// } from '@/common/query-options';
// import { DBService } from '@/database/db.service';
// import { Injectable } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { FilterOperator } from 'nestjs-paginate';
// import { EntityManager, Repository } from 'typeorm';
// import { CreateSystemNotificationsDto } from './dto/create-notification.dto';
// import { UpdateSystemNotificationDto } from './dto/update-notification.dto';
// import { AuthUserDto } from '../auth/dto/auth-user.dto';

// import { NotificationChannel } from '@/modules/notifications/dto/notification.enum';
// import { Role } from '../auth/role.model';
// import { Subject } from '../auth/policies.types';

// export const NOTIFICATION_PAGINATION_CONFIG: QueryConfig<SystemNotification> = {
//   sortableColumns: ['metadata.createdAt'],
//   filterableColumns: {
//     customer_id: [FilterOperator.EQ],
//     branch_id: [FilterOperator.EQ],
//     type: [FilterOperator.EQ],
//     isRead: [FilterOperator.EQ],
//     'metadata.createdAt': [
//       FilterOperator.GTE,
//       FilterOperator.LTE,
//       FilterOperator.EQ,
//     ],
//   },
//   relations: ['closingBill.provider'],
//   defaultSortBy: [['metadata.createdAt', 'DESC']],
// };

// @Injectable()
// export class SystemNotificationsService extends DBService<
//   SystemNotification,
//   CreateSystemNotificationsDto,
//   UpdateSystemNotificationDto
// > {
//   constructor(
//     @InjectRepository(SystemNotification)
//     protected repository: Repository<SystemNotification>,
//   ) {
//     super(repository, NOTIFICATION_PAGINATION_CONFIG);
//   }

//   findAllByCustomer(authUser: AuthUserDto, query?: QueryOptions) {
//     const qb = this.repository
//       .createQueryBuilder('notification')
//       .innerJoinAndSelect('notification.order', 'order')
//       .innerJoinAndSelect('order.user', 'user')
//       // Join the owner to be able to use in the COALESCE subquery.
//       .leftJoin('user.owner', 'owner')
//       // Map a single subscription property using COALESCE to choose the user's last subscription or the owner's
//       .leftJoinAndMapOne(
//         'user.subscription',
//         'subscription',
//         'sub',
//         `sub.id = (
//                   SELECT COALESCE(
//                     (SELECT s2.id FROM subscription s2 WHERE s2."user_id" = user.id ORDER BY s2."end_date" DESC LIMIT 1),
//                     (SELECT s3.id FROM subscription s3 WHERE s3."user_id" = owner.id ORDER BY s3."end_date" DESC LIMIT 1)
//                   )
//                )`,
//       )
//       .where('notification.customer_id = :customerId', {
//         customerId: authUser.customerId,
//       })
//       .andWhere('notification.channel = :channel', {
//         channel: NotificationChannel.CUSTOMER_PORTAL,
//       });
//     return this.findAll(query, qb);
//   }

//   findAllByAdmin(query: QueryOptions) {
//     const qb = this.repository
//       .createQueryBuilder('notification')
//       .leftJoinAndSelect('notification.order', 'order')
//       .leftJoinAndSelect('notification.closingBill', 'closingBill')
//       .leftJoinAndSelect('closingBill.provider', 'provider')
//       .leftJoinAndSelect('order.user', 'user')
//       // Join the owner to be able to use in the COALESCE subquery.
//       .leftJoin('user.owner', 'owner')
//       // Map a single subscription property using COALESCE to choose the user's last subscription or the owner's
//       .leftJoinAndMapOne(
//         'user.subscription',
//         'subscription',
//         'sub',
//         `sub.id = (
//                         SELECT COALESCE(
//                           (SELECT s2.id FROM subscription s2 WHERE s2."user_id" = user.id ORDER BY s2."end_date" DESC LIMIT 1),
//                           (SELECT s3.id FROM subscription s3 WHERE s3."user_id" = owner.id ORDER BY s3."end_date" DESC LIMIT 1)
//                         )
//                      )`,
//       )
//       .where('notification.channel = :channel', {
//         channel: NotificationChannel.ADMIN_PORTAL,
//       });
//     return this.findAll(query, qb);
//   }

//   findAllByProvider(authUser: AuthUserDto, query?: QueryOptions) {
//     const qb = this.repository
//       .createQueryBuilder('notification')
//       .leftJoinAndSelect('notification.closingBill', 'closingBill')
//       .leftJoinAndSelect('notification.order', 'order')
//       .leftJoinAndSelect('order.user', 'user')
//       // Join the owner to be able to use in the COALESCE subquery.
//       .leftJoin('user.owner', 'owner')
//       // Map a single subscription property using COALESCE to choose the user's last subscription or the owner's
//       .leftJoinAndMapOne(
//         'user.subscription',
//         'subscription',
//         'sub',
//         `sub.id = (
//                   SELECT COALESCE(
//                     (SELECT s2.id FROM subscription s2 WHERE s2."user_id" = user.id ORDER BY s2."end_date" DESC LIMIT 1),
//                     (SELECT s3.id FROM subscription s3 WHERE s3."user_id" = owner.id ORDER BY s3."end_date" DESC LIMIT 1)
//                   )
//                )`,
//       )
//       .where('notification.channel = :channel', {
//         channel: NotificationChannel.PROVIDER_PORTAL,
//       });
//     if (
//       authUser.roles?.includes(Role.PROVIDER_ADMIN) ||
//       (authUser.policies?.length > 0 &&
//         authUser.policies?.some(
//           (policy) => policy.subject === Subject.notifications,
//         ))
//     ) {
//       qb.where('notification.provider_id = :providerId', {
//         providerId: authUser.providerId,
//       });
//     } else {
//       qb.where('notification.branch_id = :branchId', {
//         branchId: authUser.branchId,
//       });
//     }
//     return this.findAll(query, qb);
//   }

//   async markAsRead(id: string, where: Partial<SystemNotification>) {
//     return this.update(id, { isRead: true }, { where });
//   }

//   async send(entityManager: EntityManager, notification: SystemNotification) {
//     return await entityManager.save(SystemNotification, notification);
//   }
// }
