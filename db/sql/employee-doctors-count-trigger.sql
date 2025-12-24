-- Database trigger to automatically update branch doctorsCount
-- This trigger fires after INSERT or DELETE on employee table
-- It increments/decrements the count when a provider doctor is added/removed

-- Function to update branch doctors count
CREATE OR REPLACE FUNCTION update_branch_doctors_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle INSERT: increment doctorsCount
  IF (TG_OP = 'INSERT') THEN
    -- Check if employee is a provider doctor with a branch
    IF (NEW.branch_id IS NOT NULL 
        AND NEW.type = 'provider' 
        AND NEW.roles @> ARRAY['provider_doctor']::employee_roles_enum[]) THEN
      UPDATE branch
      SET doctors_count = COALESCE(doctors_count, 0) + 1,
          updated_at = NOW()
      WHERE id = NEW.branch_id;
    END IF;
    RETURN NEW;
  
  -- Handle DELETE or soft delete: decrement doctorsCount
  ELSIF (TG_OP = 'DELETE' OR TG_OP = 'UPDATE') THEN
    -- For UPDATE, only process if it's a soft delete (deleted_at changed from NULL to NOT NULL)
    IF (TG_OP = 'UPDATE' AND (OLD.deleted_at IS NULL AND NEW.deleted_at IS NULL)) THEN
      RETURN NEW;
    END IF;
    
    -- Use OLD for both DELETE and soft delete UPDATE
    IF (OLD.branch_id IS NOT NULL 
        AND OLD.type = 'provider' 
        AND OLD.roles @> ARRAY['provider_doctor']::employee_roles_enum[]) THEN
      UPDATE branch
      SET doctors_count = GREATEST(COALESCE(doctors_count, 0) - 1, 0),
          updated_at = NOW()
      WHERE id = OLD.branch_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_branch_doctors_count ON employee;

-- Create trigger that fires after INSERT, UPDATE, or DELETE
CREATE TRIGGER trigger_update_branch_doctors_count
AFTER INSERT OR UPDATE OR DELETE ON employee
FOR EACH ROW
EXECUTE FUNCTION update_branch_doctors_count();
