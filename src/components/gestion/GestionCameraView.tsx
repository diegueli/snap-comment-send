
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, RotateCcw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface GestionCameraViewProps {
  onPhotoTaken: (file: File) => void;
  onCancel: () => void;
}

const GestionCameraView = ({ onPhotoTaken, onCancel }: GestionCameraViewProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);

  // Iniciar cámara
  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      });
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      
      setIsCapturing(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Error de cámara",
        description: "No se puede acceder a la cámara. Verifique los permisos.",
        variant: "destructive",
      });
    }
  }, []);

  // Detener cámara
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCapturing(false);
  }, [stream]);

  // Capturar foto
  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    // Configurar canvas con las dimensiones del video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Dibujar el frame actual del video en el canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convertir a blob y crear URL
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        setCapturedPhoto(url);
        stopCamera();
      }
    }, 'image/jpeg', 0.9);
  }, [stopCamera]);

  // Confirmar foto
  const confirmPhoto = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob(async (blob) => {
      if (blob) {
        const file = new File([blob], `evidencia_${Date.now()}.jpg`, {
          type: 'image/jpeg',
          lastModified: Date.now(),
        });
        
        onPhotoTaken(file);
      }
    }, 'image/jpeg', 0.9);
  }, [onPhotoTaken]);

  // Retomar foto
  const retakePhoto = useCallback(() => {
    if (capturedPhoto) {
      URL.revokeObjectURL(capturedPhoto);
      setCapturedPhoto(null);
    }
    startCamera();
  }, [capturedPhoto, startCamera]);

  // Inicializar cámara al montar
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
      if (capturedPhoto) {
        URL.revokeObjectURL(capturedPhoto);
      }
    };
  }, [startCamera, stopCamera, capturedPhoto]);

  return (
    <Card className="bg-white/95 backdrop-blur-sm shadow-xl">
      <CardHeader>
        <CardTitle className="text-center text-xl">Evidencia Fotográfica</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {capturedPhoto ? (
          // Vista previa de la foto capturada
          <div className="space-y-4">
            <div className="relative bg-black rounded-lg overflow-hidden">
              <img 
                src={capturedPhoto} 
                alt="Foto capturada" 
                className="w-full h-64 object-contain"
              />
            </div>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={retakePhoto}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Retomar
              </Button>
              <Button
                onClick={confirmPhoto}
                className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
              >
                <Camera className="w-4 h-4" />
                Confirmar
              </Button>
            </div>
          </div>
        ) : (
          // Vista de la cámara
          <div className="space-y-4">
            <div className="relative bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-64 object-cover"
              />
              {!isCapturing && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <p className="text-white">Iniciando cámara...</p>
                </div>
              )}
            </div>
            
            <div className="flex gap-3 justify-center">
              <Button
                onClick={onCancel}
                variant="outline"
              >
                Cancelar
              </Button>
              <Button
                onClick={capturePhoto}
                disabled={!isCapturing}
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
              >
                <Camera className="w-4 h-4" />
                Capturar
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
