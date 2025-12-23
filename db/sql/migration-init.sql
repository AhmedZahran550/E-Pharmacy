-- Migration script to create initial database schema and indexes
-- below for full text search capabilities
-- Create separate English and Arabic search vector indexes for provider
CREATE INDEX IF NOT EXISTS idx_provider_search_vector_en 
ON provider 
USING GIN(search_vector_en);

CREATE INDEX IF NOT EXISTS idx_provider_search_vector_ar 
ON provider 
USING GIN(search_vector_ar);

-- Create separate English and Arabic search vector indexes for branch
CREATE INDEX IF NOT EXISTS idx_branch_search_vector_en 
ON branch 
USING GIN(search_vector_en);

CREATE INDEX IF NOT EXISTS idx_branch_search_vector_ar 
ON branch 
USING GIN(search_vector_ar);

CREATE INDEX IF NOT EXISTS idx_city_search_vector 
ON city
USING GIN(search_vector);

CREATE INDEX IF NOT EXISTS idx_governorate_search_vector 
ON governorate
USING GIN(search_vector);
---------------------------------------------------------------------------------------------------------------------------------------------------------------
