
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, X, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

interface CapturedPhoto {
  id: string;
  dataUrl: string;
  timestamp: Date;
}

interface BloqueosPhotoSectionProps {
  photos: CapturedPhoto[];
  onPhotosChange: (photos: CapturedPhoto[]) => void;
}

const BloqueosPhotoSection: React.FC<BloqueosPhotoSectionProps> = ({
  photos,
  onPhotosChange,
}) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const startCamera = useCallback(async () => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      });
      
      setStream(mediaStream);
      setIsCapturing(true);
      setCameraPermission('granted');
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            videoRef.current.play().catch(console.error);
          }
        };
      }
      
      toast({
        title: "Cámara iniciada",
        description: "¡Listo para tomar fotos!",
      });
    } catch (error) {
      console.error('Error accessing camera:', error);
      setCameraPermission('denied');
      toast({
        title: "Error de cámara",
        description: "No se puede acceder a la cámara. Verifica los permisos.",
        variant: "destructive",
      });
    }
  }, [stream]);

  const stopCamera = useCallback(() => {
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
    if (!videoRef.current || !canvasRef.current || photos.length >= 3) {
      if (photos.length >= 3) {
        toast({
          title: "Máximo de fotos alcanzado",
          description: "Solo puedes tomar hasta 3 fotos por bloqueo.",
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

      const updatedPhotos = [...photos, newPhoto];
      onPhotosChange(updatedPhotos);
      
      toast({
        title: "¡Foto capturada!",
        description: `Foto ${photos.length + 1}/3 guardada`,
      });

      if (photos.length + 1 >= 3) {
        stopCamera();
        toast({
          title: "Todas las fotos capturadas",
          description: "Ya tienes las 3 fotos requeridas para el bloqueo.",
        });
      }
    }
  }, [photos, onPhotosChange, stopCamera]);

  const deletePhoto = useCallback((photoId: string) => {
    const updatedPhotos = photos.filter(photo => photo.id !== photoId);
    onPhotosChange(updatedPhotos);
    toast({
      title: "Foto eliminada",
      description: "Foto removida del conjunto.",
    });
  }, [photos, onPhotosChange]);

  return (
    <Card className="border-red-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-gray-700 flex items-center gap-2">
          <Camera className="h-5 w-5 text-red-600" />
          Evidencia Fotográfica
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Camera View */}
        {isCapturing && (
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden max-w-md mx-auto">
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
                disabled={photos.length >= 3}
              >
                <Camera className="w-6 h-6" />
              </Button>
              <Button
                onClick={stopCamera}
                variant="outline"
                size="lg"
                className="rounded-full bg-white/80 backdrop-blur-sm border-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
              {photos.length}/3
            </div>
          </div>
        )}

        {/* Camera Controls */}
        {!isCapturing && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {photos.length > 0 ? `${photos.length} foto(s) capturada(s)` : 'No hay fotos adjuntadas'}
            </p>
            <Button
              type="button"
              onClick={startCamera}
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-500"
              disabled={cameraPermission === 'denied' || photos.length >= 3}
            >
              <Camera className="h-4 w-4 mr-2" />
              {photos.length > 0 ? 'Tomar Más Fotos' : 'Tomar Fotos'}
            </Button>
          </div>
        )}

        {/* Horizontal Photo Gallery */}
        {photos.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-700">
              Fotos Capturadas ({photos.length}/3)
            </h4>
            
            <div className="flex gap-3 overflow-x-auto pb-2">
              {photos.map((photo) => (
                <div key={photo.id} className="relative group flex-shrink-0">
                  <div className="w-24 h-24 sm:w-32 sm:h-32">
                    <img
                      src={photo.dataUrl}
                      alt={`Evidencia ${photo.id}`}
                      className="w-full h-full object-cover rounded-lg shadow-md border-2 border-red-200"
                    />
                    <Button
                      onClick={() => deletePhoto(photo.id)}
                      size="sm"
                      variant="destructive"
                      className="absolute top-1 right-1 w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                    <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-1 py-0.5 rounded">
                      {new Date(photo.timestamp).toLocaleTimeString('es-ES', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Add more photos button */}
              {photos.length < 3 && !isCapturing && (
                <div
                  onClick={startCamera}
                  className="w-24 h-24 sm:w-32 sm:h-32 border-2 border-dashed border-red-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                >
                  <div className="text-center">
                    <Plus className="w-6 h-6 text-red-400 mx-auto mb-1" />
                    <span className="text-xs text-red-600">Agregar</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Permission denied message */}
        {cameraPermission === 'denied' && (
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <p className="text-red-600 text-sm">
              Acceso a cámara denegado. Por favor habilita los permisos de cámara para capturar evidencia fotográfica.
            </p>
          </div>
        )}

        <div className="text-xs text-gray-500 mt-2">
          Las fotos se incluirán como archivos descargables junto al correo electrónico
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </CardContent>
    </Card>
  );
};

export default BloqueosPhotoSection;
