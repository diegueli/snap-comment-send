
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
    <div className="min-h-screen w-full bg-gradient-to-br from-yellow-50 to-red-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4">
          <Button
            onClick={handleClose}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al Formulario
          </Button>
        </div>
        
        <BloqueosCameraModule
          photos={JSON.parse(localStorage.getItem('bloqueosPhotos') || '[]')}
          onPhotosChange={handlePhotosChange}
          onClose={handleClose}
        />
      </div>
    </div>
  );
};

export default Camera;
