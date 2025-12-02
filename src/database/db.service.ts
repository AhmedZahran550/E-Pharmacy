import { ErrorCodes } from '@/common/error-codes';
import { BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import { paginate, Paginated } from 'nestjs-paginate';
import {
  DataSource,
  DeepPartial,
  FindOptionsWhere,
  QueryRunner,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import { IsolationLevel } from 'typeorm/driver/types/IsolationLevel';
import {
  QueryConfig,
  QueryOneOptions,
  QueryOptions,
  TransactionOptions,
} from '../common/query-options';
import { handleError } from './db.errors';
import { BaseEntity } from './entities/base.entity';
import { CacheManagerStore, Cache } from 'cache-manager';

export const defaultQueryConfig: QueryConfig<BaseEntity> = {
  sortableColumns: ['metadata.createdAt'],
  maxLimit: 100,
  defaultLimit: 50,
  // defaultSortBy: [['metadata.createdAt', 'DESC']],
};
type CacheOptions<E> = QueryOptions | QueryOneOptions<E>;
const DEFAULT_CACHE_TTL = 60 * 60; // Time-to-live in seconds (1 h)
type RedisTTL = {
  ttl: number;
};
export abstract class DBService<
  E extends BaseEntity,
  C extends DeepPartial<E> = E,
  U extends DeepPartial<C> = C,
  T = E,
> {
  protected readonly logger = new Logger(this.constructor.name);
  private TTL: number;
  constructor(
    protected repository: Repository<E>,
    protected queryConfig?: QueryConfig<E>,
  ) {
    this.queryConfig = {
      ...defaultQueryConfig,
      ...queryConfig,
    } as QueryConfig<E>;
  }
  async findAll(options: QueryOptions, qb?: SelectQueryBuilder<E>) {
    try {
      this.validateQuery(options);
      const repo = this.getRepository(options);
      const resp = await paginate<E>(options, qb ?? repo, this.queryConfig);
      return resp;
    } catch (error) {
      this.logger.error('error', error);
      handleError(error);
    }
  }

  async findById(id: string, options?: QueryOneOptions<E>) {
    try {
      const repo = this.getRepository(options);
      const entity = await repo.findOneOrFail({
        ...options,
        where: {
          ...options?.where,
          id: id as any,
        },
      });
      return this.mapper(entity);
    } catch (error) {
      handleError(error);
    }
  }

  async find(options?: QueryOneOptions<E>) {
    try {
      const repo = this.getRepository(options);
      const entities = await repo.find(options);
      return entities.map(this.mapper);
    } catch (error) {
      handleError(error);
    }
  }
  async findOne(options?: QueryOneOptions<E>) {
    try {
      const repo = this.getRepository(options);
      const entity = await repo.findOne(options);
      return this.mapper(entity);
    } catch (error) {
      handleError(error);
    }
  }

  async findOneOrFail(options?: QueryOneOptions<E>) {
    try {
      const repo = this.getRepository(options);
      const entity = await repo.findOneOrFail(options);
      return this.mapper(entity);
    } catch (error) {
      handleError(error);
    }
  }

  async create(data: C, options?: TransactionOptions): Promise<T> {
    try {
      const repo = this.getRepository(options);
      const entity = repo.create(data);
      const newEntity = await repo.save(entity);
      return this.mapper(newEntity);
    } catch (error) {
      handleError(error);
    }
  }

  async save(data: C, options?: TransactionOptions): Promise<T> {
    try {
      const repo = this.getRepository(options);
      const entity = repo.create(data);
      const newEntity = await repo.save(entity);
      return this.mapper(newEntity);
    } catch (error) {
      handleError(error);
    }
  }

  async batchCreate(data: C[], options?: TransactionOptions): Promise<T[]> {
    try {
      const repo = this.getRepository(options);
      const entities = repo.create(data);
      const newEntities = await repo.save(entities);
      return newEntities.map(this.mapper);
    } catch (error) {
      console.error('error', error);
      handleError(error);
    }
  }

  async set(id: string, data: C, options?: TransactionOptions): Promise<T> {
    try {
      const repo = this.getRepository(options);
      const entity = repo.create({ id, ...data });
      const newEntity = await repo.save(entity);
      return this.mapper(newEntity);
    } catch (error) {
      handleError(error);
    }
  }

  async update(id: string, data: Partial<U>, options?: QueryOneOptions<E>) {
    try {
      const repo = this.getRepository(options);
      const entity = await repo.findOneOrFail({
        ...options,
        where: {
          ...options?.where,
          id: id as any,
        },
      });
      const mergeEntity = repo.merge(entity, data as any as DeepPartial<E>);
      const savedEntity = await repo.save(mergeEntity);
      return this.mapper(savedEntity);
    } catch (error) {
      handleError(error);
    }
  }

  async delete(id: string, options?: QueryOneOptions<E>): Promise<void> {
    try {
      const repo = this.getRepository(options);
      const findOneOption: FindOptionsWhere<E> = {
        ...(options?.where as FindOptionsWhere<E>),
        id: id as any,
      };
      const result = await repo.delete(findOneOption);
      if (result.affected === 0) {
        throw new NotFoundException([
          {
            property: 'id',
            code: ErrorCodes.RESOURCE_NOT_FOUND,
          },
        ]);
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      handleError(error);
    }
  }

  async deleteBy(where: FindOptionsWhere<E>): Promise<void> {
    try {
      const repo = this.repository;
      const result = await repo.delete(where);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      handleError(error);
    }
  }

  async restore(id: string, options?: QueryOneOptions<E>): Promise<void> {
    try {
      const repo = this.getRepository(options);
      const result = await repo.restore({ id, ...options?.where } as any);
      if (result.affected === 0) {
        throw new NotFoundException([
          {
            property: 'id',
            code: ErrorCodes.RESOURCE_NOT_FOUND,
          },
        ]);
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      handleError(error);
    }
  }

  remove(id: string, options?: TransactionOptions) {
    return this.delete(id, options);
  }

  async softDelete(id: string, options?: QueryOneOptions<E>) {
    const repo = this.getRepository(options);
    const deleted = await repo.softDelete({ id, ...options?.where } as any);
    return deleted as any;
  }

  // add a mapper method to map the entity to the response object
  mapper(entity: E) {
    return entity as any as T;
  }

  private validateFilters(options: QueryOptions) {
    const filterableColumns = this.queryConfig.filterableColumns || {};
    const allowedFilters = Object.keys(filterableColumns);

    if (options.filter) {
      // Collect any invalid filters
      const invalidFilters = Object.keys(options.filter).filter(
        (filter) => !allowedFilters.includes(filter),
      );

      if (invalidFilters.length > 0) {
        throw new BadRequestException({
          message: `Invalid filter(s): ${invalidFilters.join(', ')}. Allowed filters are: ${allowedFilters.join(', ')}`,
          code: ErrorCodes.INVALID_FILTERS,
        });
      }

      // Optionally, validate operators for each filter
      for (const [field, filterValue] of Object.entries(options.filter)) {
        const allowedOperators = filterableColumns[field];
        if (allowedOperators && typeof filterValue === 'string') {
          let operator = '';
          const operatorMatch = filterValue.match(/^(.+):/);
          if (filterValue === '$null') {
            let operator = '$null';
          } else if (operatorMatch) {
            operator = operatorMatch[1].toLowerCase();
            if (!allowedOperators.some((op) => op.toLowerCase() === operator)) {
              throw new BadRequestException(
                `Invalid operator '${operator}' for filter '${field}'. Allowed operators are: ${allowedOperators
                  .map((op) => `${op}`)
                  .join(', ')}`,
              );
            }
          } else {
            throw new BadRequestException(
              `Invalid filter format for '${field}'. Expected format: $operator:value`,
            );
          }
        }
      }
    }
  }

  private validateSearch(options: QueryOptions) {
    const searchableColumns = this.queryConfig.searchableColumns || [];
    if (options.search && searchableColumns.length === 0) {
      throw new BadRequestException(
        `Search is not supported on this resource.`,
      );
    }
  }

  private validateSortBy(options: QueryOptions) {
    const sortableColumns: string[] = this.queryConfig.sortableColumns || [];

    if (options.sortBy) {
      const invalidSortColumns = [];
      // Check if sortBy is an array of tuples
      if (Array.isArray(options.sortBy)) {
        const invalidSortColumns = options.sortBy?.filter(
          ([column]) => !sortableColumns.includes(column),
        );
      } else if (typeof options.sortBy === 'string') {
        const invalidSortColumns = [options.sortBy];
      }

      if (invalidSortColumns.length > 0) {
        this.logger.warn(
          `Invalid sort columns attempted: ${invalidSortColumns.join(', ')}`,
        );
        throw new BadRequestException(
          `Invalid sort column(s): ${invalidSortColumns.join(', ')}. Allowed sort columns are: ${sortableColumns.join(', ')}`,
        );
      }
    }
  }

  async startTransaction(
    datasource: DataSource,
    isolationLevel?: IsolationLevel,
  ) {
    const queryRunner: QueryRunner = datasource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction(isolationLevel);
    return queryRunner;
  }

  private validateQuery = (options: QueryOptions) => {
    this.validateFilters(options);
    this.validateSearch(options);
    this.validateSortBy(options);
  };

  private getRepository(options: TransactionOptions) {
    return options?.manager
      ? options.manager.getRepository<E>(this.repository.metadata.target)
      : this.repository;
  }

  getQueryBuilder({
    alias,
    queryRunner,
  }: {
    alias?: string;
    queryRunner?: QueryRunner;
  } = {}) {
    return this.repository.createQueryBuilder(alias, queryRunner);
  }
}
