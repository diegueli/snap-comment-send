
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
  const [isConnecting, setIsConnecting] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const connectingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (connectingTimeoutRef.current) {
        clearTimeout(connectingTimeoutRef.current);
      }
    };
  }, []);

  const activateCamera = useCallback(() => {
    console.log('Activating camera');
    
    // Clear any existing timeout
    if (connectingTimeoutRef.current) {
      clearTimeout(connectingTimeoutRef.current);
      connectingTimeoutRef.current = null;
    }
    
    setIsCapturing(true);
    setIsConnecting(false);
    
    toast({
      title: "Cámara lista",
      description: "¡Listo para tomar fotos!",
    });
  }, []);

  const startCamera = useCallback(async () => {
    try {
      console.log('Starting camera...');
      setIsConnecting(true);
      
      // Clear any existing timeout
      if (connectingTimeoutRef.current) {
        clearTimeout(connectingTimeoutRef.current);
      }

      // Safety timeout - activate camera after 3 seconds regardless
      connectingTimeoutRef.current = setTimeout(() => {
        console.log('Camera activation timeout - forcing activation');
        activateCamera();
      }, 3000);
      
      // Stop any existing stream first
      if (streamRef.current) {
        console.log('Stopping existing stream');
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      });
      
      console.log('Camera stream obtained');
      streamRef.current = mediaStream;
      setCameraPermission('granted');
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        
        const video = videoRef.current;
        
        // Use onloadedmetadata as the primary activation trigger
        video.onloadedmetadata = () => {
          console.log('Video metadata loaded - activating camera');
          activateCamera();
        };
        
        // Start playing the video
        video.play().catch(error => {
          console.error('Error starting video playback:', error);
          setIsConnecting(false);
          
          if (connectingTimeoutRef.current) {
            clearTimeout(connectingTimeoutRef.current);
            connectingTimeoutRef.current = null;
          }
          
          toast({
            title: "Error de cámara",
            description: "No se pudo iniciar la reproducción del video",
            variant: "destructive",
          });
        });
      }
      
    } catch (error) {
      console.error('Error accessing camera:', error);
      setCameraPermission('denied');
      setIsConnecting(false);
      
      // Clear timeout on error
      if (connectingTimeoutRef.current) {
        clearTimeout(connectingTimeoutRef.current);
        connectingTimeoutRef.current = null;
      }
      
      toast({
        title: "Error de cámara",
        description: "No se puede acceder a la cámara. Verifica los permisos.",
        variant: "destructive",
      });
    }
  }, [activateCamera]);

  const stopCamera = useCallback(() => {
    console.log('Stopping camera');
    
    // Clear any connecting timeout
    if (connectingTimeoutRef.current) {
      clearTimeout(connectingTimeoutRef.current);
      connectingTimeoutRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCapturing(false);
    setIsConnecting(false);
  }, []);

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
    <div className="bg-gradient-to-br from-yellow-400 via-red-500 to-orange-600 p-2 sm:p-4 rounded-lg w-full overflow-y-auto">
      <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl w-full max-w-lg mx-auto overflow-y-auto">
        <CardHeader className="bg-gradient-to-r from-yellow-500 to-red-600 text-white rounded-t-lg p-3 sm:p-4 flex-shrink-0">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2 flex-1">
              <Camera className="h-4 w-4 sm:h-5 sm:w-5" />
              <CardTitle className="text-sm sm:text-base font-bold bg-gradient-to-r from-white to-yellow-100 bg-clip-text text-transparent">
                Evidencia Fotográfica del Bloqueo
              </CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0 text-white hover:bg-white/20 flex-shrink-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 w-full flex-1 overflow-y-auto">
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
            <div className="text-center py-6 w-full">
              <Camera className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-red-600 mb-4" />
              <h3 className="text-base sm:text-lg font-semibold mb-2">
                {isConnecting ? "Conectando cámara..." : "Capturar Evidencia Fotográfica"}
              </h3>
              <p className="text-gray-600 text-xs sm:text-sm mb-4">
                {isConnecting ? "Estableciendo conexión con la cámara" : "Toma hasta 3 fotos como evidencia del bloqueo"}
              </p>
              {cameraPermission === 'denied' && (
                <p className="text-red-600 text-xs sm:text-sm mb-4">
                  Acceso a cámara denegado. Por favor habilita los permisos de cámara.
                </p>
              )}
              <Button
                onClick={startCamera}
                className="bg-gradient-to-r from-yellow-500 to-red-600 hover:from-yellow-600 hover:to-red-700 text-white shadow-lg w-full sm:w-auto"
                disabled={cameraPermission === 'denied' || isConnecting}
              >
                {isConnecting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Conectando...
                  </div>
                ) : (
                  <>
                    <Camera className="w-4 h-4 mr-2" />
                    Iniciar Cámara
                  </>
                )}
              </Button>
            </div>
          )}

          {photos.length > 0 && (
            <div className="mt-6 w-full">
              <h4 className="font-medium mb-4 text-gray-700 text-center text-sm sm:text-base">
                Fotos Capturadas ({photos.length}/3)
              </h4>
              <div className="grid grid-cols-3 gap-2 w-full">
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
                    <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      {new Date(photo.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
                
                {photos.length < 3 && !isCapturing && (
                  <div
                    onClick={startCamera}
                    className="aspect-square border-2 border-dashed border-red-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-red-500 hover:bg-red-50 transition-colors w-full"
                  >
                    <div className="text-center">
                      {isConnecting ? (
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600 mx-auto mb-2"></div>
                      ) : (
                        <Plus className="w-6 h-6 sm:w-8 sm:h-8 text-red-400 mx-auto mb-2" />
                      )}
                      <span className="text-xs text-red-600">
                        {isConnecting ? "Conectando..." : "Agregar Foto"}
                      </span>
                    </div>
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
