
import React from 'react';
import { Camera, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
    <Card className="border-red-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-gray-700 flex items-center gap-2">
          <Camera className="h-5 w-5 text-red-600" />
          Evidencia Fotográfica
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {photos.length > 0 ? `${photos.length} foto(s) capturada(s)` : 'No hay fotos adjuntadas'}
            </p>
            <Button
              type="button"
              onClick={onShowCamera}
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-500"
            >
              <Camera className="h-4 w-4 mr-2" />
              {photos.length > 0 ? 'Editar Fotos' : 'Tomar Fotos'}
            </Button>
          </div>

          {photos.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mt-4">
              {photos.map((photo) => (
                <div key={photo.id} className="relative group">
                  <img
                    src={photo.dataUrl}
                    alt={`Evidencia ${photo.id}`}
                    className="w-full aspect-square object-cover rounded-lg shadow-md border-2 border-red-200"
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                    <span className="text-white text-xs bg-black/50 px-2 py-1 rounded">
                      {new Date(photo.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="text-xs text-gray-500 mt-2">
            💡 Las fotos se adjuntarán automáticamente al correo electrónico
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BloqueosPhotoSection;
