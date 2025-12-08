-- Migration script to create initial database schema and indexes
-- below for full text search capabilities
CREATE INDEX IF NOT EXISTS idx_provider_search_vector 
ON providers 
USING GIN(search_vector);

CREATE INDEX IF NOT EXISTS idx_branch_search_vector 
ON branch 
USING GIN(search_vector);

CREATE INDEX IF NOT EXISTS idx_city_search_vector 
ON city
USING GIN(search_vector);

CREATE INDEX IF NOT EXISTS idx_governorate_search_vector 
ON governorate
USING GIN(search_vector);
---------------------------------------------------------------------------------------------------------------------------------------------------------------
