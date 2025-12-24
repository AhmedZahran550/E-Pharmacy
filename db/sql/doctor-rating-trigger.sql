-- Create function to automatically update doctor rating statistics
CREATE OR REPLACE FUNCTION update_doctor_rating_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate and update average rating and total raters for the doctor
  UPDATE employee
  SET 
    average_rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM doctor_rating
      WHERE employee_id = NEW.employee_id
    ),
    total_raters = (
      SELECT COUNT(*)
      FROM doctor_rating
      WHERE employee_id = NEW.employee_id
    )
  WHERE id = NEW.employee_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger that fires after INSERT on doctor_rating
CREATE TRIGGER update_doctor_rating_after_insert
AFTER INSERT ON doctor_rating
FOR EACH ROW
EXECUTE FUNCTION update_doctor_rating_stats();
