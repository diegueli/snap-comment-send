import React, { useState, useCallback } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import jsPDF from 'jspdf';
import AuditoriaForm from './AuditoriaForm';
import AuditoriaHeader from './auditoria/AuditoriaHeader';
import AreaInput from './auditoria/AreaInput';
import CameraView from './auditoria/CameraView';
import PhotoGallery from './auditoria/PhotoGallery';
import SavedPhotoSets from './auditoria/SavedPhotoSets';
import ActionButtons from './auditoria/ActionButtons';
import { useCamera } from '@/hooks/useCamera';
import { usePhotoCapture } from '@/hooks/usePhotoCapture';
import { 
  CapturedPhoto, 
  PhotoSet, 
  UserData, 
  AuditoriaFormData,
  AuditoriaData,
  Planta 
} from '@/types/auditoria';

interface CameraAppProps {
  onClose?: () => void;
  userData: UserData | null;
}

const CameraApp = ({ onClose, userData }: CameraAppProps) => {
  const [auditoriaData, setAuditoriaData] = useState<AuditoriaData | null>(null);
  const [selectedPlanta, setSelectedPlanta] = useState<Planta | null>(null);
  const [currentPhotos, setCurrentPhotos] = useState<CapturedPhoto[]>([]);
  const [currentArea, setCurrentArea] = useState('');
  const [currentLevantamiento, setCurrentLevantamiento] = useState('');
  const [currentResponsable, setCurrentResponsable] = useState('');
  const [photoSets, setPhotoSets] = useState<PhotoSet[]>([]);
  const [editingSetId, setEditingSetId] = useState<string | null>(null);
  const [editingLevantamiento, setEditingLevantamiento] = useState('');
  const [editingResponsable, setEditingResponsable] = useState('');
  const [editingAreaId, setEditingAreaId] = useState<string | null>(null);
  const [editingArea, setEditingArea] = useState('');
  const [showAreaInput, setShowAreaInput] = useState(false);
  const [auditoriaId, setAuditoriaId] = useState<string | null>(null);
  const [isSavingToDatabase, setIsSavingToDatabase] = useState(false);

  const { 
    isCapturing, 
    cameraPermission, 
    videoRef, 
    startCamera, 
    stopCamera 
  } = useCamera();

  const { canvasRef, capturePhoto } = usePhotoCapture();

  const handleAuditoriaSubmit = useCallback(async (formData: AuditoriaFormData) => {
    try {
      const { data: planta, error } = await supabase
        .from('plantas')
        .select('id, nombre, iniciales')
        .eq('id', formData.plantaId)
        .single();

      if (error) throw error;
      
      setSelectedPlanta(planta);
      setAuditoriaData(formData);
    } catch (error) {
      console.error('Error fetching planta:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar la información de la planta.",
        variant: "destructive",
      });
    }
  }, []);

  const uploadPhotoToStorage = useCallback(async (photo: CapturedPhoto): Promise<string | null> => {
    if (!photo.file || !auditoriaId) return null;

    try {
      const fileName = `${auditoriaId}/${Date.now()}_${photo.id}.jpg`;
      
      const { data, error } = await supabase.storage
        .from('bucket_auditorias')
        .upload(fileName, photo.file, {
          contentType: 'image/jpeg',
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('bucket_auditorias')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading photo:', error);
      return null;
    }
  }, [auditoriaId]);

  const handleStartCamera = useCallback(async () => {
    const success = await startCamera(currentArea);
    if (success) {
      setShowAreaInput(false);
    } else {
      setShowAreaInput(true);
    }
  }, [startCamera, currentArea]);

  const handleCapturePhoto = useCallback(async () => {
    const newPhoto = await capturePhoto(videoRef, currentPhotos);
    if (newPhoto) {
      setCurrentPhotos(prev => [...prev, newPhoto]);
      
      if (currentPhotos.length + 1 >= 3) {
        stopCamera();
        toast({
          title: "Todas las fotos capturadas",
          description: "Ahora puedes completar la información y guardar este conjunto.",
        });
      }
    }
  }, [capturePhoto, videoRef, currentPhotos, stopCamera]);

  const deletePhoto = useCallback((photoId: string) => {
    setCurrentPhotos(prev => prev.filter(photo => photo.id !== photoId));
    toast({
      title: "Foto eliminada",
      description: "Foto removida del conjunto actual.",
    });
  }, []);

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

    const newSet: PhotoSet = {
      id: Date.now().toString(),
      area: currentArea.trim(),
      photos: [...currentPhotos],
      levantamiento: currentLevantamiento,
      responsable: currentResponsable,
      timestamp: new Date()
    };

    setPhotoSets(prev => [...prev, newSet]);
    setCurrentPhotos([]);
    setCurrentArea('');
    setCurrentLevantamiento('');
    setCurrentResponsable('');
    setShowAreaInput(false);
    
    toast({
      title: "¡Conjunto de fotos guardado!",
      description: `Conjunto "${newSet.area}" con ${newSet.photos.length} foto(s) agregado.`,
    });
  }, [currentPhotos, currentArea, currentLevantamiento, currentResponsable]);

  const deletePhotoSet = useCallback((setId: string) => {
    setPhotoSets(prev => prev.filter(set => set.id !== setId));
    toast({
      title: "Conjunto eliminado",
      description: "Conjunto removido del documento.",
    });
  }, []);

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
  }, []);

  const updatePhotoSet = useCallback((setId: string, updates: Partial<PhotoSet>) => {
    setPhotoSets(prev => prev.map(set => 
      set.id === setId ? { ...set, ...updates } : set
    ));
  }, []);

  const closeAuditoria = useCallback(async () => {
    if (!auditoriaData || !userData || photoSets.length === 0) {
      toast({
        title: "No se puede cerrar la auditoría",
        description: "Debe tener al menos un conjunto de fotos guardado.",
        variant: "destructive",
      });
      return;
    }

    setIsSavingToDatabase(true);

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('Usuario no autenticado');
      }

      const [day, month, year] = auditoriaData.fecha.split('/');
      const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

      const { data: auditoria, error: auditoriaError } = await supabase
        .from('auditorias')
        .insert({
          user_id: user.user.id,
          titulo_documento: auditoriaData.tituloDocumento,
          fecha: isoDate,
          auditor: auditoriaData.auditor,
          planta_id: auditoriaData.plantaId,
          status: 'Activo'
        })
        .select()
        .single();

      if (auditoriaError) throw auditoriaError;

      setAuditoriaId(auditoria.id);

      for (const set of photoSets) {
        const photoUrls: string[] = [];
        
        // Upload photos and collect URLs
        for (const photo of set.photos) {
          const url = await uploadPhotoToStorage(photo);
          if (url) {
            photoUrls.push(url);
          }
        }

        const { error: setError } = await supabase
          .from('auditoria_sets')
          .insert({
            auditoria_id: auditoria.id,
            area: set.area,
            levantamiento: set.levantamiento || null,
            responsable: set.responsable || null,
            foto_urls: photoUrls
          });

        if (setError) throw setError;
      }

      toast({
        title: "Auditoría cerrada exitosamente",
        description: "Todos los datos han sido guardados en la base de datos.",
      });

    } catch (error) {
      console.error('Error saving auditoria:', error);
      toast({
        title: "Error al cerrar auditoría",
        description: "No se pudo guardar en la base de datos.",
        variant: "destructive",
      });
    } finally {
      setIsSavingToDatabase(false);
    }
  }, [auditoriaData, userData, photoSets, uploadPhotoToStorage]);

  const generatePDF = useCallback(async () => {
    if (photoSets.length === 0) {
      toast({
        title: "No hay conjuntos de fotos para exportar",
        description: "Por favor crea al menos un conjunto de fotos primero.",
        variant: "destructive",
      });
      return;
    }

    const pdf = new jsPDF();
    const pageHeight = pdf.internal.pageSize.height;
    const pageWidth = pdf.internal.pageSize.width;
    let yPosition = 20;

    try {
      const logoResponse = await fetch('/lovable-uploads/9ad6adb6-f76a-4982-92e9-09618c309f7c.png');
      const logoBlob = await logoResponse.blob();
      const logoBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(logoBlob);
      });

      pdf.addImage(logoBase64, 'PNG', 20, yPosition, 40, 20);
      yPosition += 25;
    } catch (error) {
      console.log('Could not load logo, continuing without it');
    }

    pdf.setFontSize(20);
    pdf.setTextColor(196, 47, 47);
    pdf.text('QUINTA ALIMENTOS', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    pdf.setFontSize(16);
    pdf.setTextColor(0, 0, 0);
    const title = auditoriaData?.tituloDocumento || 'Reporte de Auditoría';
    pdf.text(title, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    pdf.setFontSize(12);
    pdf.text(`Generado el: ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 20;

    if (auditoriaData && userData && selectedPlanta) {
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text('INFORMACIÓN DE LA AUDITORÍA:', 20, yPosition);
      yPosition += 8;
      pdf.text(`Planta: ${selectedPlanta.nombre}`, 20, yPosition);
      yPosition += 6;
      pdf.text(`Auditor: ${auditoriaData.auditor}`, 20, yPosition);
      yPosition += 6;
      pdf.text(`Cargo: ${userData.position}`, 20, yPosition);
      yPosition += 6;
      pdf.text(`Email: ${userData.email}`, 20, yPosition);
      yPosition += 6;
      pdf.text(`Fecha: ${auditoriaData.fecha}`, 20, yPosition);
      yPosition += 15;
    }

    for (let i = 0; i < photoSets.length; i++) {
      const set = photoSets[i];
      
      if (yPosition > pageHeight - 100) {
        pdf.addPage();
        yPosition = 20;
      }

      pdf.setFontSize(16);
      pdf.setTextColor(196, 47, 47);
      pdf.text(`ÁREA: ${set.area}`, 20, yPosition);
      yPosition += 15;

      for (let j = 0; j < set.photos.length; j++) {
        const photo = set.photos[j];
        
        if (yPosition > pageHeight - 80) {
          pdf.addPage();
          yPosition = 20;
        }

        try {
          const imgWidth = 60;
          const imgHeight = 60;
          const imgSrc = photo.url || URL.createObjectURL(photo.file!);
          pdf.addImage(imgSrc, 'JPEG', 20 + (j * 65), yPosition, imgWidth, imgHeight);
        } catch (error) {
          console.error('Error adding image to PDF:', error);
        }
      }
      
      yPosition += 70;

      if (set.levantamiento) {
        pdf.setFontSize(12);
        pdf.setTextColor(0, 0, 0);
        pdf.text('Levantamiento:', 20, yPosition);
        yPosition += 10;
        
        const splitLevantamiento = pdf.splitTextToSize(set.levantamiento, pageWidth - 40);
        pdf.text(splitLevantamiento, 20, yPosition);
        yPosition += splitLevantamiento.length * 5 + 10;
      }

      if (set.responsable) {
        pdf.setFontSize(12);
        pdf.setTextColor(0, 0, 0);
        pdf.text(`Responsable: ${set.responsable}`, 20, yPosition);
        yPosition += 10;
      }

      yPosition += 10;
    }

    if (auditoriaData && userData) {
      if (yPosition > pageHeight - 60) {
        pdf.addPage();
        yPosition = 20;
      }

      yPosition += 20;
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text('FIRMA DEL AUDITOR:', 20, yPosition);
      yPosition += 20;

      pdf.line(20, yPosition, 120, yPosition);
      yPosition += 10;

      pdf.setFontSize(10);
      pdf.text(`${auditoriaData.auditor}`, 20, yPosition);
      yPosition += 5;
      pdf.text(`${userData.position}`, 20, yPosition);
      yPosition += 5;
      pdf.text(`Fecha: ${auditoriaData.fecha}`, 20, yPosition);
    }

    const pdfBlob = pdf.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `${auditoriaData?.tituloDocumento || 'Auditoria'}_${selectedPlanta?.nombre || 'Planta'}_${auditoriaData?.fecha.replace(/\//g, '-') || new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
    
    toast({
      title: "PDF descargado",
      description: "Documento descargado exitosamente.",
    });
  }, [photoSets, auditoriaData, userData, selectedPlanta]);

  const resetApp = useCallback(() => {
    setAuditoriaData(null);
    setSelectedPlanta(null);
    setCurrentPhotos([]);
    setCurrentArea('');
    setCurrentLevantamiento('');
    setCurrentResponsable('');
    setPhotoSets([]);
    setEditingSetId(null);
    setEditingLevantamiento('');
    setEditingResponsable('');
    setEditingAreaId(null);
    setEditingArea('');
    setShowAreaInput(false);
    setAuditoriaId(null);
    stopCamera();
    toast({
      title: "Aplicación reiniciada",
      description: "Todos los datos han sido limpiados.",
    });
  }, [stopCamera]);

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
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
          <AuditoriaForm 
            onSubmit={handleAuditoriaSubmit}
            userData={userData}
          />
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
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        <AuditoriaHeader auditoriaData={auditoriaData} />

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
            onStopCamera={stopCamera}
          />
        )}

        {currentPhotos.length > 0 && (
          <PhotoGallery
            currentPhotos={currentPhotos}
            currentArea={currentArea}
            currentLevantamiento={currentLevantamiento}
            currentResponsable={currentResponsable}
            setCurrentLevantamiento={setCurrentLevantamiento}
            setCurrentResponsable={setCurrentResponsable}
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
          onCloseAuditoria={closeAuditoria}
          onGeneratePDF={generatePDF}
          onResetApp={resetApp}
          isSavingToDatabase={isSavingToDatabase}
        />

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
};

export default CameraApp;
