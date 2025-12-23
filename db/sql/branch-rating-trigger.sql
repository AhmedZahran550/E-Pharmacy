-- Database trigger to automatically update branch average_rating and rating_count
-- This trigger fires after INSERT, UPDATE, or DELETE on branch_rating table

-- Function to update branch rating statistics
CREATE OR REPLACE FUNCTION update_branch_rating_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the branch's average_rating and rating_count
  -- Works for INSERT, UPDATE, and DELETE operations
  UPDATE branch
  SET 
    average_rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM branch_rating
      WHERE branch_id = COALESCE(NEW.branch_id, OLD.branch_id)
    ),
    rating_count = (
      SELECT COUNT(*)
      FROM branch_rating
      WHERE branch_id = COALESCE(NEW.branch_id, OLD.branch_id)
    ),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.branch_id, OLD.branch_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_branch_rating_stats ON branch_rating;

-- Create trigger that fires after INSERT, UPDATE, or DELETE
CREATE TRIGGER trigger_update_branch_rating_stats
AFTER INSERT OR UPDATE OR DELETE ON branch_rating
FOR EACH ROW
EXECUTE FUNCTION update_branch_rating_stats();

