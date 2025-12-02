import { Module } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { AdminEmployeesController } from './admin-employees.controller';
import { ProviderEmployeesController } from './provider-employee.controller';
import { AdminProviderEmployeesController } from './admin-provider-employees.controller';

@Module({
  controllers: [
    AdminEmployeesController,
    ProviderEmployeesController,
    AdminProviderEmployeesController,
  ],
  providers: [EmployeesService],
  exports: [EmployeesService],
})
export class EmployeesModule {}
