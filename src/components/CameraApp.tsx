
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, RotateCcw, FileText, Trash2, Plus, X, Edit, Check, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import jsPDF from 'jspdf';
import AuditoriaForm from './AuditoriaForm';

interface CapturedPhoto {
  id: string;
  dataUrl: string;
  timestamp: Date;
}

interface PhotoSet {
  id: string;
  area: string;
  photos: CapturedPhoto[];
  levantamiento: string;
  responsable: string;
  timestamp: Date;
}

interface UserData {
  name: string;
  email: string;
  position: string;
}

interface CameraAppProps {
  onClose?: () => void;
  userData: UserData | null;
}

interface AuditoriaFormData {
  tituloDocumento: string;
  fecha: string;
  auditor: string;
}

const CameraApp = ({ onClose, userData }: CameraAppProps) => {
  const [auditoriaData, setAuditoriaData] = useState<AuditoriaFormData | null>(null);
  const [currentPhotos, setCurrentPhotos] = useState<CapturedPhoto[]>([]);
  const [currentArea, setCurrentArea] = useState('');
  const [currentLevantamiento, setCurrentLevantamiento] = useState('');
  const [currentResponsable, setCurrentResponsable] = useState('');
  const [photoSets, setPhotoSets] = useState<PhotoSet[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [editingSetId, setEditingSetId] = useState<string | null>(null);
  const [editingLevantamiento, setEditingLevantamiento] = useState('');
  const [editingResponsable, setEditingResponsable] = useState('');
  const [editingAreaId, setEditingAreaId] = useState<string | null>(null);
  const [editingArea, setEditingArea] = useState('');
  const [showAreaInput, setShowAreaInput] = useState(false);
  const [auditoriaId, setAuditoriaId] = useState<string | null>(null);
  const [isSavingToDatabase, setIsSavingToDatabase] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Check camera permission on component mount
  useEffect(() => {
    const checkCameraPermission = async () => {
      try {
        const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
        setCameraPermission(permission.state);
        
        permission.addEventListener('change', () => {
          setCameraPermission(permission.state);
        });
      } catch (error) {
        console.log('Permission API not supported');
      }
    };
    
    checkCameraPermission();
  }, []);

  // Set video source when stream changes
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.onloadedmetadata = () => {
        videoRef.current?.play().catch(console.error);
      };
    }
  }, [stream]);

  // Cleanup camera stream when component unmounts
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const startCamera = useCallback(async () => {
    if (!currentArea.trim()) {
      setShowAreaInput(true);
      toast({
        title: "Área requerida",
        description: "Por favor ingrese el área antes de iniciar la cámara.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('Starting camera...');
      
      // Stop any existing stream first
      if (stream) {
        console.log('Stopping existing stream');
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      });
      
      console.log('Camera stream obtained');
      setStream(mediaStream);
      setIsCapturing(true);
      setCameraPermission('granted');
      setShowAreaInput(false);
      
      toast({
        title: "Cámara iniciada",
        description: "¡Listo para tomar fotos!",
      });
    } catch (error) {
      console.error('Error accessing camera:', error);
      setCameraPermission('denied');
      toast({
        title: "Error de cámara",
        description: "No se puede acceder a la cámara. Verifique los permisos.",
        variant: "destructive",
      });
    }
  }, [stream, currentArea]);

  const stopCamera = useCallback(() => {
    console.log('Stopping camera');
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCapturing(false);
  }, [stream]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || currentPhotos.length >= 3) {
      if (currentPhotos.length >= 3) {
        toast({
          title: "Máximo de fotos alcanzado",
          description: "Solo puedes tomar hasta 3 fotos por conjunto.",
          variant: "destructive",
        });
      }
      return;
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

      setCurrentPhotos(prev => [...prev, newPhoto]);
      toast({
        title: "¡Foto capturada!",
        description: `Foto ${currentPhotos.length + 1}/3 guardada`,
      });

      if (currentPhotos.length + 1 >= 3) {
        stopCamera();
        toast({
          title: "Todas las fotos capturadas",
          description: "Ahora puedes completar la información y guardar este conjunto.",
        });
      }
    }
  }, [currentPhotos.length, stopCamera]);

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

      // Convertir fecha de dd/mm/aaaa a formato ISO
      const [day, month, year] = auditoriaData.fecha.split('/');
      const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

      // Crear la auditoría principal
      const { data: auditoria, error: auditoriaError } = await supabase
        .from('auditorias')
        .insert({
          user_id: user.user.id,
          titulo_documento: auditoriaData.tituloDocumento,
          fecha: isoDate,
          auditor: auditoriaData.auditor,
          status: 'Activo'
        })
        .select()
        .single();

      if (auditoriaError) throw auditoriaError;

      setAuditoriaId(auditoria.id);

      // Guardar cada set de fotos
      for (const set of photoSets) {
        const fotosJson = set.photos.map(photo => ({
          id: photo.id,
          dataUrl: photo.dataUrl,
          timestamp: photo.timestamp.toISOString()
        }));

        const { error: setError } = await supabase
          .from('auditoria_sets')
          .insert({
            auditoria_id: auditoria.id,
            area: set.area,
            levantamiento: set.levantamiento || null,
            responsable: set.responsable || null,
            fotos: fotosJson
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
  }, [auditoriaData, userData, photoSets]);

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

    // Add Quinta alimentos logo and branding
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

    // Company header
    pdf.setFontSize(20);
    pdf.setTextColor(196, 47, 47);
    pdf.text('QUINTA ALIMENTOS', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    pdf.setFontSize(16);
    pdf.setTextColor(0, 0, 0);
    const title = auditoriaData?.tituloDocumento || 'Reporte de Auditoría';
    pdf.text(title, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // Date and time
    pdf.setFontSize(12);
    pdf.text(`Generado el: ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 20;

    // Auditor information
    if (auditoriaData && userData) {
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text('AUDITOR:', 20, yPosition);
      yPosition += 8;
      pdf.text(`Nombre: ${auditoriaData.auditor}`, 20, yPosition);
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
      
      // Check if we need a new page
      if (yPosition > pageHeight - 100) {
        pdf.addPage();
        yPosition = 20;
      }

      // Set header with area name
      pdf.setFontSize(16);
      pdf.setTextColor(196, 47, 47);
      pdf.text(`ÁREA: ${set.area}`, 20, yPosition);
      yPosition += 15;

      // Add photos
      for (let j = 0; j < set.photos.length; j++) {
        const photo = set.photos[j];
        
        if (yPosition > pageHeight - 80) {
          pdf.addPage();
          yPosition = 20;
        }

        try {
          const imgWidth = 60;
          const imgHeight = 60;
          pdf.addImage(photo.dataUrl, 'JPEG', 20 + (j * 65), yPosition, imgWidth, imgHeight);
        } catch (error) {
          console.error('Error adding image to PDF:', error);
        }
      }
      
      yPosition += 70;

      // Add levantamiento
      if (set.levantamiento) {
        pdf.setFontSize(12);
        pdf.setTextColor(0, 0, 0);
        pdf.text('Levantamiento:', 20, yPosition);
        yPosition += 10;
        
        const splitLevantamiento = pdf.splitTextToSize(set.levantamiento, pageWidth - 40);
        pdf.text(splitLevantamiento, 20, yPosition);
        yPosition += splitLevantamiento.length * 5 + 10;
      }

      // Add responsable
      if (set.responsable) {
        pdf.setFontSize(12);
        pdf.setTextColor(0, 0, 0);
        pdf.text(`Responsable: ${set.responsable}`, 20, yPosition);
        yPosition += 10;
      }

      yPosition += 10;
    }

    // Add signature section
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
    link.download = `${auditoriaData?.tituloDocumento || 'Auditoria'}_${auditoriaData?.fecha.replace(/\//g, '-') || new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
    
    toast({
      title: "PDF descargado",
      description: "Documento descargado exitosamente.",
    });
  }, [photoSets, auditoriaData, userData]);

  const resetApp = useCallback(() => {
    setAuditoriaData(null);
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

  // If no auditoria data, show the form
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
            onSubmit={setAuditoriaData}
            userData={userData}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-yellow-400 via-red-500 to-orange-600 min-h-[80vh] p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Close Button */}
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

        {/* Header */}
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader className="text-center pb-3">
            <CardTitle className="text-xl font-bold bg-gradient-to-r from-yellow-500 to-red-600 bg-clip-text text-transparent">
              📋 {auditoriaData.tituloDocumento}
            </CardTitle>
            <p className="text-sm text-gray-600">
              Auditor: {auditoriaData.auditor} | Fecha: {auditoriaData.fecha}
            </p>
          </CardHeader>
        </Card>

        {/* Area Input Section */}
        {(showAreaInput || (!isCapturing && currentPhotos.length === 0)) && (
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
            <CardContent className="p-4">
              <label htmlFor="area" className="block text-sm font-medium text-gray-700 mb-2">
                Área
              </label>
              <Input
                id="area"
                placeholder="Ingrese el área"
                value={currentArea}
                onChange={(e) => setCurrentArea(e.target.value)}
                className="border-gray-200 focus:border-red-500 mb-4"
              />
              <Button
                onClick={startCamera}
                className="w-full bg-gradient-to-r from-yellow-500 to-red-600 hover:from-yellow-600 hover:to-red-700 text-white"
                disabled={!currentArea.trim() || cameraPermission === 'denied'}
              >
                <Camera className="w-4 h-4 mr-2" />
                Iniciar Cámara
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Camera Section */}
        {isCapturing ? (
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl overflow-hidden">
            <CardContent className="p-0">
              <div className="relative aspect-square">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4">
                  <Button
                    onClick={capturePhoto}
                    size="lg"
                    className="rounded-full bg-white text-red-600 hover:bg-gray-100 shadow-lg"
                    disabled={currentPhotos.length >= 3}
                  >
                    <Camera className="w-6 h-6" />
                  </Button>
                  <Button
                    onClick={stopCamera}
                    variant="outline"
                    size="lg"
                    className="rounded-full bg-white/80 backdrop-blur-sm border-white"
                  >
                    Detener
                  </Button>
                </div>
                <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                  {currentPhotos.length}/3
                </div>
                <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                  {currentArea}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Current Photo Gallery */}
        {currentPhotos.length > 0 && (
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                📷 {currentArea} ({currentPhotos.length}/3)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {currentPhotos.map((photo) => (
                  <div key={photo.id} className="relative group">
                    <img
                      src={photo.dataUrl}
                      alt={`Captured photo ${photo.id}`}
                      className="w-full aspect-square object-cover rounded-lg shadow-md"
                    />
                    <Button
                      onClick={() => deletePhoto(photo.id)}
                      size="sm"
                      variant="destructive"
                      className="absolute top-1 right-1 w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>

              {currentPhotos.length < 3 && (
                <div className="mb-4">
                  <Button
                    onClick={startCamera}
                    variant="outline"
                    className="w-full border-2 border-dashed border-red-300 text-red-600 hover:border-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Foto ({currentPhotos.length}/3)
                  </Button>
                </div>
              )}
              
              {/* Levantamiento */}
              <div className="mb-4">
                <label htmlFor="levantamiento" className="block text-sm font-medium text-gray-700 mb-2">
                  Levantamiento
                </label>
                <Textarea
                  id="levantamiento"
                  placeholder="Agregar levantamiento para este conjunto de fotos..."
                  value={currentLevantamiento}
                  onChange={(e) => setCurrentLevantamiento(e.target.value)}
                  className="resize-none border-gray-200 focus:border-red-500"
                  rows={2}
                />
              </div>

              {/* Responsable */}
              <div className="mb-4">
                <label htmlFor="responsable" className="block text-sm font-medium text-gray-700 mb-2">
                  Responsable
                </label>
                <Input
                  id="responsable"
                  placeholder="Nombre del responsable"
                  value={currentResponsable}
                  onChange={(e) => setCurrentResponsable(e.target.value)}
                  className="border-gray-200 focus:border-red-500"
                />
              </div>
              
              <Button
                onClick={saveCurrentSet}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Guardar Conjunto de Fotos
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Saved Photo Sets */}
        {photoSets.length > 0 && (
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Conjuntos Guardados ({photoSets.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {photoSets.map((set) => (
                <div key={set.id} className="border rounded-lg p-3 bg-gray-50">
                  <div className="flex justify-between items-center mb-2">
                    {editingAreaId === set.id ? (
                      <div className="flex-1 mr-2">
                        <div className="flex gap-2">
                          <Input
                            value={editingArea}
                            onChange={(e) => setEditingArea(e.target.value)}
                            className="border-gray-200 focus:border-red-500"
                            placeholder="Área..."
                          />
                          <Button
                            onClick={() => {
                              setPhotoSets(prev => prev.map(s => 
                                s.id === set.id ? { ...s, area: editingArea.trim() || s.area } : s
                              ));
                              setEditingAreaId(null);
                              setEditingArea('');
                            }}
                            size="sm"
                            className="bg-green-500 hover:bg-green-600 text-white"
                          >
                            <Check className="w-3 h-3" />
                          </Button>
                          <Button
                            onClick={() => {
                              setEditingAreaId(null);
                              setEditingArea('');
                            }}
                            size="sm"
                            variant="outline"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center flex-1 mr-2">
                        <span className="font-medium text-sm flex-1">{set.area}</span>
                        <Button
                          onClick={() => {
                            setEditingAreaId(set.id);
                            setEditingArea(set.area);
                          }}
                          size="sm"
                          variant="ghost"
                          className="ml-2 w-6 h-6 p-0"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                      </div>
                    )}

                    <Button
                      onClick={() => deletePhotoSet(set.id)}
                      size="sm"
                      variant="destructive"
                      className="w-6 h-6 p-0"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-3 gap-1 mb-2">
                    {set.photos.map((photo) => (
                      <div key={photo.id} className="relative group">
                        <img
                          src={photo.dataUrl}
                          alt="Set photo"
                          className="w-full aspect-square object-cover rounded"
                        />
                        <Button
                          onClick={() => deletePhotoFromSet(set.id, photo.id)}
                          size="sm"
                          variant="destructive"
                          className="absolute top-1 right-1 w-5 h-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-2 h-2" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  
                  {/* Levantamiento section */}
                  <div className="mt-2">
                    {editingSetId === set.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editingLevantamiento}
                          onChange={(e) => setEditingLevantamiento(e.target.value)}
                          className="resize-none border-gray-200 focus:border-red-500"
                          rows={2}
                          placeholder="Editar levantamiento..."
                        />
                        <Input
                          value={editingResponsable}
                          onChange={(e) => setEditingResponsable(e.target.value)}
                          className="border-gray-200 focus:border-red-500"
                          placeholder="Editar responsable..."
                        />
                        <div className="flex gap-2">
                          <Button
                            onClick={() => {
                              setPhotoSets(prev => prev.map(s => 
                                s.id === set.id 
                                  ? { ...s, levantamiento: editingLevantamiento, responsable: editingResponsable }
                                  : s
                              ));
                              setEditingSetId(null);
                              setEditingLevantamiento('');
                              setEditingResponsable('');
                            }}
                            size="sm"
                            className="bg-green-500 hover:bg-green-600 text-white"
                          >
                            <Check className="w-3 h-3 mr-1" />
                            Guardar
                          </Button>
                          <Button
                            onClick={() => {
                              setEditingSetId(null);
                              setEditingLevantamiento('');
                              setEditingResponsable('');
                            }}
                            size="sm"
                            variant="outline"
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-xs text-gray-500 font-medium">Levantamiento:</p>
                            <p className="text-sm text-gray-600">
                              {set.levantamiento || "Sin levantamiento"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-xs text-gray-500 font-medium">Responsable:</p>
                            <p className="text-sm text-gray-600">
                              {set.responsable || "Sin responsable"}
                            </p>
                          </div>
                          <Button
                            onClick={() => {
                              setEditingSetId(set.id);
                              setEditingLevantamiento(set.levantamiento);
                              setEditingResponsable(set.responsable);
                            }}
                            size="sm"
                            variant="ghost"
                            className="ml-2 w-6 h-6 p-0"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        {photoSets.length > 0 && (
          <div className="flex gap-2">
            <Button
              onClick={closeAuditoria}
              className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white"
              disabled={isSavingToDatabase}
            >
              <Save className="w-4 h-4 mr-2" />
              {isSavingToDatabase ? 'Guardando...' : 'Cerrar Auditoría'}
            </Button>
            <Button
              onClick={generatePDF}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
            >
              <FileText className="w-4 h-4 mr-2" />
              Descargar PDF
            </Button>
            <Button
              onClick={resetApp}
              variant="outline"
              className="bg-white/80 backdrop-blur-sm border-white hover:bg-white"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reiniciar
            </Button>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
};

export default CameraApp;
