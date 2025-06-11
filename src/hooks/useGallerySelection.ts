
import { useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { CapturedPhoto } from '@/types/auditoria';

export const useGallerySelection = () => {
  const selectFromGallery = useCallback(
    async (currentPhotos: CapturedPhoto[]): Promise<CapturedPhoto | null> => {
      if (currentPhotos.length >= 3) {
        toast({
          title: "Límite alcanzado",
          description: "Ya tienes 3 fotos en este conjunto.",
          variant: "destructive",
        });
        return null;
      }

      try {
        // Create file input element
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.multiple = false;

        return new Promise((resolve) => {
          input.onchange = async (event) => {
            const file = (event.target as HTMLInputElement).files?.[0];
            if (!file) {
              resolve(null);
              return;
            }

            // Validate file type
            if (!file.type.startsWith('image/')) {
              toast({
                title: "Archivo inválido",
                description: "Por favor seleccione una imagen válida.",
                variant: "destructive",
              });
              resolve(null);
              return;
            }

            // Validate file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
              toast({
                title: "Archivo muy grande",
                description: "La imagen debe ser menor a 10MB.",
                variant: "destructive",
              });
              resolve(null);
              return;
            }

            // Create resized file
            const resizedFile = await resizeImage(file);

            const newPhoto: CapturedPhoto = {
              id: Date.now().toString(),
              file: resizedFile,
              timestamp: new Date(),
            };

            toast({
              title: "Foto agregada",
              description: "Imagen seleccionada desde la biblioteca.",
            });

            resolve(newPhoto);
          };

          input.onclick = () => {
            // Reset value to allow selecting the same file again
            input.value = '';
          };

          input.oncancel = () => {
            resolve(null);
          };

          // Trigger file selection
          input.click();
        });
      } catch (error) {
        console.error('Error selecting from gallery:', error);
        toast({
          title: "Error",
          description: "No se pudo seleccionar la imagen.",
          variant: "destructive",
        });
        return null;
      }
    },
    []
  );

  const resizeImage = useCallback((file: File, maxWidth: number = 800, maxHeight: number = 600): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions maintaining aspect ratio
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
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const resizedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(resizedFile);
          }
        }, 'image/jpeg', 0.8); // 80% quality
      };

      img.src = URL.createObjectURL(file);
    });
  }, []);

  return { selectFromGallery };
};
