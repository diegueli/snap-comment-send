
import React from 'react';
import { Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CapturedPhoto } from '@/types/auditoria';
import ResponsableSelect from './ResponsableSelect';

interface PhotoGalleryProps {
  currentPhotos: CapturedPhoto[];
  currentArea: string;
  currentLevantamiento: string;
  currentResponsable: string;
  setCurrentLevantamiento: (value: string) => void;
  setCurrentResponsable: (value: string) => void;
  onDeletePhoto: (photoId: string) => void;
  onStartCamera: () => void;
  onSaveCurrentSet: () => void;
}

const PhotoGallery = ({
  currentPhotos,
  currentArea,
  currentLevantamiento,
  currentResponsable,
  setCurrentLevantamiento,
  setCurrentResponsable,
  onDeletePhoto,
  onStartCamera,
  onSaveCurrentSet
}: PhotoGalleryProps) => {
  return (
    <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          📷 {currentArea} ({currentPhotos.length}/3)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {currentPhotos.map((photo) => (
            <div key={photo.id} className="relative group">
              <img
                src={photo.url || URL.createObjectURL(photo.file!)}
                alt={`Captured photo ${photo.id}`}
                className="w-full aspect-square object-cover rounded-lg shadow-md"
              />
              <Button
                onClick={() => onDeletePhoto(photo.id)}
                size="sm"
                variant="destructive"
                className="absolute top-1 right-1 w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>

        {currentPhotos.length < 3 && (
          <div className="mb-4">
            <Button
              onClick={onStartCamera}
              variant="outline"
              className="w-full border-2 border-dashed border-red-300 text-red-600 hover:border-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar Foto ({currentPhotos.length}/3)
            </Button>
          </div>
        )}
        
        <div className="mb-4">
          <label htmlFor="levantamiento" className="block text-sm font-medium text-gray-700 mb-2">
            Levantamiento
          </label>
          <Textarea
            id="levantamiento"
            placeholder="Agregar levantamiento para este conjunto de fotos..."
            value={currentLevantamiento}
            onChange={(e) => setCurrentLevantamiento(e.target.value)}
            className="resize-none border-gray-200 focus:border-red-500"
            rows={2}
          />
        </div>

        <div className="mb-4">
          <ResponsableSelect
            value={currentResponsable}
            onValueChange={setCurrentResponsable}
          />
        </div>
        
        <Button
          onClick={onSaveCurrentSet}
          className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Guardar Conjunto de Fotos
        </Button>
      </CardContent>
    </Card>
  );
};

export default PhotoGallery;
