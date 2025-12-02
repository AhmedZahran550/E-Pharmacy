import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FilterOperator } from 'nestjs-paginate';
import { Repository } from 'typeorm';
import { QueryConfig } from '../../common/query-options';
import { DBService } from '../../database/db.service';
import { ActivityLog } from '../../database/entities/activity-log.entity';

const logQueryConfig: QueryConfig<ActivityLog> = {
  relations: ['user'],
  sortableColumns: ['createdAt'],
  searchableColumns: ['resource', 'statusCode'],
  defaultSortBy: [['createdAt', 'DESC']],
  filterableColumns: {
    createdAt: [FilterOperator.EQ, FilterOperator.GTE, FilterOperator.LTE],
    resource: [FilterOperator.EQ, FilterOperator.ILIKE],
    'metadata.resource': [FilterOperator.EQ, FilterOperator.ILIKE],
    statusCode: [FilterOperator.EQ],
    userId: [FilterOperator.EQ],
    'user.email': [FilterOperator.EQ, FilterOperator.ILIKE],
    requestTimeInMillis: [FilterOperator.GTE, FilterOperator.LTE],
  },
};

@Injectable()
export class LogsService extends DBService<ActivityLog> {
  constructor(
    @InjectRepository(ActivityLog)
    protected readonly repository: Repository<ActivityLog>,
  ) {
    super(repository, logQueryConfig);
  }

  // // override findall to include relations
  // async findAll(options: QueryOptions): Promise<any> {
  //   const query = this.repository.createQueryBuilder('log');
  //   query.leftJoinAndMapOne('log.user', User, 'user', 'log.userId = user.id');
  //   const resp = await paginate<Log>(options, query, this.queryConfig);
  //   return resp;
  // }

  async log(log: ActivityLog): Promise<void> {
    try {
      const activityLog = this.repository.create(log);
      await this.repository.save(activityLog);
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  }

  async logAsync(log: ActivityLog): Promise<void> {
    const activityLog = this.repository.create(log);
    // console.log('Logging activity:', log);
    // Perform the save operation asynchronously
    this.repository.save(activityLog).catch((error) => {
      console.error('Error logging activity:', error);
    });
  }
}
