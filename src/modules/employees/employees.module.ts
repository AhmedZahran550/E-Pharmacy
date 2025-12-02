import { Module } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { AdminEmployeesController } from './admin-employees.controller';
import { ProviderEmployeesController } from './provider-employee.controller';
import { CustomerEmployeesController } from './customer-employee.controller';
import { AdminCustomerEmployeesController } from './admin-customer-employees.controller';
import { AdminProviderEmployeesController } from './admin-provider-employees.controller';

@Module({
  controllers: [
    AdminEmployeesController,
    ProviderEmployeesController,
    CustomerEmployeesController,
    AdminCustomerEmployeesController,
    AdminProviderEmployeesController,
  ],
  providers: [EmployeesService],
  exports: [EmployeesService],
})
export class EmployeesModule {}
