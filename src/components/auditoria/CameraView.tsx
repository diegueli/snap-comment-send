
import React from 'react';
import { Camera, X } from 'lucide-react';
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
    <Card className="card-instagram overflow-hidden animate-scale-in">
      <CardContent className="p-0">
        <div className="relative aspect-square bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          
          {/* Overlay with gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 pointer-events-none"></div>
          
          {/* Top Info Bar */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
            <div className="glass-effect px-3 py-2 rounded-full">
              <span className="text-white text-sm font-medium">{currentArea}</span>
            </div>
            <div className="glass-effect px-3 py-2 rounded-full">
              <span className="text-white text-sm font-bold">{currentPhotos.length}/3</span>
            </div>
          </div>
          
          {/* Camera Controls */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-6">
            <Button
              onClick={onStopCamera}
              variant="outline"
              size="lg"
              className="rounded-full w-14 h-14 glass-effect border-white/30 hover:bg-white/20 text-white p-0"
            >
              <X className="w-6 h-6" />
            </Button>
            
            <Button
              onClick={onCapturePhoto}
              size="lg"
              className="rounded-full w-20 h-20 bg-white hover:bg-gray-100 text-gray-800 p-0 shadow-lg transition-all duration-200 active:scale-95"
              disabled={currentPhotos.length >= 3}
            >
              <Camera className="w-8 h-8" />
            </Button>
            
            <div className="w-14 h-14"></div> {/* Spacer for balance */}
          </div>
          
          {/* Photo counter dots */}
          <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 flex gap-2">
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  index < currentPhotos.length
                    ? 'bg-white shadow-lg'
                    : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CameraView;
