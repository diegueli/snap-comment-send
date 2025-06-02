
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, X, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useCamera } from '@/hooks/useCamera';
import { usePhotoCapture } from '@/hooks/usePhotoCapture';

interface Photo {
  id: string;
  url: string;
  file: File;
}

interface BloqueosCameraViewProps {
  onPhotosChange: (photos: Photo[]) => void;
  currentPhotos: Photo[];
}

const BloqueosCameraView: React.FC<BloqueosCameraViewProps> = ({ 
  onPhotosChange, 
  currentPhotos 
}) => {
  const [currentArea] = useState('Evidencia Bloqueo');
  
  const { 
    isCapturing, 
    cameraPermission, 
    videoRef, 
    startCamera, 
    stopCamera 
  } = useCamera();

  const { canvasRef, capturePhoto } = usePhotoCapture();

  const handleStartCamera = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent form submission
    e.stopPropagation();
    
    const success = await startCamera(currentArea);
    if (!success) {
      toast({
        title: "Error de cámara",
        description: "No se pudo acceder a la cámara. Verifica los permisos.",
        variant: "destructive",
      });
    }
  };

  const handleCapturePhoto = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent form submission
    e.stopPropagation();
    
    const newPhoto = await capturePhoto(videoRef, currentPhotos.map(p => ({
      id: p.id,
      file: p.file,
      timestamp: new Date()
    })));
    
    if (newPhoto) {
      const photoWithUrl: Photo = {
        id: newPhoto.id,
        url: URL.createObjectURL(newPhoto.file),
        file: newPhoto.file
      };

      const updatedPhotos = [...currentPhotos, photoWithUrl];
      onPhotosChange(updatedPhotos);

      toast({
        title: "Foto capturada",
        description: `Foto ${updatedPhotos.length} de 3 tomada exitosamente`,
      });

      // Auto-stop camera after 3 photos
      if (updatedPhotos.length >= 3) {
        stopCamera();
        toast({
          title: "Evidencia completa",
          description: "Se han capturado las 3 fotos requeridas para el bloqueo.",
        });
      }
    }
  };

  const handleStopCamera = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent form submission
    e.stopPropagation();
    stopCamera();
  };

  const deletePhoto = (photoId: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    const updatedPhotos = currentPhotos.filter(photo => {
      if (photo.id === photoId) {
        URL.revokeObjectURL(photo.url);
        return false;
      }
      return true;
    });
    onPhotosChange(updatedPhotos);
  };

  if (currentPhotos.length >= 3) {
    return (
      <Card className="border-red-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50">
          <CardTitle className="text-xl font-bold text-red-800 text-center">
            Evidencia Fotográfica Completada
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {currentPhotos.map((photo, index) => (
              <div key={photo.id} className="relative">
                <img
                  src={photo.url}
                  alt={`Evidencia ${index + 1}`}
                  className="w-full h-48 object-cover rounded-lg border-2 border-red-200"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={(e) => deletePhoto(photo.id, e)}
                  className="absolute top-2 right-2 h-8 w-8 p-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <div className="absolute bottom-2 left-2 bg-red-600 text-white px-2 py-1 rounded text-sm font-medium">
                  Foto {index + 1}
                </div>
              </div>
            ))}
          </div>
          <Button 
            type="button"
            onClick={handleStartCamera}
            variant="outline"
            className="w-full border-red-200 text-red-600 hover:bg-red-50"
          >
            <Camera className="w-4 h-4 mr-2" />
            Tomar Más Fotos
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-red-200 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50">
        <CardTitle className="text-xl font-bold text-red-800 text-center">
          Evidencia Fotográfica del Bloqueo
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {!isCapturing ? (
          <div className="text-center space-y-4">
            <p className="text-gray-700 mb-4">
              Se requiere evidencia fotográfica del producto bloqueado (máximo 3 fotos)
            </p>
            {currentPhotos.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {currentPhotos.map((photo, index) => (
                  <div key={photo.id} className="relative">
                    <img
                      src={photo.url}
                      alt={`Evidencia ${index + 1}`}
                      className="w-full h-48 object-cover rounded-lg border-2 border-red-200"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={(e) => deletePhoto(photo.id, e)}
                      className="absolute top-2 right-2 h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <div className="absolute bottom-2 left-2 bg-red-600 text-white px-2 py-1 rounded text-sm font-medium">
                      Foto {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Button 
              type="button"
              onClick={handleStartCamera}
              disabled={cameraPermission === 'denied'}
              className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
            >
              <Camera className="w-4 h-4 mr-2" />
              {currentPhotos.length === 0 ? 'Iniciar Cámara' : `Continuar (${currentPhotos.length}/3)`}
            </Button>
            {cameraPermission === 'denied' && (
              <p className="text-red-600 text-sm">
                Permisos de cámara denegados. Actualiza la página y permite el acceso a la cámara.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative w-full flex justify-center">
              <video
                ref={videoRef}
                className="w-full max-w-sm rounded-lg border-2 border-red-200"
                style={{ maxHeight: '400px' }}
                playsInline
                muted
                autoPlay
              />
              <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded text-sm font-medium">
                Fotos: {currentPhotos.length}/3
              </div>
            </div>
            <div className="flex flex-col gap-2 justify-center">
              <Button
                type="button"
                onClick={handleCapturePhoto}
                disabled={currentPhotos.length >= 3}
                className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
              >
                <Camera className="w-4 h-4 mr-2" />
                Capturar Foto
              </Button>
              <Button
                type="button"
                onClick={handleStopCamera}
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50"
              >
                <X className="w-4 h-4 mr-2" />
                Cerrar Cámara
              </Button>
            </div>
          </div>
        )}
        <canvas ref={canvasRef} className="hidden" />
      </CardContent>
    </Card>
  );
};

export default BloqueosCameraView;
