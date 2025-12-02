import { Advertisement } from '@/database/entities/advertisement.entity';
import { BalanceTransaction } from '@/database/entities/balance-transaction.entity';
import { City } from '@/database/entities/city.entity';
import { ConfigGroup } from '@/database/entities/config-group.entity';
import { Config } from '@/database/entities/config.entity';
import { Governorate } from '@/database/entities/governorate.entity';
import { Otp } from '@/database/entities/otp.entity';
import { ProviderType } from '@/database/entities/provider-type.entity';
import { Speciality } from '@/database/entities/speciality.entity';
import { User } from '@/database/entities/user.entity';
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BranchItem } from './entities/branch-item.entity';
import { Branch } from './entities/branch.entity';
import { CartItem } from './entities/cart-item.entity';
import { Cart } from './entities/cart.entity';
import { TicketMessage } from './entities/ticket-message.entity';
import { Employee } from './entities/employee.entity';
import { Item } from './entities/item.entity';
import { ActivityLog } from './entities/activity-log.entity';
import { LoyaltyPoints } from './entities/loyalty-points.entity';
import { Notification } from './entities/notification.entity';
import { OfferItem } from './entities/offer-item.entity';
import { Offer } from './entities/offer.entity';
import { OrderItem } from './entities/order-item.entity';
import { Order } from './entities/order.entity';
import { Plan } from './entities/plan.entity';
import { Promo } from './entities/promo.entity';
import { ProviderItem } from './entities/provider-item.entity';
import { Provider } from './entities/provider.entity';
import { SectionSpeciality } from './entities/section-speciality.entity';
import { Section } from './entities/section.entity';
import { SpecialityItem } from './entities/speciality-item.entity';
import { Subscription } from './entities/subscription.entity';
import { Ticket } from './entities/ticket.entity';
import { Transaction } from './entities/transaction.entity';
import { ProviderSection } from './entities/provider-section.entity';
import { ProviderSpeciality } from './entities/provider-speciality.entity';
import { OrderOtp } from './entities/order-otp.entity';
import { OrderHistory } from './entities/order-history.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { SystemNotification } from './entities/system-notification.entity';
import { ClosingBill } from './entities/closing-bill.entity';
import { ClosingBillHistory } from './entities/closing-bill-history.entity';
import { CartOffer } from './entities/cart-offer.entity';
import { DeviceToken } from './entities/device-token.entity';
import { Faq } from './entities/faq.entity';
import { SupportRequest } from './entities/support-request.entity';
import { Payment } from './entities/payment.entity';
import { BranchAvailability } from './entities/branch-availability.entity';
import { BranchRating } from './entities/branch-rating.entity';
import { AppRating } from './entities/app-rating.entity';
import { ItemRating } from './entities/item-rating.entity';
import { SearchHistory } from './entities/search-history.entity';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        ...configService.get('database'),
        timezone: 'z',
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([
      User,
      Employee,
      Otp,
      Provider,
      ProviderItem,
      ProviderSection,
      Branch,
      BranchItem,
      Item,
      Plan,
      Order,
      OrderItem,
      OrderOtp,
      OrderHistory,
      Subscription,
      Cart,
      CartItem,
      Offer,
      OfferItem,
      Promo,
      Ticket,
      TicketMessage,
      Notification,
      ActivityLog,
      Advertisement,
      BalanceTransaction,
      ConfigGroup,
      Config,
      City,
      Governorate,
      Speciality,
      SpecialityItem,
      ProviderType,
      Transaction,
      LoyaltyPoints,
      Section,
      SectionSpeciality,
      ProviderSpeciality,
      PasswordResetToken,
      SystemNotification,
      ClosingBill,
      ClosingBillHistory,
      CartOffer,
      DeviceToken,
      Faq,
      SupportRequest,
      Payment,
      BranchAvailability,
      BranchRating,
      ItemRating,
      AppRating,
      SearchHistory,
    ]),
  ],
  providers: [],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
