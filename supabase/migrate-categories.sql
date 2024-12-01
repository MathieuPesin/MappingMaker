-- Temporary function to convert string categories to array
CREATE OR REPLACE FUNCTION temp_convert_categories()
RETURNS void AS $$
BEGIN
  -- Update existing rows where categorie is a string
  UPDATE entreprises
  SET categorie = string_to_array(categorie::text, ',')
  WHERE categorie IS NOT NULL AND categorie::text != '';
  
  -- Handle empty strings
  UPDATE entreprises
  SET categorie = NULL
  WHERE categorie::text = '';
END;
$$ LANGUAGE plpgsql;

-- Execute the conversion
SELECT temp_convert_categories();

-- Drop the temporary function
DROP FUNCTION temp_convert_categories();
