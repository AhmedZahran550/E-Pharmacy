import { Module } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { AdminCustomersController } from './admin-customers.controller';

@Module({
  controllers: [AdminCustomersController],
  providers: [CustomersService],
  exports: [CustomersService],
})
export class CustomersModule {}
