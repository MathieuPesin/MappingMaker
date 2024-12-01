import React, { useState, useEffect, Fragment } from 'react';
import { supabase } from '../supabaseClient';
import { Dialog, Transition } from '@headlessui/react';
import { PencilIcon, TrashIcon, GlobeAltIcon, MapPinIcon, MagnifyingGlassIcon, FunnelIcon, XMarkIcon, ArrowUpTrayIcon, PlusIcon } from '@heroicons/react/24/outline';
import ImportCSV from './ImportCSV';
import * as d3 from 'd3';

const EntreprisesList = ({ session }) => {
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState([]);
  const [filteredCompanies, setFilteredCompanies] = useState([]);
  const [message, setMessage] = useState({ type: '', content: '' });
  // eslint-disable-next-line no-unused-vars
  const [editingCompany, setEditingCompany] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    categories: [],
    locations: []
  });
  const [showFilters, setShowFilters] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    nom: '',
    description: '',
    categorie: [],
    site_web: '',
    localisation: '',
    logo_url: '',
    logo_file: null
  });
  // eslint-disable-next-line no-unused-vars
  const [setUploading] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [allCategories, setAllCategories] = useState([]);
  const [addForm, setAddForm] = useState({
    nom: '',
    description: '',
    categorie: [],
    site_web: '',
    localisation: '',
    logo_url: '',
    logo_file: null
  });

  useEffect(() => {
    fetchAllCategories();
    getCompanies();
  }, [fetchAllCategories, getCompanies]);

  useEffect(() => {
    normalizeCategories();
  }, [normalizeCategories]);

  useEffect(() => {
    const filtered = companies.filter(company => {
      // Search term filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        company.nom?.toLowerCase().includes(searchLower) ||
        company.description?.toLowerCase().includes(searchLower) ||
        (Array.isArray(company.categorie) 
          ? company.categorie.some(cat => cat.toLowerCase().includes(searchLower))
          : company.categorie?.toLowerCase().includes(searchLower)) ||
        company.localisation?.toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;

      // Category filter
      if (filters.categories.length > 0) {
        const companyCategories = normalizeCategories(company.categorie);
        if (!companyCategories.some(cat => 
          filters.categories.some(filter => 
            cat.toLowerCase().includes(filter.toLowerCase())
          )
        )) {
          return false;
        }
      }

      // Location filter
      if (filters.locations.length > 0) {
        if (!company.localisation || 
          !filters.locations.some(loc => 
            company.localisation.toLowerCase().includes(loc.toLowerCase())
          )
        ) {
          return false;
        }
      }

      return true;
    });

    setFilteredCompanies(filtered);
  }, [companies, searchTerm, filters]);

  const normalizeCategory = (category) => {
    if (!category) return '';
    
    if (typeof category === 'string') {
      // Try to parse if it looks like JSON
      if (category.startsWith('[') && category.endsWith(']')) {
        try {
          const parsed = JSON.parse(category);
          return Array.isArray(parsed) ? parsed[0] : category;
        } catch (e) {
          // If parsing fails, continue with normal string handling
        }
      }
      
      // Clean up the string
      return category
        .replace(/[{}"\\]/g, '')
        .trim();
    }
    
    return String(category);
  };

  const normalizeCategories = (categories) => {
    if (!categories) return [];
    
    // If it's already an array
    if (Array.isArray(categories)) {
      return categories.map(normalizeCategory).filter(Boolean);
    }
    
    // If it's a string
    if (typeof categories === 'string') {
      // Try to parse if it looks like JSON
      if (categories.startsWith('[') && categories.endsWith(']')) {
        try {
          const parsed = JSON.parse(categories);
          return Array.isArray(parsed) ? parsed.map(normalizeCategory).filter(Boolean) : [normalizeCategory(categories)];
        } catch (e) {
          // If parsing fails, split by comma
          return categories
            .replace(/[{}"\\[\]]/g, '')
            .split(',')
            .map(cat => normalizeCategory(cat))
            .filter(Boolean);
        }
      }
      
      // Split by comma if it's a regular string
      return categories
        .split(',')
        .map(cat => normalizeCategory(cat))
        .filter(Boolean);
    }
    
    return [];
  };

  const handleChange = (e, company = null) => {
    const { name, value } = e.target;
    if (company) {
      if (name === 'categorie') {
        const categories = value.split(',').map(cat => cat.trim()).filter(cat => cat !== '');
        setEditForm(prev => ({
          ...prev,
          [name]: categories
        }));
      } else {
        setEditForm(prev => ({
          ...prev,
          [name]: value
        }));
      }
    }
  };

  const handleCategoryChange = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      e.preventDefault();
      const newCategory = e.target.value.trim();
      setEditForm(prev => ({
        ...prev,
        categorie: Array.isArray(prev.categorie) 
          ? [...prev.categorie, newCategory]
          : [newCategory]
      }));
      e.target.value = '';
    }
  };

  const removeCategory = (categoryToRemove) => {
    setEditForm(prev => ({
      ...prev,
      categorie: Array.isArray(prev.categorie)
        ? prev.categorie.filter(cat => cat !== categoryToRemove)
        : []
    }));
  };

  const getCompanies = async () => {
    try {
      setLoading(true);
      
      if (!session?.user?.id) {
        console.error('No user session found');
        setCompanies([]);
        setFilteredCompanies([]);
        return;
      }

      const { data, error } = await supabase
        .from('entreprises')
        .select('*')
        .eq('user_id', session.user.id);

      if (error) throw error;

      const normalizedData = data.map(company => ({
        ...company,
        categorie: normalizeCategories(company.categorie)
      }));

      setCompanies(normalizedData);
      setFilteredCompanies(normalizedData);
    } catch (error) {
      console.error('Error:', error);
      setCompanies([]);
      setFilteredCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('entreprises')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setCompanies(companies.filter(company => company.id !== id));
      setMessage({ type: 'success', content: 'Entreprise supprimée avec succès' });
    } catch (error) {
      setMessage({ type: 'error', content: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAdd = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setMessage({ type: 'info', content: 'Ajout de l\'entreprise en cours...' });

      if (!session?.user?.id) {
        setMessage({ type: 'error', content: 'Veuillez vous connecter pour ajouter une entreprise' });
        return;
      }

      if (!addForm.nom.trim()) {
        setMessage({ type: 'error', content: 'Le nom de l\'entreprise est requis' });
        return;
      }

      // Normalize categories
      const categories = normalizeCategories(addForm.categorie);

      // Prepare new company data
      const newCompany = {
        nom: addForm.nom.trim(),
        description: addForm.description.trim(),
        categorie: categories,
        site_web: addForm.site_web.trim(),
        localisation: addForm.localisation.trim(),
        logo_url: addForm.logo_url, // Use external URL directly
        user_id: session.user.id
      };

      const { error } = await supabase
        .from('entreprises')
        .insert([newCompany]);

      if (error) {
        throw error;
      }

      console.log('Company added successfully');
      setMessage({ type: 'success', content: 'Entreprise ajoutée avec succès!' });
      await Promise.all([
        getCompanies(),
        setAddForm({
          nom: '',
          description: '',
          categorie: [],
          site_web: '',
          localisation: '',
          logo_url: '',
          logo_file: null
        })
      ]);
    } catch (error) {
      console.error('Error adding company:', error);
      setMessage({ type: 'error', content: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setMessage({ type: 'info', content: 'Mise à jour de l\'entreprise en cours...' });

      if (!session?.user?.id) {
        setMessage({ type: 'error', content: 'Veuillez vous connecter pour modifier une entreprise' });
        return;
      }

      // Prepare update data
      const updateData = {
        ...editForm,
        logo_url: editForm.logo_url, // Use external URL directly
        logo_file: null // Don't store the file object in the database
      };

      const { error } = await supabase
        .from('entreprises')
        .update(updateData)
        .eq('id', editForm.id);

      if (error) {
        throw error;
      }

      console.log('Company updated successfully');
      setMessage({ type: 'success', content: 'Entreprise mise à jour avec succès!' });
      await getCompanies();
    } catch (error) {
      console.error('Error updating company:', error);
      setMessage({ type: 'error', content: error.message });
    } finally {
      setLoading(false);
    }
  };

  const fetchAllCategories = async () => {
    try {
      if (!session?.user?.id) {
        console.error('No user session found');
        return;
      }

      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('name')
        .eq('user_id', session.user.id);

      if (categoriesError) {
        console.error('Error fetching categories:', categoriesError);
        return;
      }

      // Get categories from companies
      const { data: companiesData, error: companiesError } = await supabase
        .from('entreprises')
        .select('categorie')
        .eq('user_id', session.user.id);

      if (companiesError) {
        console.error('Error fetching company categories:', companiesError);
        return;
      }

      // Extract and normalize categories from both sources
      const categoriesFromDB = categoriesData.map(cat => normalizeCategory(cat.name));
      const categoriesFromCompanies = companiesData
        .flatMap(company => normalizeCategories(company.categorie));

      const uniqueCategories = [...new Set([...categoriesFromDB, ...categoriesFromCompanies])]
        .filter(Boolean)
        .sort();

      setAllCategories(uniqueCategories);
    } catch (error) {
      console.error('Error in fetchAllCategories:', error);
    }
  };

  const handleAddFormChange = (e) => {
    const { name, value } = e.target;
    if (name === 'categorie') {
      const categories = value.split(',')
        .map(cat => normalizeCategory(cat))
        .filter(Boolean);

      setAddForm(prev => ({
        ...prev,
        [name]: categories
      }));
    } else {
      setAddForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleAddCategoryKeyDown = (e) => {
    if (e.key === 'Enter' && e.target.value) {
      e.preventDefault();
      const newCategory = e.target.value.trim();
      if (!addForm.categorie.includes(newCategory)) {
        setAddForm(prev => ({
          ...prev,
          categorie: [...prev.categorie, newCategory]
        }));
      }
      e.target.value = '';
    }
  };

  const parseCategories = (categorieStr) => {
    if (!categorieStr) return [];
    try {
      if (typeof categorieStr === 'string') {
        if (categorieStr.startsWith('[') || categorieStr.startsWith('{')) {
          try {
            const parsed = JSON.parse(categorieStr);
            return Array.isArray(parsed) ? parsed : [categorieStr];
          } catch (e) {
            return categorieStr.split(',').map(cat => cat.trim());
          }
        }
        return categorieStr.split(',').map(cat => cat.trim());
      }
      return Array.isArray(categorieStr) ? categorieStr : [categorieStr];
    } catch (e) {
      console.error('Error parsing categories:', e);
      return [categorieStr];
    }
  };

  const colors = d3.scaleOrdinal(d3.schemeSet3);

  const getCategoryColor = (category) => {
    return colors(category);
  };

  const CompanyLogo = ({ logoUrl, companyName, size = "h-12 w-12" }) => {
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(true);
    const defaultLogoUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(companyName)}&background=random&size=100`;
    
    useEffect(() => {
      setError(false);
      setLoading(true);

      if (logoUrl) {
        const img = new Image();
        img.onload = () => {
          setError(false);
          setLoading(false);
        };
        img.onerror = () => {
          console.error('Failed to load image:', logoUrl);
          setError(true);
          setLoading(false);
        };
        img.src = logoUrl;
      } else {
        setError(true);
        setLoading(false);
      }

      return () => {
        setError(false);
        setLoading(true);
      };
    }, [logoUrl]);

    const displayUrl = error || !logoUrl ? defaultLogoUrl : logoUrl;
    
    return (
      <div className={`relative ${size} rounded-full overflow-hidden bg-gray-100 flex items-center justify-center border-2 border-gray-200`}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}
        <img
          src={displayUrl}
          alt={`${companyName} logo`}
          className={`w-full h-full object-cover transition-opacity duration-200 ${loading ? 'opacity-0' : 'opacity-100'}`}
          onError={(e) => {
            console.error('Error loading image:', displayUrl);
            if (!error) {
              setError(true);
              setLoading(false);
            }
          }}
        />
      </div>
    );
  };

  const CompanyCard = ({ company }) => {
    return (
      <div className="relative bg-white/95 backdrop-blur-sm rounded-xl shadow-sm ring-1 ring-gray-200 h-full p-6 hover:shadow-md transition-shadow duration-200">
        <div className="flex flex-col h-full">
          <div className="flex items-start justify-between mb-4">
            {/* Logo et Informations principales */}
            <div className="flex items-start space-x-4 flex-grow min-w-0">
              <CompanyLogo logoUrl={company.logo_url} companyName={company.nom} size="h-14 w-14" />
              <div className="flex-grow min-w-0">
                <h3 className="text-base font-semibold text-gray-900 truncate">
                  {company.nom}
                </h3>
                {company.description && (
                  <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                    {company.description}
                  </p>
                )}
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex items-start space-x-2 ml-4 flex-shrink-0">
              <button
                onClick={() => {
                  setEditingCompany(company);
                  setEditForm({
                    id: company.id,
                    nom: company.nom,
                    description: company.description || '',
                    categorie: normalizeCategories(company.categorie),
                    site_web: company.site_web || '',
                    localisation: company.localisation || '',
                    logo_url: company.logo_url || '',
                    logo_file: null
                  });
                  setIsModalOpen(true);
                }}
                className="inline-flex items-center justify-center rounded-full p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors"
              >
                <PencilIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => handleDelete(company.id)}
                className="inline-flex items-center justify-center rounded-full p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="flex-grow">
            {/* Catégories */}
            {company.categorie && (
              <div className="flex flex-wrap gap-2">
                {parseCategories(company.categorie).map((cat, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: getCategoryColor(cat),
                      color: '#1a1a1a'
                    }}
                  >
                    {cat}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Informations supplémentaires */}
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500">
            {company.localisation && (
              <div className="flex items-center space-x-1">
                <MapPinIcon className="h-4 w-4" />
                <span>{company.localisation}</span>
              </div>
            )}
            {company.site_web && (
              <a
                href={company.site_web}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1 hover:text-gray-700 transition-colors"
              >
                <GlobeAltIcon className="h-4 w-4" />
                <span>Site web</span>
              </a>
            )}
          </div>
        </div>
      </div>
    );
  };

  const AddModal = () => (
    <Transition.Root show={showAddModal} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={setShowAddModal}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white/95 backdrop-blur-sm px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:p-6">
                <div>
                  <div className="mt-3 text-center sm:mt-5">
                    <Dialog.Title as="h3" className="text-2xl font-semibold leading-6 text-gray-900 mb-8">
                      Ajouter une entreprise
                    </Dialog.Title>
                  </div>
                </div>

                <form onSubmit={handleSubmitAdd} className="mt-6 space-y-8">
                  {/* Logo section */}
                  <div className="form-group">
                    <label htmlFor="logoUrl" className="block text-sm font-medium leading-6 text-gray-900">URL du Logo</label>
                    <div className="mt-2.5">
                      <input
                        type="url"
                        id="logoUrl"
                        className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                        value={addForm.logo_url}
                        onChange={(e) => setAddForm({ ...addForm, logo_url: e.target.value })}
                        placeholder="Entrez l'URL de l'image du logo"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-x-8 gap-y-6">
                    {/* Colonne gauche */}
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Nom de l'entreprise *
                        </label>
                        <input
                          type="text"
                          name="nom"
                          value={addForm.nom}
                          onChange={handleAddFormChange}
                          required
                          className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm py-3 px-5 bg-white/90 transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Description
                        </label>
                        <textarea
                          name="description"
                          value={addForm.description}
                          onChange={handleAddFormChange}
                          rows={4}
                          className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm py-3 px-5 bg-white/90 transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Catégories
                        </label>
                        <input
                          type="text"
                          onKeyDown={handleAddCategoryKeyDown}
                          className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm py-3 px-5 bg-white/90 transition-colors"
                          placeholder="Appuyez sur Entrée pour ajouter"
                        />
                        <div className="mt-2 flex flex-wrap gap-2">
                          {(addForm.categorie || []).map((cat, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center rounded-full bg-green-100 px-3 py-0.5 text-sm font-medium text-green-800"
                            >
                              {cat}
                              <button
                                type="button"
                                onClick={() => removeCategory(cat)}
                                className="ml-1 inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-green-600 hover:bg-green-200 hover:text-green-500 focus:bg-green-500 focus:text-white focus:outline-none"
                              >
                                <XMarkIcon className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Site web
                        </label>
                        <div className="mt-2 relative rounded-lg shadow-sm">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <GlobeAltIcon className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="url"
                            name="site_web"
                            value={addForm.site_web}
                            onChange={handleAddFormChange}
                            className="block w-full rounded-lg border-gray-300 pl-10 focus:border-green-500 focus:ring-green-500 sm:text-sm py-3 px-5 bg-white/90 transition-colors"
                            placeholder="https://example.com"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Localisation
                        </label>
                        <div className="mt-2 relative rounded-lg shadow-sm">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <MapPinIcon className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            name="localisation"
                            value={addForm.localisation}
                            onChange={handleAddFormChange}
                            className="block w-full rounded-lg border-gray-300 pl-10 focus:border-green-500 focus:ring-green-500 sm:text-sm py-3 px-5 bg-white/90 transition-colors"
                            placeholder="Paris, France"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex justify-end space-x-3 border-t pt-6">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="inline-flex justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={uploading}
                      className="inline-flex justify-center rounded-lg border border-transparent bg-gradient-to-r from-green-400 to-green-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:from-green-500 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {uploading ? 'Création...' : 'Créer l\'entreprise'}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );

  const FiltersPanel = () => (
    <div className="bg-white/95 backdrop-blur-sm shadow-lg rounded-lg p-4 mb-4">
      <div className="space-y-4">
        {/* Filtre par catégorie */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Catégories</h3>
          <div className="flex flex-wrap gap-2">
            {Array.from(new Set(companies.flatMap(company => 
              parseCategories(company.categorie)
            ))).sort().map((category, index) => (
              <button
                key={index}
                onClick={() => setFilters(prev => ({
                  ...prev,
                  categories: prev.categories.includes(category)
                    ? prev.categories.filter(c => c !== category)
                    : [...prev.categories, category]
                }))}
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors duration-200 ${
                  filters.categories.includes(category) ? 'ring-2 ring-gray-500' : ''
                }`}
                style={{
                  backgroundColor: getCategoryColor(category),
                  color: '#1a1a1a'
                }}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Filtre par localisation */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Localisations</h3>
          <div className="flex flex-wrap gap-2">
            {Array.from(new Set(companies.map(company => company.localisation))).filter(Boolean).sort().map((location, index) => (
              <button
                key={index}
                onClick={() => setFilters(prev => ({
                  ...prev,
                  locations: prev.locations.includes(location)
                    ? prev.locations.filter(l => l !== location)
                    : [...prev.locations, location]
                }))}
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  filters.locations.includes(location)
                    ? 'bg-gray-200 text-gray-800'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {location}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // eslint-disable-next-line no-unused-vars
  const getAllCategories = () => {
    const categories = new Set();
    companies.forEach(company => {
      if (company.categorie) {
        const normalized = normalizeCategories(company.categorie);
        normalized.forEach(cat => categories.add(cat));
      }
    });
    return Array.from(categories).sort();
  };

  // eslint-disable-next-line no-unused-vars
  const getAllLocations = () => {
    const locations = new Set();
    companies.forEach(company => {
      if (company.localisation) {
        locations.add(company.localisation);
      }
    });
    return Array.from(locations).sort();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* En-tête avec boutons d'action */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Liste des entreprises
        </h2>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowImportModal(true)}
            className="inline-flex items-center px-4 py-2.5 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <ArrowUpTrayIcon className="h-5 w-5 mr-2" />
            Importer
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Ajouter
          </button>
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="mb-8">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="relative flex-grow">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full rounded-lg border-gray-300 pl-10 focus:border-green-500 focus:ring-green-500 sm:text-sm py-3"
              placeholder="Rechercher une entreprise..."
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center px-4 py-2.5 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
              showFilters ? 'bg-gray-50' : ''
            }`}
          >
            <FunnelIcon className="h-5 w-5 mr-2" />
            Filtres
            {(filters.categories.length > 0 || filters.locations.length > 0) && (
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-800">
                {filters.categories.length + filters.locations.length}
              </span>
            )}
          </button>
        </div>

        {/* Panneau de filtres */}
        {showFilters && <FiltersPanel />}

        {/* Filtres actifs */}
        {(filters.categories.length > 0 || filters.locations.length > 0) && (
          <div className="flex flex-wrap gap-2 items-center mt-4">
            <span className="text-sm text-gray-500">Filtres actifs:</span>
            {filters.categories.map(category => (
              <span
                key={category}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: getCategoryColor(category),
                  color: '#1a1a1a'
                }}
              >
                {category}
                <button
                  onClick={() => setFilters(prev => ({
                    ...prev,
                    categories: prev.categories.filter(c => c !== category)
                  }))}
                  className="ml-1.5 hover:text-gray-600"
                >
                  <XMarkIcon className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
            {filters.locations.map(location => (
              <span
                key={location}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600"
              >
                {location}
                <button
                  onClick={() => setFilters(prev => ({
                    ...prev,
                    locations: prev.locations.filter(l => l !== location)
                  }))}
                  className="ml-1.5 hover:text-gray-800"
                >
                  <XMarkIcon className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
            <button
              onClick={() => setFilters({ categories: [], locations: [] })}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Effacer tous les filtres
            </button>
          </div>
        )}
      </div>

      {/* Message de statut */}
      {message.content && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {message.content}
        </div>
      )}

      {/* Liste des entreprises */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 mt-8">
        {filteredCompanies.map((company) => (
          <div key={company.id} className="w-full">
            <CompanyCard company={company} />
          </div>
        ))}
      </div>
      {/* Modales existantes */}
      <Transition.Root show={isModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={setIsModalOpen}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white/95 backdrop-blur-sm px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:p-6">
                  <div>
                    <div className="mt-3 text-center sm:mt-5">
                      <Dialog.Title as="h3" className="text-2xl font-semibold leading-6 text-gray-900 mb-8">
                        Modifier l'entreprise
                      </Dialog.Title>
                    </div>
                  </div>

                  <form onSubmit={handleSubmitEdit} className="mt-6 space-y-8">
                    {/* Logo section */}
                    <div className="form-group">
                      <label htmlFor="editLogoUrl" className="block text-sm font-medium leading-6 text-gray-900">URL du Logo</label>
                      <div className="mt-2.5">
                        <input
                          type="url"
                          id="editLogoUrl"
                          className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                          value={editForm.logo_url}
                          onChange={(e) => setEditForm({ ...editForm, logo_url: e.target.value })}
                          placeholder="Entrez l'URL de l'image du logo"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-x-8 gap-y-6">
                      {/* Colonne gauche */}
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-3">
                            Nom de l'entreprise *
                          </label>
                          <input
                            type="text"
                            name="nom"
                            value={editForm?.nom || ''}
                            onChange={(e) => handleChange(e, editForm)}
                            required
                            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm py-3 px-5 bg-white/90 transition-colors"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-3">
                            Description
                          </label>
                          <textarea
                            name="description"
                            value={editForm?.description || ''}
                            onChange={(e) => handleChange(e, editForm)}
                            rows={4}
                            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm py-3 px-5 bg-white/90 transition-colors"
                          />
                        </div>
                      </div>

                      {/* Colonne droite */}
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-3">
                            Catégories
                          </label>
                          <input
                            type="text"
                            onKeyDown={handleCategoryChange}
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm py-3 px-5 bg-white/90 transition-colors"
                            placeholder="Appuyez sur Entrée pour ajouter"
                          />
                          <div className="mt-2 flex flex-wrap gap-2">
                            {(editForm?.categorie || []).map((cat, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center rounded-full bg-green-100 px-3 py-0.5 text-sm font-medium text-green-800"
                              >
                                {cat}
                                <button
                                  type="button"
                                  onClick={() => removeCategory(cat)}
                                  className="ml-1 inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-green-600 hover:bg-green-200 hover:text-green-500 focus:bg-green-500 focus:text-white focus:outline-none"
                                >
                                  <XMarkIcon className="h-3 w-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-3">
                            Site web
                          </label>
                          <div className="mt-2 relative rounded-lg shadow-sm">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                              <GlobeAltIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                              type="url"
                              name="site_web"
                              value={editForm?.site_web || ''}
                              onChange={(e) => handleChange(e, editForm)}
                              className="block w-full rounded-lg border-gray-300 pl-10 focus:border-green-500 focus:ring-green-500 sm:text-sm py-3 px-5 bg-white/90 transition-colors"
                              placeholder="https://example.com"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-3">
                            Localisation
                          </label>
                          <div className="mt-2 relative rounded-lg shadow-sm">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                              <MapPinIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                              type="text"
                              name="localisation"
                              value={editForm?.localisation || ''}
                              onChange={(e) => handleChange(e, editForm)}
                              className="block w-full rounded-lg border-gray-300 pl-10 focus:border-green-500 focus:ring-green-500 sm:text-sm py-3 px-5 bg-white/90 transition-colors"
                              placeholder="Paris, France"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 flex justify-end space-x-3 border-t pt-6">
                      <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="inline-flex justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        disabled={loading || uploading}
                        className="inline-flex justify-center rounded-lg border border-transparent bg-gradient-to-r from-green-400 to-green-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:from-green-500 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading || uploading ? 'Enregistrement...' : 'Enregistrer'}
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Modal d'import CSV */}
      <Transition.Root show={showImportModal} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-10"
          onClose={setShowImportModal}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white/95 backdrop-blur-sm px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:p-6">
                  <div>
                    <div className="mt-3 text-center sm:mt-5">
                      <Dialog.Title
                        as="h3"
                        className="text-base font-semibold leading-6 text-gray-900"
                      >
                        Importer des entreprises
                      </Dialog.Title>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          Sélectionnez un fichier CSV contenant la liste des entreprises à importer.
                          Les colonnes suivantes sont supportées : nom, description, categorie(s), site_web, localisation.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 sm:mt-6">
                    <ImportCSV
                      session={session}
                      onImportComplete={() => {
                        setShowImportModal(false);
                        getCompanies();
                        fetchAllCategories();
                      }}
                      allCategories={allCategories}
                    />
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>

      {AddModal()}
    </div>
  );
};

export default EntreprisesList;
