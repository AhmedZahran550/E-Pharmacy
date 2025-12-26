import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeesService } from './employees.service';
import { ProviderEmployeesController } from './provider-employee.controller';
import { AdminEmployeesController } from './admin-employees.controller';
import { UserEmployeesController } from './user-employees.controller';
import { DoctorsProfileController } from './doctors-profile.controller';
import { Employee } from '@/database/entities/employee.entity';
import { Branch } from '@/database/entities/branch.entity';
import { SharedModule } from '@/common/shared.module';

@Module({
  imports: [TypeOrmModule.forFeature([Employee, Branch]), SharedModule],
  controllers: [
    ProviderEmployeesController,
    AdminEmployeesController,
    UserEmployeesController,
    DoctorsProfileController,
  ],
  providers: [EmployeesService],
  exports: [EmployeesService],
})
export class EmployeesModule {}
