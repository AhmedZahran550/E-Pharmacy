import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeesService } from './employees.service';
import { ProviderEmployeesController } from './provider-employee.controller';
import { AdminEmployeesController } from './admin-employees.controller';
import { UserEmployeesController } from './user-employees.controller';
import { Employee } from '@/database/entities/employee.entity';
import { Branch } from '@/database/entities/branch.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Employee, Branch])],
  controllers: [
    ProviderEmployeesController,
    AdminEmployeesController,
    UserEmployeesController,
  ],
  providers: [EmployeesService],
  exports: [EmployeesService],
})
export class EmployeesModule {}
