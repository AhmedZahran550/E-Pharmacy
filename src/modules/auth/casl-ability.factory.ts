import { User } from '@/database/entities/user.entity';
import {
  Ability,
  AbilityBuilder,
  AbilityClass,
  createMongoAbility,
  ExtractSubjectType,
  InferSubjects,
  MongoAbility,
  PureAbility,
} from '@casl/ability';
import { Injectable } from '@nestjs/common';
import { Role } from './role.model';
import { PolicyAction, Subjects } from './policies.types';
import { AuthUserDto } from './dto/auth-user.dto';

export type AppAbility = MongoAbility<[PolicyAction, Subjects]>;

@Injectable()
export class CaslAbilityFactory {
  createForUser(user: AuthUserDto, params?: any) {
    const { can, cannot, build } = new AbilityBuilder<
      PureAbility<[PolicyAction, Subjects]>
    >(PureAbility as AbilityClass<AppAbility>);

    if (
      user?.roles?.includes(Role.ADMIN) ||
      user?.roles?.includes(Role.SUPER_ADMIN)
    ) {
      can(PolicyAction.Manage, 'all');
    } else if (user?.policies) {
      for (const policy of user?.policies) {
        if (policy.type === 'deny') {
          policy.actions?.forEach((action) => cannot(action, policy.subject));
        } else {
          policy.actions?.forEach((action) => can(action, policy.subject));
        }
      }
    }
    // can(PolicyAction.Manage, 'all'); // read-write access to everything
    // cannot(PolicyAction.Delete, user?, { isPublished: true });
    return build({
      // Read https://casl.js.org/v5/en/guide/subject-type-detection#use-classes-as-subject-types for details
      detectSubjectType: (item: any) =>
        item.constructor as ExtractSubjectType<Subjects>,
    });
  }
}
