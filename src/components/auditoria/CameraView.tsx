
import React from 'react';
import { Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface CameraViewProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  currentPhotos: any[];
  currentArea: string;
  onCapturePhoto: () => void;
  onStopCamera: () => void;
}

const CameraView = ({ 
  videoRef, 
  currentPhotos, 
  currentArea, 
  onCapturePhoto, 
  onStopCamera 
}: CameraViewProps) => {
  return (
    <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl overflow-hidden">
      <CardContent className="p-0">
        <div className="relative aspect-square">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4">
            <Button
              onClick={onCapturePhoto}
              size="lg"
              className="rounded-full bg-white text-red-600 hover:bg-gray-100 shadow-lg"
              disabled={currentPhotos.length >= 3}
            >
              <Camera className="w-6 h-6" />
            </Button>
            <Button
              onClick={onStopCamera}
              variant="outline"
              size="lg"
              className="rounded-full bg-white/80 backdrop-blur-sm border-white"
            >
              Detener
            </Button>
          </div>
          <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
            {currentPhotos.length}/3
          </div>
          <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
            {currentArea}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CameraView;
