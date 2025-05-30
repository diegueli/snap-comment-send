
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const usePhotoUpload = () => {
  const [uploading, setUploading] = useState(false);

  const resizeImage = (file: Blob, maxWidth: number = 800, maxHeight: number = 600, quality: number = 0.8): Promise<Blob> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        canvas.toBlob(resolve, 'image/jpeg', quality);
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const uploadPhoto = async (dataUrl: string, codigoAuditoria: string, areaName: string): Promise<string> => {
    try {
      setUploading(true);

      // Convert dataUrl to blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();

      // Resize image for optimization
      const resizedBlob = await resizeImage(blob);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      // Create unique filename using codigo_auditoria
      const timestamp = new Date().getTime();
      const fileName = `${codigoAuditoria}/${areaName}_${timestamp}.jpg`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('bucket_auditorias')
        .upload(fileName, resizedBlob, {
          contentType: 'image/jpeg',
          upsert: false
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('bucket_auditorias')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({
        title: "Error al subir foto",
        description: "No se pudo subir la imagen. Intente nuevamente.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const deletePhoto = async (photoUrl: string): Promise<void> => {
    try {
      // Extract file path from URL
      const urlParts = photoUrl.split('/');
      const bucketIndex = urlParts.findIndex(part => part === 'bucket_auditorias');
      if (bucketIndex === -1) throw new Error('URL de foto inválida');
      
      const filePath = urlParts.slice(bucketIndex + 1).join('/');

      const { error } = await supabase.storage
        .from('bucket_auditorias')
        .remove([filePath]);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting photo:', error);
      toast({
        title: "Error al eliminar foto",
        description: "No se pudo eliminar la imagen.",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    uploadPhoto,
    deletePhoto,
    uploading
  };
};
