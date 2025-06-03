import React, { useCallback, useMemo, useRef, useEffect } from 'react';
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

const MAX_PHOTOS = 3;
const CAMERA_AREA = 'Evidencia Bloqueo';

const PhotoGrid: React.FC<{
  photos: Photo[];
  onDelete: (photoId: string, e?: React.MouseEvent) => void;
  showIndex?: boolean;
}> = ({ photos, onDelete, showIndex = false }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
    {photos.map((photo, index) => (
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
          onClick={(e) => onDelete(photo.id, e)}
          className="absolute top-2 right-2 h-8 w-8 p-0"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
        <div className="absolute bottom-2 left-2 bg-red-600/90 text-white px-2 py-1 rounded shadow text-xs font-semibold tracking-wide"></div>
          {showIndex ? `Foto ${index + 1} de ${photos.length}` : `Foto ${index + 1}`}
        </div>
      </div>
    ))}
  </div>
);

const BloqueosCameraView: React.FC<BloqueosCameraViewProps> = ({
  onPhotosChange,
  currentPhotos,
}) => {
  const {
    isCapturing,
    cameraPermission,
    videoRef,
    startCamera,
    stopCamera,
  } = useCamera();

  const { canvasRef, capturePhoto } = usePhotoCapture();

  // Keep track of created object URLs for cleanup
  const objectUrlsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Add current photo URLs to the set
    currentPhotos.forEach((photo) => objectUrlsRef.current.add(photo.url));
    return () => {
      // Cleanup all object URLs on unmount
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      objectUrlsRef.current.clear();
    };
  }, [currentPhotos]);

  const isComplete = useMemo(() => currentPhotos.length >= MAX_PHOTOS, [currentPhotos]);

  const handleStartCamera = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const success = await startCamera(CAMERA_AREA);
      if (!success) {
        toast({
          title: 'Error de cámara',
          description: 'No se pudo acceder a la cámara. Verifica los permisos.',
          variant: 'destructive',
        });
      }
    },
    [startCamera]
  );

  const handleCapturePhoto = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const newPhoto = await capturePhoto(
        videoRef,
        currentPhotos.map((p) => ({
          id: p.id,
          file: p.file,
          timestamp: new Date(),
        }))
      );
      if (newPhoto) {
        const url = URL.createObjectURL(newPhoto.file);
        objectUrlsRef.current.add(url);
        const photoWithUrl: Photo = {
          id: newPhoto.id,
          url,
          file: newPhoto.file,
        };
        const updatedPhotos = [...currentPhotos, photoWithUrl];
        onPhotosChange(updatedPhotos);

        toast({
          title: 'Foto capturada',
          description: `Foto ${updatedPhotos.length} de ${MAX_PHOTOS} tomada exitosamente`,
        });

        if (updatedPhotos.length >= MAX_PHOTOS) {
          stopCamera();
          toast({
            title: 'Evidencia completa',
            description: `Se han capturado las ${MAX_PHOTOS} fotos requeridas para el bloqueo.`,
          });
        }
      }
    },
    [capturePhoto, currentPhotos, onPhotosChange, stopCamera, videoRef]
  );

  const handleStopCamera = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      stopCamera();
    },
    [stopCamera]
  );

  const deletePhoto = useCallback(
    (photoId: string, e?: React.MouseEvent) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      const updatedPhotos = currentPhotos.filter((photo) => {
        if (photo.id === photoId) {
          URL.revokeObjectURL(photo.url);
          objectUrlsRef.current.delete(photo.url);
          return false;
        }
        return true;
      });
      onPhotosChange(updatedPhotos);
    },
    [currentPhotos, onPhotosChange]
  );

  if (isComplete) {
    return (
      <Card className="border-red-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50">
          <CardTitle className="text-xl font-bold text-red-800 text-center">
            Evidencia Fotográfica Completada
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <PhotoGrid photos={currentPhotos} onDelete={deletePhoto} />
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
              Se requiere evidencia del producto bloqueado (máximo {MAX_PHOTOS} fotos)
            </p>
            {currentPhotos.length > 0 && (
              <PhotoGrid photos={currentPhotos} onDelete={deletePhoto} showIndex />
            )}
            <Button
              type="button"
              onClick={handleStartCamera}
              disabled={cameraPermission === 'denied'}
              className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
            >
              <Camera className="w-4 h-4 mr-2" />
              {currentPhotos.length === 0
                ? 'Iniciar Cámara'
                : `Continuar (${currentPhotos.length}/${MAX_PHOTOS})`}
            </Button>
            {cameraPermission === 'denied' && (
              <p className="text-red-600 text-sm">
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
