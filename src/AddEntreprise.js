import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Papa from 'papaparse';

const AddEntreprise = ({ session }) => {
  const [formData, setFormData] = useState({
    nom: '',
    logo_url: '',
    categorie: '',
    description: ''
  });
  const [categories, setCategories] = useState([]);
  const [message, setMessage] = useState({ type: '', content: '' });
  const [loading, setLoading] = useState(false);
  const [showCSVImport, setShowCSVImport] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('entreprises')
        .select('categorie');

      if (error) throw error;

      const allCategories = new Set();
      data.forEach(entreprise => {
        const cats = entreprise.categorie.split(',').map(cat => cat.trim());
        cats.forEach(cat => allCategories.add(cat));
      });
      setCategories([...allCategories].sort());
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', content: '' });

    try {
      if (!formData.nom.trim()) {
        throw new Error('Le nom est requis');
      }

      const { data, error } = await supabase
        .from('entreprises')
        .insert([
          {
            ...formData,
            user_id: session.user.id // Ajout de l'ID de l'utilisateur
          }
        ])
        .select();

      if (error) throw error;

      setMessage({
        type: 'success',
        content: 'Entreprise ajoutée avec succès!'
      });

      setFormData({
        nom: '',
        logo_url: '',
        categorie: '',
        description: ''
      });

      fetchCategories();

      setTimeout(() => {
        setMessage({ type: '', content: '' });
      }, 3000);
    } catch (error) {
      setMessage({
        type: 'error',
        content: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCSVUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    setMessage({ type: '', content: '' });

    Papa.parse(file, {
      header: true,
      complete: async (results) => {
        try {
          const { data } = results;
          
          if (data.length === 0) {
            throw new Error('Le fichier CSV est vide');
          }

          // Vérifier que les colonnes requises sont présentes
          const requiredColumns = ['nom', 'logo_url', 'categorie'];
          const missingColumns = requiredColumns.filter(col => !Object.keys(data[0]).includes(col));
          
          if (missingColumns.length > 0) {
            throw new Error(`Colonnes manquantes : ${missingColumns.join(', ')}`);
          }

          // Récupérer les entreprises existantes
          const { data: existingCompanies, error: fetchError } = await supabase
            .from('entreprises')
            .select('nom');

          if (fetchError) throw fetchError;

          // Créer un Set des noms d'entreprises existantes pour une recherche O(1)
          const existingNames = new Set(existingCompanies.map(company => company.nom.toLowerCase()));

          // Filtrer les entreprises à ajouter
          const newCompanies = [];
          const duplicates = [];

          data.forEach(company => {
            if (!company.nom) return; // Ignorer les lignes sans nom
            
            const normalizedName = company.nom.toLowerCase().trim();
            if (existingNames.has(normalizedName)) {
              duplicates.push(company.nom);
            } else {
              newCompanies.push({
                ...company,
                user_id: session.user.id // Ajout de l'ID de l'utilisateur
              });
              existingNames.add(normalizedName); // Éviter les doublons dans le même fichier CSV
            }
          });

          if (newCompanies.length === 0) {
            throw new Error('Aucune nouvelle entreprise à ajouter. Toutes les entreprises existent déjà.');
          }

          // Insérer uniquement les nouvelles entreprises
          const { error: insertError } = await supabase
            .from('entreprises')
            .insert(newCompanies);
          
          if (insertError) throw insertError;

          let successMessage = `${newCompanies.length} entreprise(s) importée(s) avec succès`;
          if (duplicates.length > 0) {
            successMessage += `\n${duplicates.length} entreprise(s) ignorée(s) car déjà existante(s) : ${duplicates.slice(0, 3).join(', ')}${duplicates.length > 3 ? '...' : ''}`;
          }

          setMessage({
            type: 'success',
            content: successMessage
          });

          fetchCategories();

          setTimeout(() => {
            setMessage({ type: '', content: '' });
          }, 5000); // Augmenté à 5s pour laisser le temps de lire le message détaillé
        } catch (error) {
          setMessage({
            type: 'error',
            content: error.message
          });
        } finally {
          setLoading(false);
          // Réinitialiser l'input file pour permettre de réimporter le même fichier si nécessaire
          event.target.value = '';
        }
      },
      error: (error) => {
        setMessage({
          type: 'error',
          content: 'Erreur lors de la lecture du fichier CSV'
        });
        setLoading(false);
        event.target.value = '';
      },
      skipEmptyLines: true,
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-semibold text-gray-800">
            Ajouter une entreprise
          </h2>
          <button
            onClick={() => setShowCSVImport(!showCSVImport)}
            className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            {showCSVImport ? 'Ajouter manuellement' : 'Importer CSV'}
          </button>
        </div>

        {showCSVImport ? (
          <div className="p-6 space-y-6">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <div className="space-y-4">
                <div className="text-gray-600">
                  <p className="mb-2">Format CSV requis :</p>
                  <code className="bg-gray-100 px-2 py-1 rounded">nom,logo_url,categorie,description</code>
                </div>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCSVUpload}
                  className="hidden"
                  id="csv-upload"
                  disabled={loading}
                />
                <label
                  htmlFor="csv-upload"
                  className={`inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg cursor-pointer transition-colors ${
                    loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-700'
                  }`}
                >
                  {loading ? 'Import en cours...' : 'Sélectionner un fichier CSV'}
                </label>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom de l'entreprise*
                </label>
                <input
                  type="text"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL du logo
                </label>
                <input
                  type="url"
                  value={formData.logo_url}
                  onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                {formData.logo_url && (
                  <div className="mt-2 p-2 border rounded-lg">
                    <img
                      src={formData.logo_url}
                      alt="Aperçu du logo"
                      className="h-20 object-contain mx-auto"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catégories
                </label>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {categories.map(category => (
                      <button
                        key={category}
                        type="button"
                        onClick={() => {
                          const currentCategories = formData.categorie
                            ? formData.categorie.split(',').map(c => c.trim())
                            : [];
                          const index = currentCategories.indexOf(category);
                          let newCategories;
                          if (index === -1) {
                            newCategories = [...currentCategories, category];
                          } else {
                            newCategories = currentCategories.filter(c => c !== category);
                          }
                          setFormData({
                            ...formData,
                            categorie: newCategories.join(', ')
                          });
                        }}
                        className={`px-3 py-1 rounded-full text-sm transition-colors ${
                          formData.categorie?.split(',').map(c => c.trim()).includes(category)
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={formData.categorie}
                    onChange={(e) => setFormData({ ...formData, categorie: e.target.value })}
                    placeholder="Saisissez les catégories séparées par des virgules"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <button
                type="submit"
                disabled={loading}
                className={`px-6 py-2 bg-indigo-600 text-white rounded-lg transition-colors ${
                  loading
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-indigo-700'
                }`}
              >
                {loading ? 'Ajout en cours...' : 'Ajouter l\'entreprise'}
              </button>
            </div>
          </form>
        )}

        {message.content && (
          <div
            className={`mx-6 mb-6 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {message.content}
          </div>
        )}
      </div>
    </div>
  );
};

export default AddEntreprise;
