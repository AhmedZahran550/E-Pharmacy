export enum Role {
  ANONYMOUS = 'anonymous',
  USER = 'user',
  APP_OWNER = 'app_owner',
  APP_USER = 'app_user',
  APP_TESTER = 'app_tester',
  APP_ADMIN = 'app_admin',
  PRINCIPAL = 'principal',
  GUEST = 'guest',

  PROVIDER_USER = 'provider_user',
  PROVIDER_ADMIN = 'provider_admin',
  EMPLOYER_USER = 'employer_user',
  EMPLOYER_ADMIN = 'employer_admin',
  CUSTOMER_USER = 'customer_user',
  CUSTOMER_ADMIN = 'customer_admin',
  BRANCH_ADMIN = 'branch_admin',
  SYSTEM_USER = 'system_user',
  SYSTEM_ADMIN = 'system_admin',

  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
}

// export const Roles = Object.values(Role);
