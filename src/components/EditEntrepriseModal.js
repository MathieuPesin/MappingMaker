import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { updateImage } from '../utils/imageUtils';

const EditEntrepriseModal = ({ entreprise, isOpen, onClose, onSave, onUpdate, supabase, categories }) => {
  const [formData, setFormData] = useState({
    nom: '',
    logo_url: '',
    categorie: '',
    description: '',
    site_web: '',
    localisation: ''
  });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && entreprise) {
      setFormData({
        nom: entreprise.nom || '',
        logo_url: entreprise.logo_url || '',
        categorie: entreprise.categorie || '',
        description: entreprise.description || '',
        site_web: entreprise.site_web || '',
        localisation: entreprise.localisation || ''
      });
    }
  }, [isOpen, entreprise]);

  const handleImageChange = async (e) => {
    try {
      setUploading(true);
      setError('');
      
      const file = e.target.files?.[0];
      if (!file) return;

      const { publicUrl } = await updateImage(formData.logo_url, file);
      
      setFormData(prev => ({
        ...prev,
        logo_url: publicUrl
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const companyData = {
        ...entreprise,
        ...formData
      };

      const { error } = await onSave(companyData);
      if (error) throw error;
      
      // Mettre à jour les données localement
      onUpdate(companyData);
      
      // Fermer la modal après une mise à jour réussie
      onClose();

      // Réinitialiser le formulaire
      setFormData({
        nom: '',
        logo_url: '',
        categorie: '',
        description: '',
        site_web: '',
        localisation: ''
      });
      
    } catch (error) {
      console.error('Error updating/creating company:', error);
      alert('Une erreur est survenue lors de la mise à jour de l\'entreprise.');
    }
  };

  const handleDelete = async () => {
    if (!entreprise.id) return;

    try {
      const { error } = await supabase
        .from('entreprises')
        .delete()
        .eq('id', entreprise.id);

      if (error) throw error;

      // Mettre à jour les données localement
      onUpdate(null, entreprise.id);

      // Fermer la modal
      onClose();
    } catch (error) {
      console.error('Error deleting company:', error);
      alert('Une erreur est survenue lors de la suppression de l\'entreprise.');
    }
  };

  const handleClose = () => {
    setFormData({
      nom: '',
      logo_url: '',
      categorie: '',
      description: '',
      site_web: '',
      localisation: ''
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {entreprise?.id ? 'Modifier l\'entreprise' : 'Créer une entreprise'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom de l'entreprise
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
                Logo
              </label>
              <div className="space-y-2">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleImageChange}
                  className="w-full"
                  disabled={uploading}
                />
                {error && (
                  <p className="text-red-500 text-sm">{error}</p>
                )}
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
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Site web
              </label>
              <input
                type="url"
                value={formData.site_web}
                onChange={(e) => setFormData({ ...formData, site_web: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Localisation
              </label>
              <input
                type="text"
                value={formData.localisation}
                onChange={(e) => setFormData({ ...formData, localisation: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
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
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        formData.categorie?.includes(category)
                          ? 'bg-indigo-100 text-indigo-800'
                          : 'bg-gray-100 text-gray-800'
                      } hover:bg-opacity-75 transition-colors`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Annuler
            </button>
            {entreprise?.id && (
              <button
                type="button"
                onClick={handleDelete}
                className="inline-flex justify-center rounded-lg border border-transparent bg-red-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all"
              >
                Supprimer
              </button>
            )}
            <button
              type="submit"
              disabled={uploading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {uploading ? 'Chargement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditEntrepriseModal;
