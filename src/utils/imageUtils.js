import { supabase } from '../supabaseClient';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const VALID_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const STORAGE_BUCKET = 'logos';

export const validateImage = (file) => {
  if (!file) {
    throw new Error('Aucun fichier sélectionné');
  }

  if (!VALID_TYPES.includes(file.type)) {
    throw new Error('Format de fichier non supporté. Utilisez JPG, PNG, GIF ou WebP');
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error('Le fichier est trop volumineux. Taille maximum: 5MB');
  }

  return true;
};

export const generateFileName = (file) => {
  try {
    const fileExt = file.name.split('.').pop().toLowerCase();
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    return `${timestamp}-${randomString}.${fileExt}`;
  } catch (error) {
    console.error('Error generating file name:', error);
    throw new Error('Erreur lors de la génération du nom de fichier');
  }
};

export const uploadImage = async (file) => {
  try {
    validateImage(file);
    
    const fileName = generateFileName(file);
    console.log('Uploading file:', fileName);
    
    const { error: uploadError, data } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }

    console.log('File uploaded successfully');

    const { data: { publicUrl } } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(fileName);

    console.log('Generated public URL:', publicUrl);

    return {
      fileName,
      publicUrl
    };
  } catch (error) {
    console.error('Error in uploadImage:', error);
    throw new Error(`Erreur lors du téléchargement: ${error.message}`);
  }
};

export const deleteImage = async (url) => {
  if (!url) return;
  
  try {
    const fileName = url.split('/').pop();
    console.log('Deleting file:', fileName);
    
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([fileName]);

    if (error) {
      console.error('Error deleting file:', error);
      throw error;
    }

    console.log('File deleted successfully');
  } catch (error) {
    console.error('Error in deleteImage:', error);
    // Ne pas propager l'erreur pour éviter de bloquer d'autres opérations
  }
};

export const updateImage = async (oldUrl, newFile) => {
  try {
    // Si pas de nouveau fichier, garder l'ancienne URL
    if (!newFile) {
      return { publicUrl: oldUrl };
    }

    console.log('Starting image update process');

    // Supprimer l'ancienne image si elle existe
    if (oldUrl) {
      console.log('Deleting old image:', oldUrl);
      await deleteImage(oldUrl);
    }

    // Uploader la nouvelle image
    console.log('Uploading new image');
    const result = await uploadImage(newFile);
    console.log('Image update completed successfully');
    
    return result;
  } catch (error) {
    console.error('Error in updateImage:', error);
    throw new Error(`Erreur lors de la mise à jour de l'image: ${error.message}`);
  }
};
