
import { useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { CapturedPhoto, PhotoSet } from '@/types/auditoria';

interface UsePhotoActionsProps {
  currentPhotos: CapturedPhoto[];
  setCurrentPhotos: (photos: CapturedPhoto[] | ((prev: CapturedPhoto[]) => CapturedPhoto[])) => void;
  setPhotoSets: (sets: PhotoSet[] | ((prev: PhotoSet[]) => PhotoSet[])) => void;
  currentArea: string;
  currentLevantamiento: string;
  currentResponsable: string;
  currentResponsableId: number | null;
  setCurrentArea: (area: string) => void;
  setCurrentLevantamiento: (levantamiento: string) => void;
  setCurrentResponsable: (responsable: string) => void;
  setCurrentResponsableId: (id: number | null) => void;
  setShowAreaInput: (show: boolean) => void;
  getNumberedArea: (area: string) => string;
  stopCamera: () => void; // Agregar función para cerrar cámara
}

export const usePhotoActions = ({
  currentPhotos,
  setCurrentPhotos,
  setPhotoSets,
  currentArea,
  currentLevantamiento,
  currentResponsable,
  currentResponsableId,
  setCurrentArea,
  setCurrentLevantamiento,
  setCurrentResponsable,
  setCurrentResponsableId,
  setShowAreaInput,
  getNumberedArea,
  stopCamera
}: UsePhotoActionsProps) => {
  
  const deletePhoto = useCallback((photoId: string) => {
    setCurrentPhotos(prev => prev.filter(photo => photo.id !== photoId));
    toast({
      title: "Foto eliminada",
      description: "Foto removida del conjunto actual.",
    });
  }, [setCurrentPhotos]);

  const saveCurrentSet = useCallback(async () => {
    if (currentPhotos.length === 0) {
      toast({
        title: "No hay fotos para guardar",
        description: "Por favor capture al menos una foto primero.",
        variant: "destructive",
      });
      return;
    }

    if (!currentArea.trim()) {
      toast({
        title: "Área requerida",
        description: "Por favor ingrese el área.",
        variant: "destructive",
      });
      return;
    }

    const numberedArea = getNumberedArea(currentArea.trim());

    const newSet: PhotoSet = {
      id: Date.now().toString(),
      area: numberedArea,
      photos: [...currentPhotos],
      levantamiento: currentLevantamiento,
      responsable: currentResponsable,
      gerencia_resp_id: currentResponsableId,
      timestamp: new Date()
    };

    setPhotoSets(prev => [...prev, newSet]);
    setCurrentPhotos([]);
    setCurrentArea('');
    setCurrentLevantamiento('');
    setCurrentResponsable('');
    setCurrentResponsableId(null);
    setShowAreaInput(false);
    
    // Cerrar la cámara después de guardar el conjunto
    stopCamera();
    
    toast({
      title: "¡Conjunto de fotos guardado!",
      description: `Conjunto "${newSet.area}" con ${newSet.photos.length} foto(s) agregado.`,
    });
  }, [currentPhotos, currentArea, currentLevantamiento, currentResponsable, currentResponsableId, setCurrentPhotos, setPhotoSets, setCurrentArea, setCurrentLevantamiento, setCurrentResponsable, setCurrentResponsableId, setShowAreaInput, getNumberedArea, stopCamera]);

  const deletePhotoSet = useCallback((setId: string) => {
    setPhotoSets(prev => prev.filter(set => set.id !== setId));
    toast({
      title: "Conjunto eliminado",
      description: "Conjunto removido del documento.",
    });
  }, [setPhotoSets]);

  const deletePhotoFromSet = useCallback((setId: string, photoId: string) => {
    setPhotoSets(prev => prev.map(set => {
      if (set.id === setId) {
        const updatedPhotos = set.photos.filter(photo => photo.id !== photoId);
        if (updatedPhotos.length === 0) {
          toast({
            title: "Conjunto eliminado",
            description: "Conjunto removido al no tener fotos restantes.",
          });
          return null;
        }
        toast({
          title: "Foto eliminada",
          description: "Foto removida del conjunto.",
        });
        return { ...set, photos: updatedPhotos };
      }
      return set;
    }).filter(Boolean) as PhotoSet[]);
  }, [setPhotoSets]);

  const updatePhotoSet = useCallback((setId: string, updates: Partial<PhotoSet>) => {
    setPhotoSets(prev => prev.map(set => 
      set.id === setId ? { ...set, ...updates } : set
    ));
  }, [setPhotoSets]);

  return {
    deletePhoto,
    saveCurrentSet,
    deletePhotoSet,
    deletePhotoFromSet,
    updatePhotoSet
  };
};
