
import { useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { CapturedPhoto, PhotoSet } from '@/types/auditoria';

interface UsePhotoActionsProps {
  currentPhotos: CapturedPhoto[];
  setCurrentPhotos: (photos: CapturedPhoto[]) => void;
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
  generateNumberedArea: (areaName: string, existingSets: PhotoSet[]) => string;
  stopCamera?: () => void;
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
  generateNumberedArea,
  stopCamera
}: UsePhotoActionsProps) => {

  const deletePhoto = useCallback((photoId: string) => {
    setCurrentPhotos(currentPhotos.filter(photo => photo.id !== photoId));
  }, [currentPhotos, setCurrentPhotos]);

  const saveCurrentSet = useCallback(() => {
    if (currentPhotos.length === 0 || !currentArea.trim()) {
      toast({
        title: "No se puede guardar",
        description: "Necesita fotos y un área definida.",
        variant: "destructive",
      });
      return;
    }

    setPhotoSets(prev => {
      const numberedArea = generateNumberedArea(currentArea, prev);
      const newSet: PhotoSet = {
        id: Date.now().toString(),
        area: numberedArea,
        photos: [...currentPhotos],
        levantamiento: currentLevantamiento,
        responsable: currentResponsable,
        gerencia_resp_id: currentResponsableId,
        timestamp: new Date()
      };
      return [...prev, newSet];
    });

    // Reset current state
    setCurrentPhotos([]);
    setCurrentArea('');
    setCurrentLevantamiento('');
    setCurrentResponsable('');
    setCurrentResponsableId(null);
    setShowAreaInput(true);

    toast({
      title: "Conjunto guardado",
      description: "Las fotos han sido guardadas exitosamente.",
    });
  }, [
    currentPhotos, 
    currentArea, 
    currentLevantamiento, 
    currentResponsable, 
    currentResponsableId,
    setPhotoSets, 
    setCurrentPhotos, 
    setCurrentArea, 
    setCurrentLevantamiento, 
    setCurrentResponsable,
    setCurrentResponsableId,
    setShowAreaInput,
    generateNumberedArea
  ]);

  const deletePhotoSet = useCallback((setId: string) => {
    setPhotoSets(prev => prev.filter(set => set.id !== setId));
    toast({
      title: "Conjunto eliminado",
      description: "El conjunto de fotos ha sido eliminado.",
    });
  }, [setPhotoSets]);

  const deletePhotoFromSet = useCallback((setId: string, photoId: string) => {
    setPhotoSets(prev => prev.map(set => 
      set.id === setId 
        ? { ...set, photos: set.photos.filter(photo => photo.id !== photoId) }
        : set
    ));
  }, [setPhotoSets]);

  const updatePhotoSet = useCallback((setId: string, updates: Partial<PhotoSet>) => {
    setPhotoSets(prev => prev.map(set => 
      set.id === setId 
        ? { ...set, ...updates }
        : set
    ));

    toast({
      title: "Conjunto actualizado",
      description: "El conjunto ha sido actualizado correctamente.",
    });
  }, [setPhotoSets]);

  // Nueva función para detener cámara cuando hay menos de 3 fotos
  const handleStopCameraWithFewPhotos = useCallback(() => {
    if (currentPhotos.length > 0 && currentPhotos.length < 3) {
      if (stopCamera) {
        stopCamera();
      }
      toast({
        title: "Cámara detenida",
        description: `Se han capturado ${currentPhotos.length} foto(s). Puede continuar al siguiente conjunto.`,
      });
    }
  }, [currentPhotos.length, stopCamera]);

  return {
    deletePhoto,
    saveCurrentSet,
    deletePhotoSet,
    deletePhotoFromSet,
    updatePhotoSet,
    handleStopCameraWithFewPhotos
  };
};
