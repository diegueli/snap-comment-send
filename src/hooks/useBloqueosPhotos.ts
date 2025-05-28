
import { useState, useEffect } from 'react';

interface CapturedPhoto {
  id: string;
  dataUrl: string;
  timestamp: Date;
}

const STORAGE_KEY = 'bloqueosPhotos';

export const useBloqueosPhotos = () => {
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);

  useEffect(() => {
    const savedPhotos = localStorage.getItem(STORAGE_KEY);
    if (savedPhotos) {
      try {
        const parsedPhotos = JSON.parse(savedPhotos);
        setPhotos(parsedPhotos);
      } catch (error) {
        console.error('Error parsing saved photos:', error);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const updatePhotos = (newPhotos: CapturedPhoto[]) => {
    setPhotos(newPhotos);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newPhotos));
  };

  const clearPhotos = () => {
    setPhotos([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const addPhoto = (photo: CapturedPhoto) => {
    const updatedPhotos = [...photos, photo];
    updatePhotos(updatedPhotos);
  };

  const removePhoto = (photoId: string) => {
    const updatedPhotos = photos.filter(photo => photo.id !== photoId);
    updatePhotos(updatedPhotos);
  };

  return {
    photos,
    updatePhotos,
    clearPhotos,
    addPhoto,
    removePhoto,
  };
};
