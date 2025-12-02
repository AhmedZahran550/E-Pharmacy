import { UseGuards, applyDecorators } from '@nestjs/common';
import { ProviderAccessGuard } from '../guards/provider-access.guard';

export function ValidateProviderAccess() {
  return applyDecorators(UseGuards(ProviderAccessGuard));
}
