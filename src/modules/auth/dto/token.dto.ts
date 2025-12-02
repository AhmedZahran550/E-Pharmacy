import { Policy } from '../policies.types';
import { Role } from '../role.model';

export interface TokenPayload {
  sub: string;
  roles: Role[];
  policies?: Policy[];
  familyId?: string;
  customerId?: string;
  clients: string[];
  isFamilyManager?: boolean;
}

export interface AdminTokenPayload extends TokenPayload {
  email: string;
}

export interface ProviderTokenPayload extends TokenPayload {
  email: string;
  branchId?: string;
  providerId: string;
}

export interface CustomerTokenPayload extends TokenPayload {
  email: string;
  customerId: string;
}
