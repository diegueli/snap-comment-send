import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, RotateCcw, FileText, Trash2, MessageCircle, Plus, X, Edit, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';

interface CapturedPhoto {
  id: string;
  dataUrl: string;
  timestamp: Date;
}

interface PhotoSet {
  id: string;
  photos: CapturedPhoto[];
  comment: string;
  timestamp: Date;
}

interface CameraAppProps {
  onClose?: () => void;
}

const CameraApp = ({ onClose }: CameraAppProps) => {
  const [currentPhotos, setCurrentPhotos] = useState<CapturedPhoto[]>([]);
  const [currentComment, setCurrentComment] = useState('');
  const [photoSets, setPhotoSets] = useState<PhotoSet[]>([]);
  const [documentTitle, setDocumentTitle] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [editingSetId, setEditingSetId] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState('');
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

  // Cleanup camera stream when component unmounts
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const startCamera = useCallback(async () => {
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
      
      // Wait for video element to be ready before setting srcObject
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        
        // Ensure video starts playing
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            videoRef.current.play().catch(console.error);
          }
        };
      }
      
      toast({
        title: "Camera started",
        description: "Ready to take photos!",
      });
    } catch (error) {
      console.error('Error accessing camera:', error);
      setCameraPermission('denied');
      toast({
        title: "Camera error",
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive",
      });
    }
  }, [stream]);

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
          title: "Maximum photos reached",
          description: "You can only take up to 3 photos per set.",
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
        title: "Photo captured!",
        description: `Photo ${currentPhotos.length + 1}/3 saved`,
      });

      if (currentPhotos.length + 1 >= 3) {
        stopCamera();
        toast({
          title: "All photos captured",
          description: "You can now add a comment and save this set.",
        });
      }
    }
  }, [currentPhotos.length, stopCamera]);

  const deletePhoto = useCallback((photoId: string) => {
    setCurrentPhotos(prev => prev.filter(photo => photo.id !== photoId));
    toast({
      title: "Photo deleted",
      description: "Photo removed from current set.",
    });
  }, []);

  const deletePhotoFromSet = useCallback((setId: string, photoId: string) => {
    setPhotoSets(prev => prev.map(set => {
      if (set.id === setId) {
        const updatedPhotos = set.photos.filter(photo => photo.id !== photoId);
        if (updatedPhotos.length === 0) {
          toast({
            title: "Photo set deleted",
            description: "Set removed as it had no remaining photos.",
          });
          return null;
        }
        toast({
          title: "Photo deleted",
          description: "Photo removed from set.",
        });
        return { ...set, photos: updatedPhotos };
      }
      return set;
    }).filter(Boolean) as PhotoSet[]);
  }, []);

  const saveCurrentSet = useCallback(() => {
    if (currentPhotos.length === 0) {
      toast({
        title: "No photos to save",
        description: "Please capture at least one photo first.",
        variant: "destructive",
      });
      return;
    }

    const newSet: PhotoSet = {
      id: Date.now().toString(),
      photos: [...currentPhotos],
      comment: currentComment,
      timestamp: new Date()
    };

    setPhotoSets(prev => [...prev, newSet]);
    setCurrentPhotos([]);
    setCurrentComment('');
    
    toast({
      title: "Photo set saved!",
      description: `Set with ${newSet.photos.length} photo(s) added to document.`,
    });
  }, [currentPhotos, currentComment]);

  const deletePhotoSet = useCallback((setId: string) => {
    setPhotoSets(prev => prev.filter(set => set.id !== setId));
    toast({
      title: "Photo set deleted",
      description: "Set removed from document.",
    });
  }, []);

  const startEditingComment = useCallback((setId: string, currentComment: string) => {
    setEditingSetId(setId);
    setEditingComment(currentComment);
  }, []);

  const saveEditedComment = useCallback(() => {
    if (!editingSetId) return;
    
    setPhotoSets(prev => prev.map(set => 
      set.id === editingSetId 
        ? { ...set, comment: editingComment }
        : set
    ));
    
    setEditingSetId(null);
    setEditingComment('');
    
    toast({
      title: "Comment updated",
      description: "Photo set comment has been saved.",
    });
  }, [editingSetId, editingComment]);

  const cancelEditingComment = useCallback(() => {
    setEditingSetId(null);
    setEditingComment('');
  }, []);

  const generatePDF = useCallback(async () => {
    if (photoSets.length === 0) {
      toast({
        title: "No photo sets to export",
        description: "Please create at least one photo set first.",
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
      // Fetch the logo image
      const logoResponse = await fetch('/lovable-uploads/9ad6adb6-f76a-4982-92e9-09618c309f7c.png');
      const logoBlob = await logoResponse.blob();
      const logoBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(logoBlob);
      });

      // Add logo to PDF
      pdf.addImage(logoBase64, 'PNG', 20, yPosition, 40, 20);
      yPosition += 25;
    } catch (error) {
      console.log('Could not load logo, continuing without it');
    }

    // Company header
    pdf.setFontSize(20);
    pdf.setTextColor(196, 47, 47); // Red color from logo
    pdf.text('QUINTA ALIMENTOS', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    pdf.setFontSize(16);
    pdf.setTextColor(0, 0, 0);
    const title = documentTitle || 'Reporte de Auditoría';
    pdf.text(title, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // Date and time
    pdf.setFontSize(12);
    pdf.text(`Generado el: ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 30;

    for (let i = 0; i < photoSets.length; i++) {
      const set = photoSets[i];
      
      // Check if we need a new page
      if (yPosition > pageHeight - 100) {
        pdf.addPage();
        yPosition = 20;
      }

      // Set header with Quinta branding
      pdf.setFontSize(16);
      pdf.setTextColor(196, 47, 47); // Red color
      pdf.text(`Conjunto de Fotos ${i + 1}`, 20, yPosition);
      yPosition += 15;

      // Add photos
      for (let j = 0; j < set.photos.length; j++) {
        const photo = set.photos[j];
        
        // Check if we need a new page for photos
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

      // Add comment
      if (set.comment) {
        pdf.setFontSize(12);
        pdf.setTextColor(0, 0, 0);
        pdf.text('Observaciones:', 20, yPosition);
        yPosition += 10;
        
        const splitComment = pdf.splitTextToSize(set.comment, pageWidth - 40);
        pdf.text(splitComment, 20, yPosition);
        yPosition += splitComment.length * 5 + 10;
      }

      yPosition += 10;
    }

    return pdf;
  }, [photoSets, documentTitle]);

  const openPDF = useCallback(async () => {
    try {
      const pdf = await generatePDF();
      if (!pdf) return;

      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      // Create a download link to force download and open in Acrobat Reader
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `${documentTitle || 'Reporte de Auditoría'}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL object
      setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
      
      toast({
        title: "PDF downloaded",
        description: "Document downloaded and will open in Acrobat Reader.",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error generating PDF",
        description: "There was an issue creating the PDF document.",
        variant: "destructive",
      });
    }
  }, [generatePDF, documentTitle]);

  const resetApp = useCallback(() => {
    setCurrentPhotos([]);
    setCurrentComment('');
    setPhotoSets([]);
    setEditingSetId(null);
    setEditingComment('');
    stopCamera();
    toast({
      title: "App reset",
      description: "All photo sets and comments cleared.",
    });
  }, [stopCamera]);

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
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-yellow-500 to-red-600 bg-clip-text text-transparent">
              📸 Auditoría Fotográfica
            </CardTitle>
            <p className="text-sm text-gray-600">
              Crea múltiples conjuntos de fotos y exporta como PDF
            </p>
          </CardHeader>
        </Card>

        {/* Document Title Input */}
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
          <CardContent className="p-4">
            <label htmlFor="document-title" className="block text-sm font-medium text-gray-700 mb-2">
              Título del Documento
            </label>
            <Input
              id="document-title"
              placeholder="Ingrese el título del documento (opcional)"
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              className="border-gray-200 focus:border-red-500"
            />
          </CardContent>
        </Card>

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
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
            <CardContent className="p-6 text-center">
              <div className="mb-4">
                <Camera className="w-16 h-16 mx-auto text-red-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">¿Listo para capturar fotos?</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Toma hasta 3 fotos por conjunto y crea múltiples conjuntos
                </p>
                {cameraPermission === 'denied' && (
                  <p className="text-red-600 text-sm mb-4">
                    Acceso a cámara denegado. Por favor habilita los permisos de cámara en tu navegador.
                  </p>
                )}
              </div>
              <Button
                onClick={startCamera}
                className="bg-gradient-to-r from-yellow-500 to-red-600 hover:from-yellow-600 hover:to-red-700 text-white"
                disabled={cameraPermission === 'denied'}
              >
                <Camera className="w-4 h-4 mr-2" />
                Iniciar Cámara
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Current Photo Gallery */}
        {currentPhotos.length > 0 && (
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                📷 Conjunto Actual ({currentPhotos.length}/3)
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

              {/* Add Photo Button */}
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
              
              {/* Current Comment */}
              <Textarea
                placeholder="Agregar observaciones para este conjunto de fotos..."
                value={currentComment}
                onChange={(e) => setCurrentComment(e.target.value)}
                className="resize-none border-gray-200 focus:border-red-500 mb-4"
                rows={2}
              />
              
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
              {photoSets.map((set, index) => (
                <div key={set.id} className="border rounded-lg p-3 bg-gray-50">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">Conjunto {index + 1}</h4>
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
                  
                  {/* Comment section with edit functionality */}
                  <div className="mt-2">
                    {editingSetId === set.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editingComment}
                          onChange={(e) => setEditingComment(e.target.value)}
                          className="resize-none border-gray-200 focus:border-red-500"
                          rows={2}
                          placeholder="Editar observaciones..."
                        />
                        <div className="flex gap-2">
                          <Button
                            onClick={saveEditedComment}
                            size="sm"
                            className="bg-green-500 hover:bg-green-600 text-white"
                          >
                            <Check className="w-3 h-3 mr-1" />
                            Guardar
                          </Button>
                          <Button
                            onClick={cancelEditingComment}
                            size="sm"
                            variant="outline"
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between">
                        <p className="text-sm text-gray-600 flex-1">
                          {set.comment || "Sin observaciones"}
                        </p>
                        <Button
                          onClick={() => startEditingComment(set.id, set.comment)}
                          size="sm"
                          variant="ghost"
                          className="ml-2 w-6 h-6 p-0"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={openPDF}
            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
            disabled={photoSets.length === 0}
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

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
};

export default CameraApp;
