import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CaslAbilityFactory } from '../casl-ability.factory';
import {
  AppAbility,
  HTTP_METHOD_TO_POLICY_ACTION,
  PolicyAction,
  Subject,
} from '../policies.types';
import { CHECK_POLICIES_KEY } from '../decorators/policies.decorator';

@Injectable()
export class PoliciesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private caslAbilityFactory: CaslAbilityFactory,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get the single policy object. `getAllAndOverride` correctly gets the most specific one.
    const policy = this.reflector.getAllAndOverride<{
      action?: PolicyAction;
      subject: Subject;
    }>(CHECK_POLICIES_KEY, [context.getHandler(), context.getClass()]);

    // If no @CheckPolicies decorator is found, grant access.
    if (!policy) {
      return true;
    }

    // A policy must have a subject to be valid.
    // This also handles the @CheckPolicies() case, where the policy is {} and `policy.subject` is undefined.
    // no policies required for this end point overwrite the controller Policies
    if (!policy.subject) {
      return true;
    }

    const { user, params, method } = context.switchToHttp().getRequest();
    const ability = this.caslAbilityFactory.createForUser(user, params);

    const { subject } = policy;
    // Infer action from the policy object, or from the HTTP method as a fallback.
    const action = policy.action || this.inferAction(method, params);

    if (!action) {
      return false; // Could not determine an action, deny access.
    }

    // Perform the final authorization check.
    return ability.can(action, subject);
  }

  private inferAction(
    method: string,
    params: Record<string, any>,
  ): PolicyAction | null {
    const httpMethod = method.toUpperCase();
    if (httpMethod === 'GET') {
      return params.id ? PolicyAction.Get : PolicyAction.List;
    }
    return HTTP_METHOD_TO_POLICY_ACTION[httpMethod] || null;
  }
}
