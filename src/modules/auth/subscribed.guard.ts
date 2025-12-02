import { applyDecorators, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard'; // Assuming you have this for authentication

import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Check subscription status from the token
    return user.subscriptionStatus === 'active';
  }
}

export function Subscribed() {
  return applyDecorators(UseGuards(JwtAuthGuard, SubscriptionGuard));
}
