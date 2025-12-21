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
import { FilterOperator, paginate } from 'nestjs-paginate';
import { DataSource, Repository } from 'typeorm';
import { CreateBranchDto } from './dto/create-branch.dto';
import { CacheService } from '@/common/cache.service';
import { NearbyBranchesDto } from './dto/nearby-branches.dto';

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
    private dataSource: DataSource,
  ) {
    super(repository, BRANCHES_PAGINATION_CONFIG); // 24 hours
  }

  async findNearby(params: NearbyBranchesDto) {
    try {
      const { lat, lng, radius = 10, page, limit, search, filter } = params;

      // Convert km to meters for PostGIS
      const radiusMeters = radius * 1000;
      // Build base query - load entities fully, then filter in response
      let queryBuilder = this.repository
        .createQueryBuilder('branch')
        .leftJoinAndSelect('branch.provider', 'provider')
        .leftJoinAndSelect('branch.city', 'city')
        .where('branch.isActive = :isActive', { isActive: true })
        .andWhere(
          `ST_DWithin(
            branch.location,
            ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
            :radius
          )`,
          { lat, lng, radius: radiusMeters },
        )
        .addSelect(
          `ST_Distance(
            branch.location,
            ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography
          ) / 1000`,
          'distance',
        );

      // Apply search if provided
      if (search) {
        queryBuilder = queryBuilder.andWhere(
          `(branch.localizedName->>'en' ILIKE :search OR branch.localizedName->>'ar' ILIKE :search)`,
          { search: `%${search}%` },
        );
      }

      // Apply filters if provided
      if (filter) {
        Object.entries(filter).forEach(([key, value]) => {
          if (key === 'city') {
            queryBuilder = queryBuilder.andWhere(`city.id = :cityId`, {
              cityId: value,
            });
          } else if (key === 'provider.id') {
            queryBuilder = queryBuilder.andWhere(`provider.id = :providerId`, {
              providerId: value,
            });
          }
        });
      }

      // Always order by distance first
      queryBuilder = queryBuilder.orderBy('distance', 'ASC');

      // Get pagination params
      const currentPage = page || 1;
      const itemsPerPage = Math.min(limit || 20, 100);
      const skip = (currentPage - 1) * itemsPerPage;

      // Get total count
      const total = await queryBuilder.getCount();

      // Apply pagination and execute
      queryBuilder = queryBuilder.skip(skip).take(itemsPerPage);
      const result = await queryBuilder.getRawAndEntities();

      // Map to clean response structure with only needed fields
      const data = result.entities.map((branch, index) => ({
        id: branch.id,
        localizedName: branch.localizedName,
        longitude: branch.longitude,
        latitude: branch.latitude,
        distance: parseFloat(result.raw[index]?.distance || '0'),
        provider: {
          id: branch.provider.id,
          localizedName: (branch.provider as any).localizedName,
          type: (branch.provider as any).type,
        },
        city: {
          localizedName: (branch.city as any).localizedName,
        },
      }));

      // Return with nestjs-paginate compatible format
      return {
        data,
        meta: {
          itemsPerPage,
          totalItems: total,
          currentPage,
          totalPages: Math.ceil(total / itemsPerPage),
        },
      };
    } catch (error) {
      this.logger.error('error finding nearby branches', error);
      handleError(error);
    }
  }
}
