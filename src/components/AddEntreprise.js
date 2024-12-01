import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { uploadImage } from '../utils/imageUtils';

const AddEntreprise = ({ session }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', content: '' });
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    categorie: [],
    site_web: '',
    localisation: '',
    logo_url: ''
  });

  const handleCategoryChange = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      e.preventDefault();
      const newCategory = e.target.value.trim();
      if (!formData.categorie.includes(newCategory)) {
        setFormData(prev => ({
          ...prev,
          categorie: [...prev.categorie, newCategory]
        }));
      }
      e.target.value = '';
    }
  };

  const removeCategory = (categoryToRemove) => {
    setFormData(prev => ({
      ...prev,
      categorie: prev.categorie.filter(cat => cat !== categoryToRemove)
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileUpload = async (event) => {
    try {
      setUploading(true);
      setMessage({ type: '', content: '' });

      const file = event.target.files?.[0];
      if (!file) return;

      const { publicUrl } = await uploadImage(file);
      
      setFormData(prev => ({
        ...prev,
        logo_url: publicUrl
      }));
    } catch (error) {
      setMessage({ type: 'error', content: error.message });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setMessage({ type: '', content: '' });

      if (!session?.user?.id) {
        throw new Error('Veuillez vous connecter pour ajouter une entreprise');
      }

      const { error } = await supabase
        .from('entreprises')
        .insert([
          {
            ...formData,
            user_id: session.user.id,
            categorie: formData.categorie.join(', ')
          }
        ]);

      if (error) throw error;

      setMessage({ type: 'success', content: 'Entreprise ajoutée avec succès' });
      setFormData({
        nom: '',
        description: '',
        categorie: [],
        site_web: '',
        localisation: '',
        logo_url: ''
      });
    } catch (error) {
      setMessage({ type: 'error', content: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-8">Ajouter une entreprise</h2>
      
      {message.content && (
        <div className={`p-4 rounded-lg mb-6 ${
          message.type === 'error' ? 'bg-red-100 text-red-700' : 
          message.type === 'success' ? 'bg-green-100 text-green-700' :
          'bg-blue-100 text-blue-700'
        }`}>
          {message.content}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nom de l'entreprise *
          </label>
          <input
            type="text"
            name="nom"
            value={formData.nom}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Logo
          </label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleFileUpload}
            className="w-full"
            disabled={uploading}
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
            Site web
          </label>
          <input
            type="url"
            name="site_web"
            value={formData.site_web}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Localisation
          </label>
          <input
            type="text"
            name="localisation"
            value={formData.localisation}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Catégories
          </label>
          <div className="space-y-2">
            <input
              type="text"
              onKeyDown={handleCategoryChange}
              placeholder="Appuyez sur Entrée pour ajouter une catégorie"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <div className="flex flex-wrap gap-2">
              {formData.categorie.map((cat, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800"
                >
                  {cat}
                  <button
                    type="button"
                    onClick={() => removeCategory(cat)}
                    className="ml-2 text-indigo-600 hover:text-indigo-900"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || uploading}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading || uploading ? 'Chargement...' : 'Ajouter l\'entreprise'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddEntreprise;
