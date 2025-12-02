import { UseGuards, applyDecorators } from '@nestjs/common';
import { CustomerAccessGuard } from '../guards/customer-access.guard';

export function ValidateCustomerAccess() {
  return applyDecorators(UseGuards(CustomerAccessGuard));
}
