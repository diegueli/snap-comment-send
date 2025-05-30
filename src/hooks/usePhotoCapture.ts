
import { useState, useRef, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { CapturedPhoto } from '@/types/auditoria';

export const usePhotoCapture = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const capturePhoto = useCallback((
    videoRef: React.RefObject<HTMLVideoElement>,
    currentPhotos: CapturedPhoto[]
  ): CapturedPhoto | null => {
    if (!videoRef.current || !canvasRef.current || currentPhotos.length >= 3) {
      if (currentPhotos.length >= 3) {
        toast({
          title: "Máximo de fotos alcanzado",
          description: "Solo puedes tomar hasta 3 fotos por conjunto.",
          variant: "destructive",
        });
      }
      return null;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (context) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);
      
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      const newPhoto: CapturedPhoto = {
        id: Date.now().toString(),
        dataUrl,
        timestamp: new Date()
      };

      toast({
        title: "¡Foto capturada!",
        description: `Foto ${currentPhotos.length + 1}/3 guardada`,
      });

      return newPhoto;
    }
    return null;
  }, []);

  return {
    canvasRef,
    capturePhoto
  };
};
