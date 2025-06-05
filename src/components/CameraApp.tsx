import React, { useCallback, useEffect } from 'react';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import AuditoriaForm from './AuditoriaForm';
import AuditoriaHeader from './auditoria/AuditoriaHeader';
import AreaInput from './auditoria/AreaInput';
import CameraView from './auditoria/CameraView';
import PhotoGallery from './auditoria/PhotoGallery';
import SavedPhotoSets from './auditoria/SavedPhotoSets';
import ActionButtons from './auditoria/ActionButtons';
import { useCamera } from '@/hooks/useCamera';
import { usePhotoCapture } from '@/hooks/usePhotoCapture';
import { useAuditoriaState } from '@/hooks/useAuditoriaState';
import { usePhotoActions } from '@/hooks/usePhotoActions';
import { generatePDF } from '@/utils/pdfGenerator';
import { closeAuditoria } from '@/utils/auditoriaStorage';
import { 
  UserData, 
  AuditoriaFormData,
  AuditoriaData
} from '@/types/auditoria';

interface CameraAppProps {
  onClose?: () => void;
  userData: UserData | null;
  auditoriaData?: (AuditoriaFormData & { codigoAuditoria: string }) | null;
}

const CameraApp = ({ onClose, userData, auditoriaData: initialAuditoriaData }: CameraAppProps) => {
  const {
    auditoriaData,
    selectedPlanta,
    currentPhotos,
    currentArea,
    currentLevantamiento,
    currentResponsable,
    currentResponsableId,
    photoSets,
    editingSetId,
    editingLevantamiento,
    editingResponsable,
    editingResponsableId,
    editingAreaId,
    editingArea,
    showAreaInput,
    codigoAuditoria,
    isSavingToDatabase,
    setAuditoriaData,
    setSelectedPlanta,
    setCurrentPhotos,
    setCurrentArea,
    setCurrentLevantamiento,
    setCurrentResponsable,
    setCurrentResponsableId,
    setPhotoSets,
    setEditingSetId,
    setEditingLevantamiento,
    setEditingResponsable,
    setEditingResponsableId,
    setEditingAreaId,
    setEditingArea,
    setShowAreaInput,
    setCodigoAuditoria,
    setIsSavingToDatabase,
    resetState,
    getNumberedArea
  } = useAuditoriaState();

  const { 
    isCapturing, 
    cameraPermission, 
    videoRef, 
    startCamera, 
    stopCamera 
  } = useCamera();

  const { canvasRef, capturePhoto } = usePhotoCapture();

  const {
    deletePhoto,
    saveCurrentSet,
    deletePhotoSet,
    deletePhotoFromSet,
    updatePhotoSet
  } = usePhotoActions({
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
  });

  const handleAuditoriaSubmit = useCallback(async (formData: AuditoriaFormData & { codigoAuditoria: string }) => {
    try {
      const { data: planta, error } = await supabase
        .from('plantas')
        .select('id, nombre, iniciales')
        .eq('id', formData.plantaId)
        .single();

      if (error) throw error;
      
      setSelectedPlanta(planta);
      const auditoriaDataWithCode = {
        ...formData,
        codigoAuditoria: formData.codigoAuditoria
      };
      setAuditoriaData(auditoriaDataWithCode);
      setCodigoAuditoria(formData.codigoAuditoria);
    } catch (error) {
      console.error('Error fetching planta:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar la información de la planta.",
        variant: "destructive",
      });
    }
  }, [setSelectedPlanta, setAuditoriaData, setCodigoAuditoria]);

  const handleResponsableChange = useCallback((responsable: string, gerenciaId?: number) => {
    setCurrentResponsable(responsable);
    setCurrentResponsableId(gerenciaId || null);
  }, [setCurrentResponsable, setCurrentResponsableId]);

  const handleStartCamera = useCallback(async () => {
    const success = await startCamera(currentArea);
    if (success) {
      setShowAreaInput(false);
    } else {
      setShowAreaInput(true);
    }
  }, [startCamera, currentArea, setShowAreaInput]);

  const handleCapturePhoto = useCallback(async () => {
    const newPhoto = await capturePhoto(videoRef, currentPhotos);
    if (newPhoto) {
      setCurrentPhotos(prev => [...prev, newPhoto]);
    }
  }, [capturePhoto, videoRef, currentPhotos, setCurrentPhotos]);

  const handleStopCamera = useCallback(() => {
    stopCamera();
    if (currentPhotos.length > 0) {
      toast({
        title: "Cámara detenida",
        description: "Complete la información y guarde el conjunto antes de continuar.",
      });
    }
  }, [stopCamera, currentPhotos.length]);

  const handleCloseAuditoria = useCallback(async () => {
    if (!auditoriaData || !userData) return;
    
    setIsSavingToDatabase(true);
    
    const result = await closeAuditoria(auditoriaData, userData, photoSets);
    
    setIsSavingToDatabase(false);
    
    if (result.success && result.codigoAuditoria) {
      setCodigoAuditoria(result.codigoAuditoria);
    }
  }, [auditoriaData, userData, photoSets, setIsSavingToDatabase, setCodigoAuditoria]);

  const handleGeneratePDF = useCallback(async () => {
    await generatePDF({
      photoSets,
      auditoriaData,
      userData,
      selectedPlanta,
      auditoriaId: null,
      codigoAuditoria
    });
  }, [photoSets, auditoriaData, userData, selectedPlanta, codigoAuditoria]);

  const resetApp = useCallback(async () => {
    resetState();
    stopCamera();
    toast({
      title: "Aplicación reiniciada",
      description: "Todos los datos han sido limpiados.",
    });
  }, [resetState, stopCamera]);

  // Set initial auditoria data if provided
  useEffect(() => {
    if (initialAuditoriaData && !auditoriaData) {
      handleAuditoriaSubmit(initialAuditoriaData);
    }
  }, [initialAuditoriaData, auditoriaData]);

  if (!auditoriaData) {
    return (
      <div className="bg-gradient-to-br from-yellow-400 via-red-500 to-orange-600 min-h-[80vh] p-4">
        <div className="max-w-md mx-auto space-y-6">
          {onClose && (
            <div className="flex justify-end mb-4">
              <Button
                onClick={onClose}
                variant="outline"
                size="sm"
                className="bg-white/80 backdrop-blur-sm border-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
            </div>
          )}
          <AuditoriaForm 
            onSubmit={handleAuditoriaSubmit}
            userData={userData}
          />
          <div className="flex justify-center mt-6">
            <Button
              onClick={resetApp}
              variant="outline"
              className="bg-white/80 backdrop-blur-sm border-white"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reiniciar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-yellow-400 via-red-500 to-orange-600 min-h-[80vh] p-4">
      <div className="max-w-md mx-auto space-y-6">
        {onClose && (
          <div className="flex justify-end mb-4">
            <Button
              onClick={onClose}
              variant="outline"
              size="sm"
              className="bg-white/80 backdrop-blur-sm border-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          </div>
        )}

        <AuditoriaHeader auditoriaData={auditoriaData} codigoAuditoria={codigoAuditoria} />

        {(showAreaInput || (!isCapturing && currentPhotos.length === 0)) && (
          <AreaInput
            currentArea={currentArea}
            setCurrentArea={setCurrentArea}
            onStartCamera={handleStartCamera}
            cameraPermission={cameraPermission}
          />
        )}

        {isCapturing && (
          <CameraView
            videoRef={videoRef}
            currentPhotos={currentPhotos}
            currentArea={currentArea}
            onCapturePhoto={handleCapturePhoto}
            onStopCamera={handleStopCamera}
          />
        )}

        {currentPhotos.length > 0 && (
          <PhotoGallery
            currentPhotos={currentPhotos}
            currentArea={currentArea}
            currentLevantamiento={currentLevantamiento}
            currentResponsable={currentResponsable}
            setCurrentLevantamiento={setCurrentLevantamiento}
            setCurrentResponsable={handleResponsableChange}
            onDeletePhoto={deletePhoto}
            onStartCamera={handleStartCamera}
            onSaveCurrentSet={saveCurrentSet}
          />
        )}

        <SavedPhotoSets
          photoSets={photoSets}
          editingSetId={editingSetId}
          editingLevantamiento={editingLevantamiento}
          editingResponsable={editingResponsable}
          editingAreaId={editingAreaId}
          editingArea={editingArea}
          setEditingSetId={setEditingSetId}
          setEditingLevantamiento={setEditingLevantamiento}
          setEditingResponsable={setEditingResponsable}
          setEditingAreaId={setEditingAreaId}
          setEditingArea={setEditingArea}
          onUpdatePhotoSet={updatePhotoSet}
          onDeletePhotoSet={deletePhotoSet}
          onDeletePhotoFromSet={deletePhotoFromSet}
        />

        <ActionButtons
          photoSetsLength={photoSets.length}
          onCloseAuditoria={handleCloseAuditoria}
          onGeneratePDF={handleGeneratePDF}
          onResetApp={resetApp}
          isSavingToDatabase={isSavingToDatabase}
        />


        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
};

export default CameraApp;
