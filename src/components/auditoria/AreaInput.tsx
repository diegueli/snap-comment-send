
import React from 'react';
import { Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

interface AreaInputProps {
  currentArea: string;
  setCurrentArea: (area: string) => void;
  onStartCamera: () => void;
  cameraPermission: 'granted' | 'denied' | 'prompt';
}

const AreaInput = ({ 
  currentArea, 
  setCurrentArea, 
  onStartCamera, 
  cameraPermission 
}: AreaInputProps) => {
  return (
    <Card className="card-instagram mb-6 animate-slide-up">
      <CardContent className="p-6">
        <label htmlFor="area" className="block text-sm font-semibold text-gray-700 mb-3">
          Área de Inspección
        </label>
        <Input
          id="area"
          placeholder="Ingrese el área a auditar..."
          value={currentArea}
          onChange={(e) => setCurrentArea(e.target.value)}
          className="input-instagram mb-4"
        />
        <Button
          onClick={onStartCamera}
          className="button-primary w-full"
          disabled={!currentArea.trim() || cameraPermission === 'denied'}
        >
          <Camera className="w-5 h-5 mr-2" />
          Iniciar Cámara
        </Button>
        {cameraPermission === 'denied' && (
          <p className="text-red-500 text-sm mt-2 text-center">
            Permiso de cámara denegado. Por favor, habilite el acceso a la cámara.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default AreaInput;
