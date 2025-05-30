
import { useState, useRef, useCallback, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

export const useCamera = () => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const videoRef = useRef<HTMLVideoElement>(null);

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
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.onloadedmetadata = () => {
        videoRef.current?.play().catch(console.error);
      };
    }
  }, [stream]);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const startCamera = useCallback(async (currentArea: string) => {
    if (!currentArea.trim()) {
      toast({
        title: "Área requerida",
        description: "Por favor ingrese el área antes de iniciar la cámara.",
        variant: "destructive",
      });
      return false;
    }

    try {
      console.log('Starting camera...');
      
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
      
      toast({
        title: "Cámara iniciada",
        description: "¡Listo para tomar fotos!",
      });
      return true;
    } catch (error) {
      console.error('Error accessing camera:', error);
      setCameraPermission('denied');
      toast({
        title: "Error de cámara",
        description: "No se puede acceder a la cámara. Verifique los permisos.",
        variant: "destructive",
      });
      return false;
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

  return {
    isCapturing,
    stream,
    cameraPermission,
    videoRef,
    startCamera,
    stopCamera
  };
};
