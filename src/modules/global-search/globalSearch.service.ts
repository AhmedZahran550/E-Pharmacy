import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { GlobalSearchDto } from './dto/global-search.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { SearchHistory } from '@/database/entities/search-history.entity';
import { AuthUserDto } from '../auth/dto/auth-user.dto';

export interface GlobalSearchResult {
  id: string;
  entity_type: string;
  provider_type: string | null;
  item_type: string | null;
  name_en: string;
  name_ar: string;
  address_en?: string;
  address_ar?: string;
  city_en?: string;
  city_ar?: string;
  rank: number;
  distance?: number; // Distance in meters, will be null if not applicable
}

@Injectable()
export class GlobalSearchService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(SearchHistory)
    private searchHistoryRepository: Repository<SearchHistory>,
  ) {}

  async search(query: GlobalSearchDto, user: AuthUserDto) {
    if (!query || query.search.trim() === '') {
      return [];
    }
    const processedQuery = query.search.trim().split(' ').join(' & ');
    let finalQuery: string;
    let params: any[];
    if (query.latitude && query.longitude) {
      // --- NEW Query to use WHEN LOCATION IS PROVIDED ---
      // This query prioritizes distance inside the ROW_NUMBER() function.
      finalQuery = `
        -- CTE 1: Find all text matches first and calculate their text rank.
        WITH search_matches AS (
          SELECT
            entity_id, entity_type, provider_type, title_en, title_ar, address_en, address_ar, location,city_ar,city_en,item_type,
            GREATEST(
              ts_rank(document_vector_en, to_tsquery('english', $1)),
              ts_rank(document_vector_ar, to_tsquery('arabic', $1))
            ) AS rank
          FROM global_search_view
          WHERE (document_vector_en @@ to_tsquery('english', $1) OR document_vector_ar @@ to_tsquery('arabic', $1))
        ),
        -- CTE 2: Calculate distance, then use it to rank rows within their partition (type).
        ranked_results AS (
          SELECT
            *,
             CASE
          WHEN location IS NOT NULL
          THEN ST_Distance(
            location,
            -- FIXED: Cast the parameters to a specific numeric type
            ST_SetSRID(ST_MakePoint($3::double precision, $4::double precision), 4326)::geography
          )
          ELSE NULL
            END AS distance ,
            -- The ROW_NUMBER is now ordered by distance first, then rank.
            ROW_NUMBER() OVER(
              PARTITION BY entity_type
              ORDER BY
                rank DESC ,-- Use text rank as a tie-breaker
                CASE
                  WHEN location IS NOT NULL THEN ST_Distance(location, ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography)
                  ELSE NULL
                END ASC NULLS LAST -- Prioritize by distance (closest first)
           
            ) AS type_rank
          FROM search_matches
        )
        -- Final selection from the ranked results.
        SELECT
          entity_id AS id,
          entity_type,
          provider_type ,
          title_en AS name_en,
          title_ar AS name_ar,
          address_en,
          address_ar,
          city_en,
          city_ar,
          item_type,
          rank,
          distance
        FROM ranked_results
        WHERE type_rank <= $2
        ORDER BY distance ASC NULLS LAST ,rank DESC; -- Final sort for display
      `;
      params = [
        processedQuery,
        query.limitPerType,
        query.longitude,
        query.latitude,
      ];
    } else {
      finalQuery = `
        WITH ranked_results AS (
          SELECT
            entity_id AS id, entity_type , provider_type ,
            title_en AS name_en, title_ar AS name_ar, address_en, address_ar,city_ar,city_en,item_type,
            GREATEST(
              ts_rank(document_vector_en, to_tsquery('english', $1)),
              ts_rank(document_vector_ar, to_tsquery('arabic', $1))
            ) AS rank,
            ROW_NUMBER() OVER(
              PARTITION BY entity_type
              ORDER BY GREATEST(
                ts_rank(document_vector_en, to_tsquery('english', $1)),
                ts_rank(document_vector_ar, to_tsquery('arabic', $1))
              ) DESC
            ) AS type_rank
          FROM global_search_view
          WHERE (document_vector_en @@ to_tsquery('english', $1) OR document_vector_ar @@ to_tsquery('arabic', $1)) AND (city_id IS NULL OR city_id = $2)
        )
        SELECT
          id, entity_type, provider_type, name_en, name_ar, address_en, address_ar, rank,city_ar,city_en,item_type,
          NULL AS distance
        FROM ranked_results
        WHERE type_rank <= $3
        ORDER BY rank DESC ,entity_type ASC;
      `;
      params = [processedQuery, query.cityId, query.limitPerType];
    }
    const results = await this.dataSource.query(finalQuery, params);
    // Save search history only if results are found
    if (results && results.length > 0) {
      this.saveSearchHistory(query.search.trim(), user.id);
    }
    return this.mapper(results);
  }

  private async saveSearchHistory(
    query: string,
    userId: string,
  ): Promise<void> {
    const newSearch = this.searchHistoryRepository.create({
      query,
      user: { id: userId },
    });
    await this.searchHistoryRepository.save(newSearch);
  }

  async getUserSearchHistory(userId: string): Promise<string[]> {
    const results = await this.searchHistoryRepository
      .createQueryBuilder('search_history')
      .select('search_history.query', 'query')
      .where('search_history.userId = :userId', { userId })
      .groupBy('search_history.query')
      .orderBy('MAX(search_history.createdAt)', 'DESC')
      .limit(10)
      .getRawMany();

    return results.map((r) => r.query);
  }

  async getMostSearchedWords(): Promise<{ word: string; count: string }[]> {
    const query = `
      SELECT
        query,
        COUNT(DISTINCT user_id) as count
        FROM search_history
      WHERE query != ''
      GROUP BY query
      HAVING COUNT(DISTINCT user_id) >= 2
      ORDER BY count DESC
      LIMIT 10;
    `;
    return this.dataSource.query(query);
  }

  private mapper(results: GlobalSearchResult[]) {
    return results.map((result) => ({
      id: result.id,
      type: result.entity_type,
      providerType: result.provider_type,
      itemType: result.item_type,
      city_ar: result.city_ar,
      city_en: result.city_en,
      localizedName: {
        en: result.name_en,
        ar: result.name_ar,
      },
      localizedAddress: {
        en: result.address_en,
        ar: result.address_ar,
      },
      rank: result.rank,
      distance: result.distance,
    }));
  }
}
