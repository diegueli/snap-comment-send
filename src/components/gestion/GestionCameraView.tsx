
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, X, Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useCamera } from '@/hooks/useCamera';
import { usePhotoCapture } from '@/hooks/usePhotoCapture';

interface GestionCameraViewProps {
  onPhotoTaken: (file: File) => void;
  onCancel: () => void;
}

const GestionCameraView: React.FC<GestionCameraViewProps> = ({ 
  onPhotoTaken, 
  onCancel 
}) => {
  const [currentArea] = useState('Evidencia Gestion Auditoria');
  const [capturedPhoto, setCapturedPhoto] = useState<{ url: string; file: File } | null>(null);
  
  const { 
    isCapturing, 
    cameraPermission, 
    videoRef, 
    startCamera, 
    stopCamera 
  } = useCamera();

  const { canvasRef, capturePhoto } = usePhotoCapture();

  const handleStartCamera = async (e: React.MouseEvent) => {
    e.preventDefault();
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
    e.preventDefault();
    e.stopPropagation();
    
    const newPhoto = await capturePhoto(videoRef, []);
    
    if (newPhoto && newPhoto.file) {
      const url = URL.createObjectURL(newPhoto.file);
      setCapturedPhoto({ url, file: newPhoto.file });
      stopCamera();

      toast({
        title: "Foto capturada",
        description: "Evidencia fotográfica capturada exitosamente",
      });
    }
  };

  const handleStopCamera = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    stopCamera();
  };

  const handleConfirmPhoto = () => {
    if (capturedPhoto) {
      onPhotoTaken(capturedPhoto.file);
      URL.revokeObjectURL(capturedPhoto.url);
      setCapturedPhoto(null);
    }
  };

  const handleRetakePhoto = () => {
    if (capturedPhoto) {
      URL.revokeObjectURL(capturedPhoto.url);
      setCapturedPhoto(null);
    }
    startCamera(currentArea);
  };

  const handleCancel = () => {
    if (capturedPhoto) {
      URL.revokeObjectURL(capturedPhoto.url);
    }
    stopCamera();
    onCancel();
  };

  return (
    <Card className="border-yellow-200 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-yellow-50 to-red-50">
        <CardTitle className="text-xl font-bold bg-gradient-to-r from-yellow-600 to-red-600 bg-clip-text text-transparent text-center">
          Evidencia Fotográfica de Gestión
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {capturedPhoto ? (
          // Vista previa de la foto capturada
          <div className="space-y-4">
            <div className="relative bg-black rounded-lg overflow-hidden">
              <img 
                src={capturedPhoto.url} 
                alt="Evidencia capturada" 
                className="w-full h-64 object-contain"
              />
            </div>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={handleRetakePhoto}
                variant="outline"
                className="border-yellow-200 text-yellow-600 hover:bg-yellow-50"
              >
                <Camera className="w-4 h-4 mr-2" />
                Retomar
              </Button>
              <Button
                onClick={handleConfirmPhoto}
                className="bg-gradient-to-r from-yellow-500 to-red-600 hover:from-yellow-600 hover:to-red-700 text-white"
              >
                <Check className="w-4 h-4 mr-2" />
                Confirmar
              </Button>
            </div>
          </div>
        ) : !isCapturing ? (
          // Vista inicial - botón para iniciar cámara
          <div className="text-center space-y-4">
            <p className="text-gray-700 mb-4">
              Capture evidencia fotográfica para la gestión de auditoría
            </p>
            <Button 
              type="button"
              onClick={handleStartCamera}
              disabled={cameraPermission === 'denied'}
              className="w-full bg-gradient-to-r from-yellow-500 to-red-600 hover:from-yellow-600 hover:to-red-700 text-white"
            >
              <Camera className="w-4 h-4 mr-2" />
              Iniciar Cámara
            </Button>
            {cameraPermission === 'denied' && (
              <p className="text-red-600 text-sm">
                Permisos de cámara denegados. Actualiza la página y permite el acceso a la cámara.
              </p>
            )}
            <Button
              onClick={handleCancel}
              variant="outline"
              className="w-full border-gray-200"
            >
              Cancelar
            </Button>
          </div>
        ) : (
          // Vista de la cámara activa
          <div className="space-y-4">
            <div className="relative w-full flex justify-center">
              <video
                ref={videoRef}
                className="w-full max-w-sm rounded-lg border-2 border-yellow-200"
                style={{ maxHeight: '400px' }}
                playsInline
                muted
                autoPlay
              />
            </div>
            <div className="flex flex-col gap-2 justify-center">
              <Button
                type="button"
                onClick={handleCapturePhoto}
                className="bg-gradient-to-r from-yellow-500 to-red-600 hover:from-yellow-600 hover:to-red-700 text-white"
              >
                <Camera className="w-4 h-4 mr-2" />
                Capturar Evidencia
              </Button>
              <Button
                type="button"
                onClick={handleStopCamera}
                variant="outline"
                className="border-yellow-200 text-yellow-600 hover:bg-yellow-50"
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

export default GestionCameraView;
