
import { useRef, useCallback } from 'react';
import { CapturedPhoto } from '@/types/auditoria';

export const usePhotoCapture = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

  const capturePhoto = useCallback(
    async (
      videoRef: React.RefObject<HTMLVideoElement>,
      currentPhotos: CapturedPhoto[]
    ): Promise<CapturedPhoto | null> => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (!video || !canvas) {
        console.error('Video or canvas not available');
        return null;
      }

      try {
        // Set canvas dimensions to video dimensions
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw video frame to canvas
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          console.error('Could not get canvas context');
          return null;
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert canvas to blob
        return new Promise((resolve) => {
          canvas.toBlob(async (blob) => {
            if (!blob) {
              console.error('Could not create blob from canvas');
              resolve(null);
              return;
            }

            // Create file from blob
            const file = new File([blob], `photo_${Date.now()}.jpg`, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });

            // Resize the image
            const resizedFile = await resizeImage(file);

            const newPhoto: CapturedPhoto = {
              id: Date.now().toString(),
              file: resizedFile,
              timestamp: new Date(),
            };

            resolve(newPhoto);
          }, 'image/jpeg', 0.9);
        });
      } catch (error) {
        console.error('Error capturing photo:', error);
        return null;
      }
    },
    [resizeImage]
  );

  return { canvasRef, capturePhoto };
};
