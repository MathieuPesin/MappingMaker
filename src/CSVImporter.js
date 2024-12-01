import React from 'react';
import Papa from 'papaparse';
import { supabase } from './supabaseClient';

const CSVImporter = () => {
  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      complete: async (results) => {
        const { data } = results;
        console.log('Parsed CSV data:', data);

        // Insert parsed data into Supabase
        const { error } = await supabase.from('entreprises').insert(data);
        if (error) {
          console.error('Error inserting data:', error);
        } else {
          console.log('Data successfully inserted');
        }
      },
      skipEmptyLines: true,
    });
  };

  return (
    <div className="csv-importer">
      <input type="file" accept=".csv" onChange={handleFileChange} />
    </div>
  );
};

export default CSVImporter;
