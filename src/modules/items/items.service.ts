import { QueryConfig, QueryOptions } from '@/common/query-options';
import { handleError } from '@/database/db.errors';
import { DBService } from '@/database/db.service';
import { Item } from '@/database/entities/item.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FilterOperator } from 'nestjs-paginate';
import { Repository } from 'typeorm';
import { CreateServiceDto } from './dto/create-item.dto';

export const ITEMS_PAGINATION_CONFIG: QueryConfig<Item> = {
  sortableColumns: [
    'metadata.createdAt',
    'localizedName.ar',
    'localizedName.en',
  ],
  filterableColumns: {
    type: [FilterOperator.EQ],
    id: [FilterOperator.EQ, FilterOperator.IN],
    isActive: [FilterOperator.EQ],
    isPriceEditable: [FilterOperator.EQ],
  },
  searchableColumns: ['localizedName.ar', 'localizedName.en'],
};
@Injectable()
export class ItemsService extends DBService<Item, CreateServiceDto> {
  constructor(
    @InjectRepository(Item)
    repository: Repository<Item>,
  ) {
    super(repository, ITEMS_PAGINATION_CONFIG);
  }

  findBySection(query: QueryOptions, sectionId: string) {
    const qb = this.repository
      .createQueryBuilder('item')
      .innerJoin('item.specialityItems', 'specialityItem')
      .innerJoin('specialityItem.speciality', 'speciality')
      .innerJoin('speciality.sectionSpecialities', 'sectionSpeciality')
      .innerJoin('sectionSpeciality.section', 'section')
      .where('section.id = :sectionId', { sectionId });
    return this.findAll(query, qb);
  }

  async findBranchItems(
    branchId: string,
    sectionId?: string,
    query?: QueryOptions,
  ) {
    try {
      const qb = this.repository
        .createQueryBuilder('item')
        .innerJoin('item.specialityItems', 'si')
        .innerJoin('si.speciality', 'sp')
        .innerJoin('sp.sectionSpecialities', 'ss')
        .innerJoin('ss.section', 'sec')
        .innerJoin('sec.providerSections', 'ps')
        .innerJoin('ps.provider', 'p')
        .innerJoin('p.branches', 'b')
        // This LEFT JOIN is crucial for getting the correct price (either provider-specific or default)
        .leftJoin(
          'item.providerItems',
          'pi',
          'pi.item_id = item.id AND pi.provider_id = p.id',
        )
        .leftJoin(
          'branch_item', // The name of your disabling/blacklist table
          'disabledItem', // Alias for the joined table
          // Join condition: match the provider item AND the specific branch.
          'disabledItem.provider_item_id = pi.id AND disabledItem.branch_id = :branchId',
        )
        .addSelect(
          'CAST(COALESCE(pi.sellingPrice, item.price) AS float)',
          'item_price',
        )
        // Base filters
        .where('b.id = :branchId', { branchId })
        // The exclusion filter: only include rows where no match was found in the blacklist table.
        // If `disabledItem.id` is NULL, it means the item is NOT disabled for this branch.
        .andWhere('disabledItem.id IS NULL')
        .andWhere('item.isActive = :isActive')
        .andWhere('si.isActive = :isActive')
        .andWhere('sp.isActive = :isActive')
        .andWhere('b.isActive = :isActive')
        .andWhere('ss.isActive = :isActive')
        .andWhere('sec.isActive = :isActive')
        .andWhere('ps.isActive = :isActive')
        .andWhere('p.isActive = :isActive')
        .setParameters({
          isActive: true,
        });
      if (sectionId) {
        qb.andWhere('sec.id = :sectionId', { sectionId });
      }

      // The super.findAll method will execute the fully constructed query
      const result = await super.findAll(query, qb);
      return result;
    } catch (error) {
      handleError(error);
    }
  }

  findByType(query: QueryOptions, type?: string) {
    const qb = this.repository
      .createQueryBuilder('item')
      .innerJoin('item.specialityItems', 'si')
      .innerJoin('si.speciality', 'sp')
      .innerJoin('sp.sectionSpecialities', 'ss')
      .innerJoin('ss.section', 'sec')
      .innerJoin('sec.providerTypeSections', 'pts')
      .innerJoin('pts.providerType', 'pt');
    if (type) {
      qb.where('pt.code = :type', { type });
    }
    return this.findAll(query, qb);
  }

  async findProviderItems(providerId: string, query?: QueryOptions) {
    const qb = this.repository
      .createQueryBuilder('item')
      .innerJoin('item.providerItems', 'pi')
      .innerJoin('pi.provider', 'p')
      .addSelect(
        'CAST(COALESCE(pi.sellingPrice, item.price) AS float)',
        'price',
      )
      .where('p.id = :providerId', { providerId })
      .andWhere('pi.isActive = :isActive', { isActive: true })
      .andWhere('item.isActive = :isActive', { isActive: true });
    return this.findAll(query, qb);
  }
  async findOfferItems(offerId: string, query?: QueryOptions) {
    const qb = this.repository
      .createQueryBuilder('item')
      .innerJoin('item.offerItems', 'oi')
      .innerJoin('oi.offer', 'o')
      .where('o.id = :offerId', { offerId })
      .andWhere('o.isActive = :isActive', { isActive: true })
      .andWhere('item.isActive = :isActive', { isActive: true });
    return this.findAll(query, qb);
  }
  async findProviderItem(id: string, providerId: string) {
    const qb = this.repository
      .createQueryBuilder('item')
      .innerJoin('item.providerItems', 'pi')
      .innerJoin('pi.provider', 'p')
      .addSelect(
        'CAST(COALESCE(pi.sellingPrice, item.price) AS float)',
        'price',
      )
      .where('item.id = :id', { id })
      .andWhere('p.id = :providerId', { providerId })
      .andWhere('pi.isActive = :isActive', { isActive: true })
      .andWhere('item.isActive = :isActive', { isActive: true });
    return await qb.getOneOrFail();
  }
}
