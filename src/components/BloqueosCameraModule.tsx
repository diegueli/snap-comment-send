import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, X, Trash2, Plus, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

interface CapturedPhoto {
  id: string;
  dataUrl: string;
  timestamp: Date;
}

interface BloqueosCameraModuleProps {
  onPhotosChange: (photos: CapturedPhoto[]) => void;
  photos: CapturedPhoto[];
  onClose: () => void;
}

const BloqueosCameraModule: React.FC<BloqueosCameraModuleProps> = ({
  onPhotosChange,
  photos,
  onClose,
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
    <div className="bg-gradient-to-br from-yellow-400 via-red-500 to-orange-600 p-2 sm:p-6 rounded-lg w-full">
      <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl w-full">
        <CardHeader className="bg-gradient-to-r from-yellow-500 to-red-600 text-white rounded-t-lg p-3 sm:p-6">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2 sm:gap-3 flex-1">
              <Camera className="h-5 w-5 sm:h-6 sm:w-6" />
              <CardTitle className="text-sm sm:text-lg font-bold bg-gradient-to-r from-white to-yellow-100 bg-clip-text text-transparent">
                📸 Evidencia Fotográfica del Bloqueo
              </CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 text-white hover:bg-white/20 flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 w-full">
          {isCapturing ? (
            <div className="space-y-4 w-full">
              <div className="relative aspect-square overflow-hidden rounded-lg bg-black w-full">
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
                    Detener
                  </Button>
                </div>
                <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                  {photos.length}/3
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 w-full">
              <Camera className="w-16 h-16 mx-auto text-red-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Capturar Evidencia Fotográfica</h3>
              <p className="text-gray-600 text-sm mb-4">
                Toma hasta 3 fotos como evidencia del bloqueo
              </p>
              {cameraPermission === 'denied' && (
                <p className="text-red-600 text-sm mb-4">
                  Acceso a cámara denegado. Por favor habilita los permisos de cámara.
                </p>
              )}
              <Button
                onClick={startCamera}
                className="bg-gradient-to-r from-yellow-500 to-red-600 hover:from-yellow-600 hover:to-red-700 text-white shadow-lg w-full sm:w-auto"
                disabled={cameraPermission === 'denied'}
              >
                <Camera className="w-4 h-4 mr-2" />
                Iniciar Cámara
              </Button>
            </div>
          )}

          {photos.length > 0 && (
            <div className="mt-6 w-full">
              <h4 className="font-medium mb-4 text-gray-700">
                Fotos Capturadas ({photos.length}/3)
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full">
                {photos.map((photo) => (
                  <div key={photo.id} className="relative group w-full">
                    <img
                      src={photo.dataUrl}
                      alt={`Evidencia ${photo.id}`}
                      className="w-full aspect-square object-cover rounded-lg shadow-md border-2 border-red-200"
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
                
                {photos.length < 3 && (
                  <div
                    onClick={startCamera}
                    className="aspect-square border-2 border-dashed border-red-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-red-500 hover:bg-red-50 transition-colors w-full"
                  >
                    <Plus className="w-8 h-8 text-red-400" />
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default BloqueosCameraModule;
