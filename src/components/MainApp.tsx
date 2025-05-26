
import React, { useState } from 'react';
import { Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import CameraApp from './CameraApp';

const MainApp = () => {
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-red-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header with Logo */}
        <Card className="mb-6 bg-white shadow-lg">
          <CardHeader className="text-center">
            <div className="flex justify-center items-center mb-4">
              <img 
                src="/lovable-uploads/9ad6adb6-f76a-4982-92e9-09618c309f7c.png" 
                alt="Quinta alimentos logo" 
                className="h-16 object-contain"
              />
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-yellow-500 to-red-600 bg-clip-text text-transparent">
              Quinta Alimentos
            </CardTitle>
            <p className="text-gray-600">
              Sistema de Auditoría
            </p>
          </CardHeader>
        </Card>

        {/* Single Auditoria Button */}
        <div className="flex justify-center">
          <Dialog open={isCameraOpen} onOpenChange={setIsCameraOpen}>
            <DialogTrigger asChild>
              <Button 
                className="bg-gradient-to-r from-yellow-500 to-red-600 hover:from-yellow-600 hover:to-red-700 text-white px-8 py-4 text-lg font-semibold shadow-lg"
                size="lg"
              >
                <Camera className="w-6 h-6 mr-3" />
                Auditoría
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md mx-auto max-h-[90vh] overflow-y-auto p-0">
              <DialogHeader className="p-6 pb-0">
                <DialogTitle className="text-center">Auditoría</DialogTitle>
              </DialogHeader>
              <div className="p-0">
                <CameraApp onClose={() => setIsCameraOpen(false)} />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default MainApp;
