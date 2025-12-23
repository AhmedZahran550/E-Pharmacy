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
import { EmployeesService } from '../employees/employees.service';

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
    private employeesService: EmployeesService,
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
        )
        // Add subquery to count online doctors
        .addSelect(
          (subQuery) =>
            subQuery
              .select('COUNT(*)', 'count')
              .from('employee', 'emp')
              .where('emp.branch_id = branch.id')
              .andWhere("emp.roles::text[] @> ARRAY['provider_doctor']")
              .andWhere("emp.type = 'provider'")
              .andWhere('emp.is_online = true')
              .andWhere('emp.disabled = false')
              .andWhere('emp.locked = false'),
          'onlineDoctorsCount',
        );

      // Apply search if provided (supports both English and Arabic with prefix matching)
      if (search) {
        // Use websearch_to_tsquery with wildcard for prefix matching
        const searchTerms = search
          .trim()
          .split(/\s+/)
          .map((term) => `${term}:*`)
          .join(' & ');
        queryBuilder = queryBuilder
          .andWhere(
            `(
            branch.searchVectorEn @@ to_tsquery('english', :searchQuery) OR 
            branch.searchVectorAr @@ to_tsquery('arabic', :searchQuery) OR
            provider.searchVectorEn @@ to_tsquery('english', :searchQuery) OR
            provider.searchVectorAr @@ to_tsquery('arabic', :searchQuery)
          )`,
            { searchQuery: searchTerms },
          )
          .addSelect(
            `GREATEST(
            ts_rank_cd(branch.searchVectorEn, to_tsquery('english', :searchQuery)),
            ts_rank_cd(branch.searchVectorAr, to_tsquery('arabic', :searchQuery)),
            ts_rank_cd(provider.searchVectorEn, to_tsquery('english', :searchQuery)),
            ts_rank_cd(provider.searchVectorAr, to_tsquery('arabic', :searchQuery))
          )`,
            'rank',
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

      // Order by relevance rank first if search is provided, then by distance
      if (search) {
        queryBuilder = queryBuilder
          .orderBy('rank', 'DESC')
          .addOrderBy('distance', 'ASC');
      } else {
        queryBuilder = queryBuilder.orderBy('distance', 'ASC');
      }

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
      // onlineDoctorsCount comes from the subquery in main query
      const data = result.entities.map((branch, index) => ({
        id: branch.id,
        localizedName: branch.localizedName,
        address: branch.address,
        longitude: branch.longitude,
        latitude: branch.latitude,
        distance: parseFloat(result.raw[index]?.distance || '0'),
        onlineDoctorsCount: parseInt(
          result.raw[index]?.onlineDoctorsCount || '0',
        ),
        doctorsCount: branch.doctorsCount || 0,
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

  async findById(id: string, options?: any): Promise<any> {
    try {
      // Use query builder with subquery for online doctors count
      const qb = this.repository
        .createQueryBuilder('branch')
        .where('branch.id = :id', { id })
        .addSelect(
          (subQuery) =>
            subQuery
              .select('COUNT(*)', 'count')
              .from('employee', 'emp')
              .where('emp.branch_id = branch.id')
              .andWhere("emp.roles::text[] @> ARRAY['provider_doctor']")
              .andWhere("emp.type = 'provider'")
              .andWhere('emp.is_online = true')
              .andWhere('emp.disabled = false')
              .andWhere('emp.locked = false'),
          'onlineDoctorsCount',
        );

      // Apply additional where conditions if provided
      if (options?.where) {
        Object.entries(options.where).forEach(([key, value]) => {
          if (key !== 'id') {
            qb.andWhere(`branch.${key} = :${key}`, { [key]: value });
          }
        });
      }

      const result = await qb.getRawAndEntities();

      if (result.entities.length === 0) {
        throw new Error('Entity not found');
      }

      const branch = result.entities[0];
      return {
        ...branch,
        onlineDoctorsCount: parseInt(result.raw[0]?.onlineDoctorsCount || '0'),
      };
    } catch (error) {
      handleError(error);
    }
  }

  async findAll(options: QueryOptions) {
    try {
      // Create query builder with subquery for online doctors count
      const qb = this.repository
        .createQueryBuilder('branch')
        .addSelect(
          (subQuery) =>
            subQuery
              .select('COUNT(*)', 'count')
              .from('employee', 'emp')
              .where('emp.branch_id = branch.id')
              .andWhere("emp.roles::text[] @> ARRAY['provider_doctor']")
              .andWhere("emp.type = 'provider'")
              .andWhere('emp.is_online = true')
              .andWhere('emp.disabled = false')
              .andWhere('emp.locked = false'),
          'onlineDoctorsCount',
        );

      const result = await paginate<Branch>(options, qb, this.queryConfig);

      // Map results to include the online count from raw
      if (result.data && Array.isArray(result.data)) {
        result.data = (result.data as any[]).map((item, index) => ({
          ...item,
          onlineDoctorsCount: parseInt(
            (result as any).raw?.[index]?.onlineDoctorsCount || '0',
          ),
        }));
      }

      return result;
    } catch (error) {
      this.logger.error('error', error);
      handleError(error);
    }
  }
}
