import { Metadata } from '@/database/entities/embeded/metadata.entity';
import { Role } from '../role.model';
import { EmbededLocalizedName } from '@/database/entities/embeded/localized-name.entity';
import { Policy } from '../policies.types';

export class AuthUserDto {
  constructor(user?: Partial<AuthUserDto>) {
    Object.assign(this, user);
  }

  id?: string;
  email: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  mobile: string;
  familyId: string;
  disabled?: boolean;
  isFamilyManager?: boolean;
  locked?: boolean;
  lockedAt?: Date;
  metadata?: Metadata;
  roles: Role[];
  policies?: Policy[];
  branchId?: string;
  providerId?: string;
  customerId?: string;
  branch?: {
    id: string;
    name: EmbededLocalizedName;
    provider?: { id: string };
  };
  mobileVerified?: boolean;
  identityId?: string;
}

// export class AppUserDto extends AuthUserDto {
//   constructor(user: Partial<AppUserDto>) {
//     super(user);
//   }
//   isPrincipal?: boolean;
//   familyId?: string;
//   ownerId?: string;
// }
