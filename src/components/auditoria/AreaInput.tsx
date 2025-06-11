
import React from 'react';
import { Camera, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AreaInputProps {
  currentArea: string;
  setCurrentArea: (area: string) => void;
  onStartCamera: () => void;
  onSelectFromGallery: () => void;
  cameraPermission: 'granted' | 'denied' | 'prompt';
}

const AreaInput = ({
  currentArea,
  setCurrentArea,
  onStartCamera,
  onSelectFromGallery,
  cameraPermission
}: AreaInputProps) => {
  return (
    <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          📍 Área de Auditoría
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label htmlFor="area" className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del Área
            </label>
            <Input
              id="area"
              placeholder="Ingrese el área a auditar"
              value={currentArea}
              onChange={(e) => setCurrentArea(e.target.value)}
              className="border-gray-200 focus:border-red-500"
            />
          </div>
          
          {currentArea.trim() && (
            <div className="space-y-3">
              <Button
                onClick={onStartCamera}
                className="w-full bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white"
                disabled={cameraPermission === 'denied'}
              >
                <Camera className="w-4 h-4 mr-2" />
                {cameraPermission === 'denied' 
                  ? 'Cámara no disponible' 
                  : 'Iniciar Cámara'
                }
              </Button>
              
              <Button
                onClick={onSelectFromGallery}
                variant="outline"
                className="w-full border-2 border-red-300 text-red-600 hover:border-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <Image className="w-4 h-4 mr-2" />
                Seleccionar de Biblioteca
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AreaInput;
