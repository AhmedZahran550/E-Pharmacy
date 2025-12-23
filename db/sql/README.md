# Branch Rating Database Trigger

This SQL script creates a PostgreSQL trigger that automatically updates the `average_rating` and `rating_count` columns on the `branch` table whenever a rating is inserted, updated, or deleted.

## What it does

- **Automatically calculates** the average rating for a branch
- **Automatically counts** the total number of ratings
- **Updates instantly** when ratings change (INSERT, UPDATE, or DELETE)
- **Maintains data integrity** at the database level

## How to apply

### Option 1: Using psql command line

```bash
psql -U your_username -d your_database -f db/sql/branch-rating-trigger.sql
```

### Option 2: Using pgAdmin or another GUI tool

1. Open your PostgreSQL GUI client
2. Connect to your database
3. Open the file `db/sql/branch-rating-trigger.sql`
4. Execute the SQL script

### Option 3: Programmatically (if needed)

You can also run this as part of your migration workflow if you set up TypeORM migrations.

## Verification

After applying the trigger, test it:

```sql
-- Insert a test rating
INSERT INTO branch_rating (id, user_id, branch_id, rating, created_at, updated_at)
VALUES (gen_random_uuid(), 'user-uuid', 'branch-uuid', 4.5, NOW(), NOW());

-- Check the branch table - average_rating and rating_count should be updated automatically
SELECT id, average_rating, rating_count FROM branch WHERE id = 'branch-uuid';
```

## Notes

- The trigger is **idempotent** - you can run it multiple times safely
- It creates indexes on `branch_rating(branch_id)` and `branch_rating(user_id)` for better performance
- The trigger handles all operations: INSERT, UPDATE, and DELETE
