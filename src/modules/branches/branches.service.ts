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
import { NearByBranchDto, SortBy } from './dto/NearBy-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { AuthUserDto } from '../auth/dto/auth-user.dto';
import { ErrorCodes } from '@/common/error-codes';
import { BranchActionDto, BranchActionType } from './dto/action-branch.dto';
import { Cache } from 'cache-manager';
import { CacheService } from '@/common/cache.service';
import { format, getDay } from 'date-fns';
import { Order, OrderStatus } from '@/database/entities/order.entity';
import { BranchRating } from '@/database/entities/branch-rating.entity';
import { ItemRating } from '@/database/entities/item-rating.entity';
import { BranchRatingDto } from './dto/branch-rating.dto';

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
  getTotal(options?: FindOneOptions<Branch>) {
    return this.repository.count({
      ...options,
      where: {
        isActive: true,
        ...options?.where,
      },
    });
  }
  countActiveBranches() {
    return this.repository.count({
      where: {
        isActive: true,
      },
    });
  }

  async countActiveBranchesByType() {
    const result = await this.repository
      .createQueryBuilder('branch')
      .innerJoin('branch.provider', 'provider')
      .innerJoin('provider.type', 'type')
      .select('type.name_en', 'type_name_en')
      .addSelect('COUNT(branch.id)', 'count')
      .where('branch.isActive = :isActive', { isActive: true })
      .andWhere('provider.isActive = :isActive', { isActive: true })
      .groupBy('type.name_en')
      .getRawMany();

    return result as { type: string; count: string }[];
  }

  // override the update method
  async update(
    id: string,
    data: UpdateBranchDto,
    options?: FindOneOptions<Branch>,
  ) {
    const branch = await this.repository.findOneOrFail({
      ...options,
      where: {
        id: id as any,
        ...options?.where,
      },
    });
    const mergedBranch = this.repository.merge(branch, data);
    mergedBranch.location = {
      type: 'Point',
      coordinates: [branch.longitude, branch.latitude],
    };
    return super.update(id, mergedBranch);
  }

  async findNearby(dto: NearByBranchDto) {
    const { lat: roundedLat, lon: roundedLon } = this.roundCoordinates(
      dto.latitude,
      dto.longitude,
      4,
    );
    const cacheKey = this.cacheService.generateKey(
      'branch:nearby',
      `${roundedLat}:${roundedLon}:${dto.radius}:page:${dto.page || 0}:limit:${dto.limit || 10}:type:${dto.type || 'all'}:speciality:${dto.specialityId || 'none'}:services:${dto.serviceIds ? dto.serviceIds.join(',') : 'none'}:search:${dto.search || 'none'}:city:${dto.cityId || 'none'}:area:${dto.areaId || 'none'}:sortBy:${dto.sortBy || 'none'}:sortOrder:${dto.sortOrder || 'none'}:availabilityStatus:${dto.availabilityStatus || 'none'}`,
    );
    // if (!dto.disableCache) {
    //   const cachedResult = await this.cacheService.get(cacheKey);
    //   if (cachedResult) {
    //     console.log('Cache hit for nearby branches:', cacheKey);
    //     return cachedResult;
    //   }
    // }

    // Spatial filtering parameters
    const spatialParams = {
      longitude: dto.longitude,
      latitude: dto.latitude,
      radius: dto.radius,
    };
    const currentTime = format(new Date(), 'HH:mm:ss');
    const currentDay = format(new Date(), 'EEEE').toLowerCase();
    // Build a subquery to limit branches within the radius using the spatial index.
    const spatialSubQuery = this.repository
      .createQueryBuilder('b')
      .select('b.id')
      .where(
        `ST_DWithin(b.location::geography, ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography, :radius)`,
        spatialParams,
      );

    // Start building the main query
    const qb = this.repository
      .createQueryBuilder('branch')
      // Mandatory joins
      .innerJoin('branch.provider', 'provider', 'provider.isActive = true')
      .innerJoin('branch.city', 'city')
      .innerJoin('city.governorate', 'governorate')
      .innerJoin('provider.type', 'provider_type')
      // Use a LEFT JOIN to get all availability records for each branch
      .leftJoin('branch.availability', 'availability')
      .where('branch.isActive = true');
    if (spatialParams.longitude && spatialParams.latitude) {
      // Apply spatial filtering via the subquery
      qb.andWhere(`branch.id IN (${spatialSubQuery.getQuery()})`).setParameters(
        spatialParams,
      );
    }
    // Select required fields (ensure these match your entity columns)
    qb.select([
      'branch.id AS branch_id',
      'branch.longitude AS longitude',
      'branch.latitude AS latitude',
      'branch.name_en AS branch_name_en',
      'branch.name_ar AS branch_name_ar',
      'provider.id AS provider_id',
      'provider.name_en AS provider_name_en',
      'provider.name_ar AS provider_name_ar',
      'provider_type.code AS provider_type_code',
      'city.name_en AS city_name_en',
      'city.name_ar AS city_name_ar',
    ]).addSelect(
      `JSON_AGG(
          DISTINCT
          CASE WHEN availability.id IS NOT NULL 
          THEN JSON_BUILD_OBJECT(
            'id', availability.id,
            'dayOfWeek', availability.day_of_week,
            'openingTime', availability.opening_time,
            'closingTime', availability.closing_time,
            'is24Hours', availability.is24_hours
          )::jsonb
          ELSE NULL END
        ) FILTER (WHERE availability.id IS NOT NULL)`,
      'availability_data',
    );
    if (spatialParams.longitude && spatialParams.latitude) {
      qb.addSelect(
        `ST_Distance(branch.location::geography, ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography)`,
        'distance',
      ).setParameters(spatialParams);
    }

    // Conditionally join the speciality/service chain if needed
    if (dto.specialityId || (dto.serviceIds && dto.serviceIds.length > 0)) {
      if (dto.specialityId && dto.type.toUpperCase() === 'CLINIC') {
        qb.innerJoin('provider.providerSpecialities', 'pspec').innerJoin(
          'pspec.speciality',
          'sp',
        );
        qb.andWhere('sp.id = :specialityId', {
          specialityId: dto.specialityId,
        });
      } else {
        qb.innerJoin('provider.providerSections', 'psec')
          .innerJoin('psec.section', 'sec')
          .innerJoin('sec.sectionSpecialities', 'secs')
          .innerJoin('secs.speciality', 'sp');
      }

      if (dto.serviceIds && dto.serviceIds.length > 0) {
        qb.addSelect((subQuery) => {
          // This subquery calculates the SUM, isolated from the outer query's joins
          const priceSubQuery = subQuery
            .select('SUM(COALESCE(pi.selling_price, item_sub.price))')
            .from('provider', 'p_sub') // Start from provider
            .innerJoin('p_sub.providerSections', 'psec_sub')
            .innerJoin('psec_sub.section', 'sec_sub')
            .innerJoin('sec_sub.sectionSpecialities', 'secs_sub')
            .innerJoin('secs_sub.speciality', 'sp_sub')
            .innerJoin('sp_sub.specialityItems', 'spi_sub')
            .innerJoin('spi_sub.item', 'item_sub')
            .leftJoin(
              'item_sub.providerItems',
              'pi',
              'pi.item_id = item_sub.id AND pi.provider_id = p_sub.id',
            )
            .where('p_sub.id = provider.id') // <-- This links it to the main query's provider
            .andWhere('item_sub.id IN (:...serviceIds)', {
              serviceIds: dto.serviceIds,
            });

          // This handles your 'CLINIC' vs. other logic
          if (dto.type.toUpperCase() === 'CLINIC') {
            priceSubQuery
              .from('provider', 'p_sub') // Start from provider
              .innerJoin('p_sub.providerSpecialities', 'pspec_sub')
              .innerJoin('pspec_sub.speciality', 'sp_sub')
              .innerJoin('sp_sub.specialityItems', 'spi_sub')
              .innerJoin('spi_sub.item', 'item_sub')
              .leftJoin(
                'item_sub.providerItems',
                'pi',
                'pi.item_id = item_sub.id AND pi.provider_id = p_sub.id',
              )
              .where('p_sub.id = provider.id')
              .andWhere('sp_sub.id = :specialityId', {
                specialityId: dto.specialityId,
              })
              .andWhere('item_sub.id IN (:...serviceIds)', {
                serviceIds: dto.serviceIds,
              });
          }

          return priceSubQuery;
        }, 'total_price');
      }
    }

    // Sorting
    if (dto.sortBy === SortBy.total_price) {
      if (!dto.serviceIds || dto.serviceIds.length === 0) {
        throw new HttpException(
          'Service IDs should not be provided when sorting by total price',
          HttpStatus.BAD_REQUEST,
        );
      }
      qb.addOrderBy('total_price', dto.sortOrder);
    } else if (dto.sortBy === SortBy.name_ar) {
      // Calculate distance using the spatial function
      qb.addOrderBy('branch.name_ar', dto.sortOrder);
    } else if (dto.sortBy === SortBy.name_en) {
      // Calculate distance using the spatial function
      qb.addOrderBy('branch.name_en', dto.sortOrder);
    } else {
      // Calculate distance using the spatial function
      qb.addOrderBy('distance', dto.sortOrder);
    }

    // Grouping (necessary for aggregations)
    qb.groupBy('branch.id')
      .addGroupBy('city.id')
      .addGroupBy('provider_type.code')
      .addGroupBy('provider.id')
      .addGroupBy('provider.name_en')
      .addGroupBy('provider.name_ar')
      .addGroupBy('branch.longitude')
      .addGroupBy('branch.latitude')
      .addGroupBy('branch.name_en')
      .addGroupBy('branch.name_ar')
      .addGroupBy('city.name_en')
      .addGroupBy('city.name_ar');

    // Additional filters
    if (dto.availabilityStatus) {
      qb.having(
        `CASE 
        WHEN COUNT(availability.id) = 0 THEN NULL
        WHEN COUNT(CASE WHEN availability.day_of_week = '${currentDay}' 
                   AND '${currentTime}' BETWEEN availability.opening_time AND availability.closing_time 
                   THEN 1 END) > 0 THEN 'OPENED'
        WHEN COUNT(CASE WHEN availability.day_of_week = '${currentDay}' THEN 1 END) > 0 THEN 'CLOSED'
        ELSE NULL END = :availabilityStatus`,
        {
          availabilityStatus: dto.availabilityStatus.toUpperCase(),
        },
      );
    }
    if (dto.providerId) {
      qb.andWhere('provider.id = :providerId', { providerId: dto.providerId });
    }
    if (dto.type) {
      qb.andWhere('provider_type.code = :type', {
        type: dto.type.toUpperCase(),
      });
    }
    if (dto.cityId) {
      qb.andWhere('governorate.id = :governorateId', {
        governorateId: dto.cityId,
      });
    }
    if (dto.areaId) {
      qb.andWhere('city.id = :cityId', {
        cityId: dto.areaId,
      });
    }
    if (dto.search) {
      const searchTerms = dto.search
        .trim()
        .split(/\s+/)
        .map((term) => `${term}:*`)
        .join(' & ');

      qb.andWhere(
        `(
      branch.search_vector @@ to_tsquery('english', :searchQuery) OR
      provider.search_vector @@ to_tsquery('english', :searchQuery) OR
      city.search_vector @@ to_tsquery('english', :searchQuery) OR
      governorate.search_vector @@ to_tsquery('english', :searchQuery)
    )`,
        { searchQuery: searchTerms },
      );
    }

    // Get total count before applying pagination
    const totalQuery = qb.clone();
    const totalItems = await totalQuery.getCount();

    // Calculate pagination
    const page = dto.page && dto.page > 0 ? dto.page - 1 : 0;
    const limit = dto.limit ?? 100;
    const offset = page * limit;

    // Apply pagination: limit and offset
    qb.limit(limit).offset(offset);

    // Execute the query
    const rawResults = await qb.getRawMany();
    // Map the raw results into your desired DTO shape
    const branches = rawResults.map((row) => {
      const branch = new Branch();
      branch.id = row.branch_id;
      branch.localizedName = {
        en: row.branch_name_en,
        ar: row.branch_name_ar,
      };
      branch.longitude = row.longitude;
      branch.latitude = row.latitude;
      branch.distance = parseFloat(row.distance);

      branch.provider = {
        id: row.provider_id,
        localizedName: {
          en: row.provider_name_en,
          ar: row.provider_name_ar,
        },
        type: row.provider_type_code,
      };

      branch.city = {
        localizedName: {
          en: row.city_name_en,
          ar: row.city_name_ar,
        },
      };
      // Parse the aggregated availability data
      branch.availability = row.availability_data || [];
      (branch as any).availabilityStatus = row.current_status;
      // Attach the total services price if aggregated
      if (row.total_price) {
        (branch as any).totalServicesPrice = Number(row.total_price);
      }

      return branch;
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalItems / limit);

    const result = {
      data: branches,
      meta: {
        totalItems,
        itemCount: branches.length,
        itemsPerPage: limit,
        totalPages,
        currentPage: page,
      },
    };
    await this.cacheService.set(cacheKey, result as any, 60 * 60); // Cache for 3600 s (1 h)
    return result;
  }
  async findByProviderId(providerId: string, options: QueryOptions) {
    const qb = this.repository
      .createQueryBuilder('branch')
      .where('branch.provider_id = :providerId', { providerId });
    return await this.findAll(options, qb);
  }

  async findById(id: string, options?: QueryOneOptions<Branch>) {
    try {
      return await this.repository
        .createQueryBuilder('branch')
        .leftJoinAndSelect('branch.provider', 'provider')
        .leftJoinAndSelect('provider.type', 'type')
        .leftJoinAndSelect('branch.availability', 'availability')
        .where('branch.id = :id', { id })
        .getOneOrFail();
    } catch (error) {
      handleError(error);
    }
  }

  async handleAction(
    branchId: string,
    action: BranchActionDto,
    authUser: AuthUserDto,
  ) {
    const options: QueryOneOptions<Branch> = {
      where: {
        id: branchId,
        provider: { id: authUser.providerId },
      },
    };
    switch (action.type) {
      case BranchActionType.SOFT_DELETE:
        return await this.softDelete(branchId, options);
      case BranchActionType.ACTIVE:
        return await super.update(branchId, { isActive: true }, options);
      case BranchActionType.INACTIVE:
        return await super.update(branchId, { isActive: false }, options);
      case BranchActionType.RESTORE:
        return await this.restore(branchId, options);
      default:
        throw new BadRequestException({
          message: `Invalid action ${action.type}`,
          code: ErrorCodes.INVALID_ACTION,
        });
    }
  }
  roundCoordinates(lat: number, lon: number, decimals = 3) {
    const factor = Math.pow(10, decimals);
    return {
      lat: Math.round(lat * factor) / factor,
      lon: Math.round(lon * factor) / factor,
    };
  }

  async branchRating(ratingDto: BranchRatingDto, user: AuthUserDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      let order: Order;
      if (ratingDto.order?.id) {
        // Fetch the order with both branch and provider relations.
        order = await queryRunner.manager.findOneOrFail(Order, {
          where: {
            id: ratingDto?.order?.id,
            status: In([OrderStatus.COMPLETED, OrderStatus.CONFIRMED]),
          },
          relations: ['branch', 'branch.provider'],
        });
      }
      // This is the logic for a brand new rating
      const newRating = queryRunner.manager.create(BranchRating, {
        user: { id: user.id },
        branch: { id: ratingDto.branch.id },
        order: { id: order?.id },
        rating: ratingDto.rating,
        notes: ratingDto.notes,
        metadata: { createdBy: user.id },
      });
      const branchRating = await queryRunner.manager.upsert(
        BranchRating,
        newRating,
        { conflictPaths: ['branch', 'user', 'order'] },
      );
      if (ratingDto.itemsRating?.length > 0 && order) {
        const itemsRatings = ratingDto.itemsRating.map((itemRating) => {
          const newItemRating = queryRunner.manager.create(ItemRating, {
            branchRating: { id: branchRating.identifiers[0].id },
            item: { id: itemRating.itemId },
            rating: itemRating.rating,
          });
          return newItemRating;
        });
        await queryRunner.manager.upsert(ItemRating, itemsRatings, {
          conflictPaths: ['branchRating', 'item'],
        });
      }
      await queryRunner.commitTransaction();
      return newRating;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
