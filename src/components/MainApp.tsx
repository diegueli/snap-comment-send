
import React, { useState } from 'react';
import { Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import CameraApp from './CameraApp';

const MainApp = () => {
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <Card className="mb-6 bg-white shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              📱 Multi-Function App
            </CardTitle>
            <p className="text-gray-600">
              Your all-in-one mobile application
            </p>
          </CardHeader>
        </Card>

        {/* Single Auditoria Button */}
        <div className="flex justify-center">
          <Dialog open={isCameraOpen} onOpenChange={setIsCameraOpen}>
            <DialogTrigger asChild>
              <Button 
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 text-lg font-semibold"
                size="lg"
              >
                <Camera className="w-6 h-6 mr-3" />
                Auditoria
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md mx-auto max-h-[90vh] overflow-y-auto p-0">
              <DialogHeader className="p-6 pb-0">
                <DialogTitle className="text-center">Auditoria</DialogTitle>
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
