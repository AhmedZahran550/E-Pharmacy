import { InferSubjects, PureAbility } from '@casl/ability';

export enum Subject {
  customers = 'customers',
  employee = 'employee',
  users = 'users',
  closingBills = 'closingBills',
  branches = 'branches',
  providers = 'providers',
  specialities = 'specialities',
  sections = 'sections',
  providerTypes = 'providerTypes',
  promo = 'promo',
  plans = 'plans',
  customerPlans = 'customerPlans',
  orders = 'orders',
  carts = 'carts',
  offers = 'offers',
  loyaltyPoints = 'loyaltyPoints',
  items = 'items',
  transactions = 'transactions',
  notifications = 'notifications',
  governorates = 'governorates',
  branchItems = 'branchItems',
  subscriptions = 'subscriptions',
  tickets = 'tickets',
}

export type Subjects = InferSubjects<Subject> | 'all';
export type AppAbility = PureAbility<[PolicyAction, Subjects]>;

export interface Policy {
  subject: Subject;
  actions: PolicyAction[];
  type?: 'allow' | 'deny';
}

export enum PolicyAction {
  Manage = 'manage',
  Create = 'create',
  Get = 'get',
  List = 'list',
  Update = 'update',
  Delete = 'delete',
}
// Action abbreviation mapping
export const actionMap: Record<string, string> = {
  get: 'g',
  list: 'l',
  create: 'c',
  update: 'u',
  delete: 'd',
  manage: 'm',
};
export const HTTP_METHOD_TO_POLICY_ACTION: Record<string, PolicyAction> = {
  GET: PolicyAction.Get, // Default for GET /:id
  POST: PolicyAction.Create,
  PATCH: PolicyAction.Update,
  PUT: PolicyAction.Update,
  DELETE: PolicyAction.Delete,
};

export interface IPolicyHandler {
  handle(ability: AppAbility): boolean;
}

type PolicyHandlerCallback = (ability: AppAbility) => boolean;

export type PolicyHandler = IPolicyHandler | PolicyHandlerCallback;
