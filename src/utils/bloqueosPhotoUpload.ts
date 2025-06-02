
import { supabase } from '@/integrations/supabase/client';

interface Photo {
  id: string;
  url: string;
  file: File;
}

export const uploadBloqueosPhotos = async (
  photos: Photo[],
  codigoBloqueo: string
): Promise<string[]> => {
  const uploadedUrls: string[] = [];

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    const fileName = `${codigoBloqueo}/foto_${i + 1}_${Date.now()}.jpg`;
    
    try {
      const { data, error } = await supabase.storage
        .from('bucket_bloqueos')
        .upload(fileName, photo.file, {
          contentType: 'image/jpeg',
          upsert: false
        });

      if (error) {
        console.error(`Error uploading photo ${i + 1}:`, error);
        throw error;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('bucket_bloqueos')
        .getPublicUrl(fileName);

      uploadedUrls.push(urlData.publicUrl);
    } catch (error) {
      console.error(`Failed to upload photo ${i + 1}:`, error);
      throw new Error(`Error al subir la foto ${i + 1}`);
    }
  }

  return uploadedUrls;
};
