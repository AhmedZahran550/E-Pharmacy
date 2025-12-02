import { SetMetadata } from '@nestjs/common';
import {
  AppAbility,
  PolicyAction,
  PolicyHandler,
  Subject,
} from '../policies.types';

export const CHECK_POLICIES_KEY = 'check_policy';

/**
 * Decorator to apply a CASL policy object.
 * @param policy - A policy object containing a subject and an optional action.
 * If called with no arguments, it disables policy checks for that endpoint.
 */
export const Policies = (policy?: {
  action?: PolicyAction;
  subject: Subject;
}) => SetMetadata(CHECK_POLICIES_KEY, policy || {}); // Pass empty object for @CheckPolicies()
