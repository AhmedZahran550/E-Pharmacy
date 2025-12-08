import { localizedQueryConfig } from '@/common/models/localized.name';
import {
  QueryConfig,
  QueryOneOptions,
  QueryOptions,
} from '@/common/query-options';
import { handleError } from '@/database/db.errors';
import { DBService } from '@/database/db.service';
import { Branch } from '@/database/entities/branch.entity';
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Optional,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FilterOperator, Paginated } from 'nestjs-paginate';
import {
  DataSource,
  FindOneOptions,
  In,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { AuthUserDto } from '../auth/dto/auth-user.dto';
import { BranchActionDto, BranchActionType } from './dto/action-branch.dto';
import { Cache } from 'cache-manager';
import { CacheService } from '@/common/cache.service';
import { format, getDay } from 'date-fns';

export const BRANCHES_PAGINATION_CONFIG: QueryConfig<Branch> = {
  sortableColumns: [...localizedQueryConfig.sortableColumns],
  filterableColumns: {
    ...localizedQueryConfig.filterableColumns,
    type: [FilterOperator.EQ],
    city: [FilterOperator.EQ],
    area: [FilterOperator.EQ],
    'provider.id': [FilterOperator.EQ],
    isActive: [FilterOperator.EQ],
  },
  searchableColumns: ['localizedName.en', 'localizedName.ar'],
  relations: ['provider', 'city', 'city.governorate'],
};
@Injectable()
export class BranchesService extends DBService<Branch, CreateBranchDto> {
  constructor(
    @InjectRepository(Branch)
    repository: Repository<Branch>,
    private cacheService: CacheService,
    private dataSource: DataSource,
  ) {
    super(repository, BRANCHES_PAGINATION_CONFIG); // 24 hours
  }
}
