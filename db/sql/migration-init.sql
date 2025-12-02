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
-- calc fun to get the avg and the count of the branch rating 
CREATE OR REPLACE FUNCTION update_branch_average_rating_and_count()
RETURNS TRIGGER AS $$
DECLARE
    -- branch_id_to_update should be UUID if your primary keys are UUIDs
    branch_id_to_update UUID;
BEGIN
    -- Determine which branch ID to update based on the operation type
    IF TG_OP = 'DELETE' THEN
        -- For DELETE, use the branch_id from the old (deleted) row
        -- Assuming foreign key column is named "branch_id" (snake_case)
        branch_id_to_update := OLD.branch_id;
    ELSE
        -- For INSERT or UPDATE, use the branch_id from the new (inserted/updated) row
        -- Assuming foreign key column is named "branch_id" (snake_case)
        branch_id_to_update := NEW.branch_id;
    END IF;

    -- Update both averageRating and ratingCount in the branch table
    UPDATE "branch"
    SET
        "average_rating" = (
            SELECT COALESCE(AVG(rating), 0)
            FROM "branch_rating"
            -- Assuming foreign key column in branch_rating is "branch_id" (snake_case)
            WHERE branch_id = branch_id_to_update
        ),
        "rating_count" = (
            SELECT COUNT(id) -- Count all ratings for this branch
            FROM "branch_rating"
            -- Assuming foreign key column in branch_rating is "branch_id" (snake_case)
            WHERE branch_id = branch_id_to_update
        )
    WHERE "id" = branch_id_to_update;

    RETURN NULL; -- Important for AFTER triggers that don't modify the row being operated on
END;
$$ LANGUAGE plpgsql;

-- trigger update the avg of the branch rating
CREATE OR REPLACE TRIGGER branch_rating_after_change
AFTER INSERT OR UPDATE OR DELETE ON "branch_rating"
FOR EACH ROW
EXECUTE FUNCTION update_branch_average_rating_and_count();
---------------------------------------------------------------------------------------------------------------------------------------------------------------
---------------------------------------------------------------------------------------------------------------------------------------------------------------
-- Migration script to create or update the global search materialized view to include items and  branches with dynamic entity types based on their parent provider's type

-- Drop the view if it already exists to start fresh
DROP MATERIALIZED VIEW IF EXISTS global_search_view;

-- Create the updated materialized view
CREATE MATERIALIZED VIEW global_search_view AS

-- Section for the 'item' entity (remains the same)
SELECT
    i.id AS entity_id,
    'item' AS entity_type, -- Items have a static type
    NULL AS provider_type, -- <-- DYNAMIC TYPE from the parent provider -- Items have a static type
    i."name_en" AS title_en,
    i."name_ar" AS title_ar,
    NULL AS address_en,
    NULL AS address_ar,
    NULL AS city_en,
    NULL AS city_ar,
    NULL AS city_id,
    NULL AS location, -- Add a null location column
    i.type AS item_type, -- Add item type column
    to_tsvector('english',
        i."name_en"|| ' ' ||
        i.code|| ' ' ||
        i.type::text
    ) AS document_vector_en,
    to_tsvector('arabic',
        i."name_ar"
    ) AS document_vector_ar
FROM
    item i
WHERE i."is_active" = true

