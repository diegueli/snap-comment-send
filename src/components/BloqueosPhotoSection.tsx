
import React from 'react';
import { Button } from '@/components/ui/button';
import { Camera } from 'lucide-react';

interface CapturedPhoto {
  id: string;
  dataUrl: string;
  timestamp: Date;
}

interface BloqueosPhotoSectionProps {
  photos: CapturedPhoto[];
  onShowCamera: () => void;
}

const BloqueosPhotoSection: React.FC<BloqueosPhotoSectionProps> = ({
  photos,
  onShowCamera,
}) => {
  return (
    <div className="border-t border-gray-200 pt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-700 bg-gradient-to-r from-yellow-500 to-red-600 bg-clip-text text-transparent">
          📸 Evidencia Fotográfica
        </h3>
        <Button
          type="button"
          onClick={onShowCamera}
          className="bg-gradient-to-r from-yellow-500 to-red-600 hover:from-yellow-600 hover:to-red-700 text-white shadow-lg"
        >
          <Camera className="w-4 h-4 mr-2" />
          {photos.length > 0 ? `Fotos (${photos.length}/3)` : 'Agregar Fotos'}
        </Button>
      </div>
      
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          {photos.map((photo) => (
            <div key={photo.id} className="relative">
              <img
                src={photo.dataUrl}
                alt={`Evidencia ${photo.id}`}
                className="w-full aspect-square object-cover rounded-lg shadow-md border-2 border-red-200"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BloqueosPhotoSection;
