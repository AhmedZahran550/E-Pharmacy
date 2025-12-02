import {
  Paginate as PPaginate,
  PaginateConfig,
  PaginateQuery,
  Paginated,
} from 'nestjs-paginate';
import {
  EntityManager,
  FindOptionsWhere,
  QueryRunner,
  FindOneOptions as TFindOneOptions,
} from 'typeorm';
import { IsolationLevel } from 'typeorm/driver/types/IsolationLevel';

export interface TransactionOptions {
  isolationLevel?: IsolationLevel;
  manager?: EntityManager;
  queryRunner?: QueryRunner;
}
export interface QueryOptions extends PaginateQuery, TransactionOptions {
  enableCache?: boolean;
  cacheTTL?: any;
}

export interface QueryOneOptions<T>
  extends TFindOneOptions<T>,
    TransactionOptions {
  enableCache?: boolean;
  ttl?: any;
}

export interface QueryConfig<T> extends PaginateConfig<T> {}

export interface Page<T> extends Paginated<T> {}

export const Paginate = PPaginate;
