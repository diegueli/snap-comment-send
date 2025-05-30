
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
    <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
      <CardContent className="p-4">
        <label htmlFor="area" className="block text-sm font-medium text-gray-700 mb-2">
          Área
        </label>
        <Input
          id="area"
          placeholder="Ingrese el área"
          value={currentArea}
          onChange={(e) => setCurrentArea(e.target.value)}
          className="border-gray-200 focus:border-red-500 mb-4"
        />
        <Button
          onClick={onStartCamera}
          className="w-full bg-gradient-to-r from-yellow-500 to-red-600 hover:from-yellow-600 hover:to-red-700 text-white"
          disabled={!currentArea.trim() || cameraPermission === 'denied'}
        >
          <Camera className="w-4 h-4 mr-2" />
          Iniciar Cámara
        </Button>
      </CardContent>
    </Card>
  );
};

export default AreaInput;
