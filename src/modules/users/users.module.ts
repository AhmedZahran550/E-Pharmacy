import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@/database/entities/user.entity';
import { MedicalProfile } from '@/database/entities/medical-profile.entity';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { OrdersModule } from '../orders/orders.module';

import { EmployeeMedicalProfileController } from './employee-medical-profile.controller';
import { MedicalProfileController } from './medical-profile.controller';
import { MedicalProfileService } from './medical-profile.service';
import { FamilyMembersController } from './family-members.controller';
import { FamilyMembersService } from './family-members.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, MedicalProfile]),
    forwardRef(() => OrdersModule),
  ],
  providers: [
    UsersService,
    ProfileService,
    MedicalProfileService,
    FamilyMembersService,
  ],
  exports: [UsersService, ProfileService, MedicalProfileService],
  controllers: [
    ProfileController,
    UsersController,
    EmployeeMedicalProfileController,
    MedicalProfileController,
    FamilyMembersController,
  ],
})
export class UsersModule {}
