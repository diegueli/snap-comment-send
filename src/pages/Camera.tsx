
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BloqueosCameraModule from '@/components/BloqueosCameraModule';

interface CapturedPhoto {
  id: string;
  dataUrl: string;
  timestamp: Date;
}

const Camera = () => {
  const navigate = useNavigate();

  const handlePhotosChange = (photos: CapturedPhoto[]) => {
    // Store photos in localStorage to pass back to the form
    localStorage.setItem('bloqueosPhotos', JSON.stringify(photos));
  };

  const handleClose = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-yellow-50 to-red-50 p-2 sm:p-4 overflow-y-auto">
      <div className="max-w-5xl mx-auto w-full px-2 sm:px-4 min-h-full">
        <div className="mb-4 w-full flex-shrink-0">
          <Button
            onClick={handleClose}
            variant="outline"
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al Formulario
          </Button>
        </div>
        
        <div className="w-full flex-1">
          <BloqueosCameraModule
            photos={JSON.parse(localStorage.getItem('bloqueosPhotos') || '[]')}
            onPhotosChange={handlePhotosChange}
            onClose={handleClose}
          />
        </div>
      </div>
    </div>
  );
};

export default Camera;
