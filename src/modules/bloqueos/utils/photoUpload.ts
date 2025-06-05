
import { supabase } from '@/integrations/supabase/client';
import { BloqueosPhoto } from '../types';

export const uploadBloqueosPhotos = async (
  photos: BloqueosPhoto[], 
  codigoBloqueo: string
): Promise<string[]> => {
  const uploadPromises = photos.map(async (photo, index) => {
    try {
      const fileName = `${codigoBloqueo}_foto_${index + 1}_${Date.now()}.jpg`;
      const filePath = `bloqueos/${codigoBloqueo}/${fileName}`;
      
      const { data, error } = await supabase.storage
        .from('auditoria-photos')
        .upload(filePath, photo.file, {
          contentType: 'image/jpeg',
          upsert: false
        });

      if (error) {
        console.error('Error uploading photo:', error);
        throw error;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('auditoria-photos')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error in photo upload:', error);
      throw error;
    }
  });

  try {
    const urls = await Promise.all(uploadPromises);
    return urls;
  } catch (error) {
    console.error('Error uploading photos:', error);
    throw new Error('Error al subir las fotos al servidor');
  }
};
