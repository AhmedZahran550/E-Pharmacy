import { Module } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { ProviderEmployeesController } from './provider-employee.controller';

@Module({
  controllers: [ProviderEmployeesController],
  providers: [EmployeesService],
  exports: [EmployeesService],
})
export class EmployeesModule {}