UNION ALL
-- MODIFIED Section for the 'branch' entity with city and governorate joins
SELECT
    b.id AS entity_id,
    'branch'AS entity_type, -- <-- DYNAMIC TYPE from the parent provider
    p.type_id::text AS provider_type, -- <-- DYNAMIC TYPE from the parent provider
    b."name_en" AS title_en,
    b."name_ar" AS title_ar,
    b."address_en" AS address_en,
    b."address_ar" AS address_ar,
    c.name_en AS city_en,
    c.name_ar AS city_ar,
    c.id AS city_id,
    b.location, -- Add the location column
     NULL AS item_type,
    to_tsvector('english',
        pt."name_en"|| ' ' ||
        s."name_en"|| ' ' ||
       COALESCE( b."name_en", p."name_en")|| ' ' ||
        c."name_en"|| ' ' ||
        g."name_en"|| ' ' ||
        b."address_en"
    ) AS document_vector_en,
    to_tsvector('arabic',
        pt."name_ar"|| ' ' ||
        s."name_ar"|| ' ' ||
       COALESCE( b."name_ar",  p."name_ar")|| ' ' ||
        c."name_ar"|| ' ' ||
        g."name_ar"|| ' ' ||
        b."address_ar"
    ) AS document_vector_ar
FROM
    branch b 
     INNER JOIN public.provider p ON p.id = b.provider_id
     INNER JOIN public.city c ON c.id = b.city_id
     INNER JOIN public.governorate g ON g.id = c.governorate_id
     INNER JOIN public.provider_type pt ON p.type_id = pt.id
     LEFT JOIN public.provider_speciality ps ON ps.provider_id = p.id  AND ps."is_active" = true
     LEFT JOIN public.speciality s ON s.id = ps.speciality_id  AND s."is_active" = true
WHERE b."is_active" = true And p."is_active" = true 

UNION ALL
-- MODIFIED Section for the 'provider' entity
SELECT
   p.id AS entity_id,
   'provider' AS entity_type, -- <-- DYNAMIC TYPE 
   p.type_id::text AS provider_type, -- <-- DYNAMIC TYPE from the parent provider
   p."name_en" AS title_en,
   p."name_ar" AS title_ar,
    NULL AS address_en,
    NULL AS address_ar,
    NULL AS city_en,
    NULL AS city_ar,
    NULL AS city_id,
    NULL AS location, -- Add a null location column
    NULL AS item_type,
    to_tsvector('english',
        P."name_en"|| ' ' ||
        pt."name_en"|| ' ' ||
        s."name_en"
    ) AS document_vector_en,
    to_tsvector('arabic',
        P."name_ar"|| ' ' ||
        pt."name_ar"|| ' ' ||
        s."name_ar"
    ) AS document_vector_ar
FROM
   public.provider p
    INNER JOIN public.provider_type pt ON p.type_id = pt.id
    LEFT JOIN public.provider_speciality ps ON ps.provider_id = p.id  AND ps."is_active" = true
    LEFT JOIN public.speciality s ON s.id = ps.speciality_id  AND s."is_active" = true
WHERE p."is_active" = true AND pt."is_active" = true 

UNION ALL
-- MODIFIED Section for the 'speciality' entity
SELECT
    s.id AS entity_id,
   'speciality' AS entity_type, -- <-- DYNAMIC TYPE 
    NULL AS provider_type, -- <-- DYNAMIC TYPE from the parent provider
    s."name_en" AS title_en,
    s."name_ar" AS title_ar,
    NULL AS address_en,
    NULL AS address_ar,
    NULL AS city_en,
    NULL AS city_ar,
    NULL AS city_id,
    NULL AS location, -- Add a null location column
    NULL AS item_type,
    to_tsvector('english',
        s."name_en"
    ) AS document_vector_en,
    to_tsvector('arabic',
        s."name_ar"
    ) AS document_vector_ar
FROM
   public.speciality s
WHERE s."is_active" = true ;
---------------------------------------------------------------------------------------------------------------------------------------------------------------
-- (If you dropped the view, you must recreate the indexes)
CREATE INDEX IF NOT EXISTS idx_global_search_gin_en ON global_search_view USING gin(document_vector_en);
CREATE INDEX IF NOT EXISTS idx_global_search_gin_ar ON global_search_view USING gin(document_vector_ar);

-- Refresh the view to include provider data
REFRESH MATERIALIZED VIEW global_search_view;
----------------------------------------------------------------------------------------------------------------------------------------------------------------