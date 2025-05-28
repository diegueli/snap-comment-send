
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BloqueosCameraModule from '@/components/BloqueosCameraModule';
import { useBloqueosPhotos } from '@/hooks/useBloqueosPhotos';

const Camera = () => {
  const navigate = useNavigate();
  const { photos, updatePhotos } = useBloqueosPhotos();

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
            photos={photos}
            onPhotosChange={updatePhotos}
            onClose={handleClose}
          />
        </div>
      </div>
    </div>
  );
};

export default Camera;
