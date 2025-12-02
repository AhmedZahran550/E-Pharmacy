import { QueryConfig } from '@/common/query-options';
import { generateRandomDigitNumber } from '@/common/random-number.util';
import { DBService } from '@/database/db.service';
import { User } from '@/database/entities/user.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FilterOperator, FilterSuffix } from 'nestjs-paginate';
import { DataSource, Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { v4 as uuidv4 } from 'uuid';

export const USER_PAGINATION_CONFIG: QueryConfig<User> = {
  sortableColumns: ['email', 'firstName', 'lastName', 'mobile', 'code'],
  filterableColumns: {
    email: [FilterOperator.ILIKE],
    id: [FilterOperator.EQ],
    firstName: [FilterOperator.ILIKE],
    lastName: [FilterOperator.ILIKE],
    type: [FilterOperator.EQ],
    mobile: [FilterOperator.EQ],
    locked: [FilterOperator.EQ],
    disabled: [FilterOperator.EQ],
    staffId: [FilterOperator.NULL, FilterOperator.EQ, FilterSuffix.NOT],
    nid: [FilterOperator.EQ],
    gender: [FilterOperator.EQ],
    familyId: [FilterOperator.EQ],
    mobileVerified: [FilterOperator.EQ],
    isPrincipal: [FilterOperator.EQ],
    'subscriptions.endDate': [
      FilterOperator.GTE,
      FilterOperator.LTE,
      FilterOperator.EQ,
    ],
    'subscriptions.startDate': [
      FilterOperator.GTE,
      FilterOperator.LTE,
      FilterOperator.EQ,
    ],
  },
  searchableColumns: ['mobile', 'code'],
  defaultSortBy: [['metadata.createdAt', 'DESC']],
  loadEagerRelations: false,
};

@Injectable()
export class UsersService extends DBService<
  User,
  CreateUserDto,
  UpdateUserDto
> {
  constructor(
    @InjectRepository(User)
    public repository: Repository<User>,
    private dataSource: DataSource,
  ) {
    super(repository, USER_PAGINATION_CONFIG);
  }

  generateCode() {
    return generateRandomDigitNumber(1000000000, 9999999999);
  }

  mapper(user: User) {
    return user;
  }

  generateFamilyId() {
    return uuidv4();
  }
}
