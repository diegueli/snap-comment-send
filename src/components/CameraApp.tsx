
import React, { useState, useRef, useCallback } from 'react';
import { Camera, RotateCcw, Send, Trash2, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

interface CapturedPhoto {
  id: string;
  dataUrl: string;
  timestamp: Date;
}

const CameraApp = () => {
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const [comment, setComment] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsCapturing(true);
      toast({
        title: "Camera started",
        description: "Ready to take photos!",
      });
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Camera error",
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive",
      });
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCapturing(false);
  }, [stream]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || photos.length >= 3) {
      if (photos.length >= 3) {
        toast({
          title: "Maximum photos reached",
          description: "You can only take up to 3 photos.",
          variant: "destructive",
        });
      }
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (context) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);
      
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      const newPhoto: CapturedPhoto = {
        id: Date.now().toString(),
        dataUrl,
        timestamp: new Date()
      };

      setPhotos(prev => [...prev, newPhoto]);
      toast({
        title: "Photo captured!",
        description: `Photo ${photos.length + 1}/3 saved`,
      });

      if (photos.length + 1 >= 3) {
        stopCamera();
        toast({
          title: "All photos captured",
          description: "You can now add a comment and send via email.",
        });
      }
    }
  }, [photos.length, stopCamera]);

  const deletePhoto = useCallback((photoId: string) => {
    setPhotos(prev => prev.filter(photo => photo.id !== photoId));
    toast({
      title: "Photo deleted",
      description: "Photo removed from your collection.",
    });
  }, []);

  const sendEmail = useCallback(() => {
    if (photos.length === 0) {
      toast({
        title: "No photos to send",
        description: "Please capture at least one photo first.",
        variant: "destructive",
      });
      return;
    }

    // Create email content
    const subject = `Photo Collection - ${new Date().toLocaleDateString()}`;
    const body = `Hi there!\n\nI'm sharing ${photos.length} photo(s) with you.\n\nComment: ${comment || 'No comment provided'}\n\nPhotos captured on: ${new Date().toLocaleString()}\n\nBest regards!`;
    
    // Create mailto link
    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    // Open default email client
    window.location.href = mailtoLink;
    
    toast({
      title: "Email client opened",
      description: "Your default email app should open with the photo details.",
    });
  }, [photos, comment]);

  const resetApp = useCallback(() => {
    setPhotos([]);
    setComment('');
    stopCamera();
    toast({
      title: "App reset",
      description: "All photos and comments cleared.",
    });
  }, [stopCamera]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader className="text-center pb-3">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              📸 Photo Capture
            </CardTitle>
            <p className="text-sm text-gray-600">
              Capture up to 3 photos, add a comment, and share via email
            </p>
          </CardHeader>
        </Card>

        {/* Camera Section */}
        {isCapturing ? (
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl overflow-hidden">
            <CardContent className="p-0">
              <div className="relative aspect-square">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4">
                  <Button
                    onClick={capturePhoto}
                    size="lg"
                    className="rounded-full bg-white text-purple-600 hover:bg-gray-100 shadow-lg"
                    disabled={photos.length >= 3}
                  >
                    <Camera className="w-6 h-6" />
                  </Button>
                  <Button
                    onClick={stopCamera}
                    variant="outline"
                    size="lg"
                    className="rounded-full bg-white/80 backdrop-blur-sm border-white"
                  >
                    Stop
                  </Button>
                </div>
                <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                  {photos.length}/3
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
            <CardContent className="p-6 text-center">
              <div className="mb-4">
                <Camera className="w-16 h-16 mx-auto text-purple-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Ready to capture photos?</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Take up to 3 photos and share them with a comment via email
                </p>
              </div>
              <Button
                onClick={startCamera}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                disabled={photos.length >= 3}
              >
                <Camera className="w-4 h-4 mr-2" />
                {photos.length >= 3 ? 'Maximum Photos Reached' : 'Start Camera'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Photo Gallery */}
        {photos.length > 0 && (
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                📷 Captured Photos ({photos.length}/3)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                {photos.map((photo) => (
                  <div key={photo.id} className="relative group">
                    <img
                      src={photo.dataUrl}
                      alt={`Captured photo ${photo.id}`}
                      className="w-full aspect-square object-cover rounded-lg shadow-md"
                    />
                    <Button
                      onClick={() => deletePhoto(photo.id)}
                      size="sm"
                      variant="destructive"
                      className="absolute top-1 right-1 w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Comment Section */}
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Add a Comment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Write a comment about your photos..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="resize-none border-gray-200 focus:border-purple-500"
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={sendEmail}
            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
            disabled={photos.length === 0}
          >
            <Send className="w-4 h-4 mr-2" />
            Send via Email
          </Button>
          <Button
            onClick={resetApp}
            variant="outline"
            className="bg-white/80 backdrop-blur-sm border-white hover:bg-white"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
};

export default CameraApp;
