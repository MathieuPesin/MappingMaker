import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import Papa from 'papaparse';
import { ArrowUpTrayIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Combobox } from '@headlessui/react';

const ImportCSV = ({ session, onImportComplete, allCategories }) => {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: '', content: '' });
  const [preview, setPreview] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [query, setQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  const filteredCategories = query === ''
    ? allCategories
    : allCategories.filter((category) =>
        category.toLowerCase().includes(query.toLowerCase())
      );

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
    if (file) {
      Papa.parse(file, {
        complete: (results) => {
          if (results.data && results.data.length > 0) {
            // Prendre les 5 premières lignes pour l'aperçu
            const previewData = results.data.slice(0, 5);
            setPreview({
              headers: Array.isArray(results.meta.fields) ? results.meta.fields : [],
              rows: previewData
            });
            setShowPreview(true);
          }
        },
        header: true,
        skipEmptyLines: true
      });
    }
  };

  const processCSV = async (file) => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        complete: async (results) => {
          const companies = [];
          const newCategories = new Set();
          
          // Collecter toutes les nouvelles catégories
          for (const row of results.data) {
            const categories = (row.category || '').split(',')
              .map(cat => cat.trim())
              .filter(cat => cat !== '');
              
            categories.forEach(category => {
              if (!allCategories.includes(category)) {
                newCategories.add(category);
              }
            });
          }

          // Créer les nouvelles catégories
          for (const category of newCategories) {
            try {
              const { error } = await supabase
                .from('categories')
                .insert([{ name: category }]);
              
              if (error) throw error;
            } catch (error) {
              console.error('Error creating category:', category, error);
            }
          }

          // Traiter les entreprises
          for (const row of results.data) {
            try {
              const categories = (row.category || '').split(',')
                .map(cat => cat.trim())
                .filter(cat => cat !== '');

              companies.push({
                nom: row.name || '',
                description: row.description || '',
                categorie: categories,
                logo_url: row.logo || '',
                user_id: session.user.id
              });
            } catch (error) {
              console.error('Error processing row:', error);
            }
          }
          resolve(companies);
        },
        header: true,
        skipEmptyLines: true,
        error: (error) => reject(error)
      });
    });
  };

  const handleImport = async (file) => {
    try {
      setUploading(true);
      const companies = await processCSV(file);
      
      // Insérer les entreprises par lots de 50
      const batchSize = 50;
      for (let i = 0; i < companies.length; i += batchSize) {
        const batch = companies.slice(i, i + batchSize);
        const { error } = await supabase
          .from('entreprises')
          .insert(batch);
        
        if (error) throw error;
      }

      setMessage({
        type: 'success',
        content: `${companies.length} entreprises importées avec succès`
      });
      setShowPreview(false);
      if (onImportComplete) onImportComplete();
    } catch (error) {
      console.error('Error importing companies:', error);
      setMessage({
        type: 'error',
        content: 'Erreur lors de l\'import: ' + error.message
      });
    } finally {
      setUploading(false);
    }
  };

  const handleImportClick = () => {
    if (selectedFile) {
      handleImport(selectedFile);
    } else {
      setMessage({ type: 'error', content: 'Aucun fichier sélectionné.' });
    }
  };

  return (
    <div>
      {!showPreview ? (
        <div className="flex items-center justify-center w-full">
          <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-white/50 hover:bg-white/70 transition-colors">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <ArrowUpTrayIcon className="w-8 h-8 mb-4 text-gray-500" />
              <p className="mb-2 text-sm text-gray-500">
                <span className="font-semibold">Cliquez pour sélectionner</span> ou glissez-déposez
              </p>
              <p className="text-xs text-gray-500">Fichier CSV uniquement</p>
              <p className="text-xs text-gray-500 mt-2">Format attendu: nom, url logo, description, catégorie(s), localisation</p>
            </div>
            <input
              type="file"
              className="hidden"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={uploading}
            />
          </label>
        </div>
      ) : (
        <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Aperçu de l'import</h3>
            <button
              onClick={() => setShowPreview(false)}
              className="text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {preview?.headers.map((header, index) => (
                    <th
                      key={index}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {preview?.rows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {Object.values(row).map((cell, cellIndex) => (
                      <td
                        key={cellIndex}
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700">
              Catégories disponibles
            </label>
            <div className="mt-1">
              <Combobox value={selectedCategories} onChange={setSelectedCategories} multiple>
                <div className="relative">
                  <Combobox.Input
                    className="w-full rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 sm:text-sm"
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Rechercher une catégorie..."
                  />
                  <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                    {filteredCategories.map((category) => (
                      <Combobox.Option
                        key={category}
                        value={category}
                        className={({ active }) =>
                          `relative cursor-default select-none py-2 pl-3 pr-9 ${
                            active ? 'bg-green-600 text-white' : 'text-gray-900'
                          }`
                        }
                      >
                        {category}
                      </Combobox.Option>
                    ))}
                  </Combobox.Options>
                </div>
              </Combobox>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={() => setShowPreview(false)}
              className="inline-flex justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleImportClick}
              disabled={uploading}
              className="inline-flex justify-center rounded-lg border border-transparent bg-gradient-to-r from-green-400 to-yellow-400 px-4 py-2 text-sm font-medium text-white shadow-sm hover:from-green-500 hover:to-yellow-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Import en cours...' : 'Importer'}
            </button>
          </div>
        </div>
      )}

      {message.content && (
        <div className={`mt-4 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {message.content}
        </div>
      )}
    </div>
  );
};

export default ImportCSV;
