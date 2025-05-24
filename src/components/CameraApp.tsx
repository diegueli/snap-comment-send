
import React, { useState, useRef, useCallback } from 'react';
import { Camera, RotateCcw, Send, Trash2, MessageCircle, Plus, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';

interface CapturedPhoto {
  id: string;
  dataUrl: string;
  timestamp: Date;
}

interface PhotoSet {
  id: string;
  photos: CapturedPhoto[];
  comment: string;
  timestamp: Date;
}

const CameraApp = () => {
  const [currentPhotos, setCurrentPhotos] = useState<CapturedPhoto[]>([]);
  const [currentComment, setCurrentComment] = useState('');
  const [photoSets, setPhotoSets] = useState<PhotoSet[]>([]);
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
    if (!videoRef.current || !canvasRef.current || currentPhotos.length >= 3) {
      if (currentPhotos.length >= 3) {
        toast({
          title: "Maximum photos reached",
          description: "You can only take up to 3 photos per set.",
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

      setCurrentPhotos(prev => [...prev, newPhoto]);
      toast({
        title: "Photo captured!",
        description: `Photo ${currentPhotos.length + 1}/3 saved`,
      });

      if (currentPhotos.length + 1 >= 3) {
        stopCamera();
        toast({
          title: "All photos captured",
          description: "You can now add a comment and save this set.",
        });
      }
    }
  }, [currentPhotos.length, stopCamera]);

  const deletePhoto = useCallback((photoId: string) => {
    setCurrentPhotos(prev => prev.filter(photo => photo.id !== photoId));
    toast({
      title: "Photo deleted",
      description: "Photo removed from current set.",
    });
  }, []);

  const saveCurrentSet = useCallback(() => {
    if (currentPhotos.length === 0) {
      toast({
        title: "No photos to save",
        description: "Please capture at least one photo first.",
        variant: "destructive",
      });
      return;
    }

    const newSet: PhotoSet = {
      id: Date.now().toString(),
      photos: [...currentPhotos],
      comment: currentComment,
      timestamp: new Date()
    };

    setPhotoSets(prev => [...prev, newSet]);
    setCurrentPhotos([]);
    setCurrentComment('');
    
    toast({
      title: "Photo set saved!",
      description: `Set with ${newSet.photos.length} photo(s) added to document.`,
    });
  }, [currentPhotos, currentComment]);

  const deletePhotoSet = useCallback((setId: string) => {
    setPhotoSets(prev => prev.filter(set => set.id !== setId));
    toast({
      title: "Photo set deleted",
      description: "Set removed from document.",
    });
  }, []);

  const generatePDF = useCallback(async () => {
    if (photoSets.length === 0) {
      toast({
        title: "No photo sets to export",
        description: "Please create at least one photo set first.",
        variant: "destructive",
      });
      return;
    }

    const pdf = new jsPDF();
    const pageHeight = pdf.internal.pageSize.height;
    const pageWidth = pdf.internal.pageSize.width;
    let yPosition = 20;

    // Title
    pdf.setFontSize(20);
    pdf.text('Photo Collection', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 20;

    pdf.setFontSize(12);
    pdf.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 30;

    for (let i = 0; i < photoSets.length; i++) {
      const set = photoSets[i];
      
      // Check if we need a new page
      if (yPosition > pageHeight - 100) {
        pdf.addPage();
        yPosition = 20;
      }

      // Set header
      pdf.setFontSize(16);
      pdf.text(`Photo Set ${i + 1}`, 20, yPosition);
      yPosition += 15;

      // Add photos
      for (let j = 0; j < set.photos.length; j++) {
        const photo = set.photos[j];
        
        // Check if we need a new page for photos
        if (yPosition > pageHeight - 80) {
          pdf.addPage();
          yPosition = 20;
        }

        try {
          const imgWidth = 60;
          const imgHeight = 60;
          pdf.addImage(photo.dataUrl, 'JPEG', 20 + (j * 65), yPosition, imgWidth, imgHeight);
        } catch (error) {
          console.error('Error adding image to PDF:', error);
        }
      }
      
      yPosition += 70;

      // Add comment
      if (set.comment) {
        pdf.setFontSize(12);
        pdf.text('Comment:', 20, yPosition);
        yPosition += 10;
        
        const splitComment = pdf.splitTextToSize(set.comment, pageWidth - 40);
        pdf.text(splitComment, 20, yPosition);
        yPosition += splitComment.length * 5 + 10;
      }

      yPosition += 10;
    }

    return pdf;
  }, [photoSets]);

  const sendPDFEmail = useCallback(async () => {
    try {
      const pdf = await generatePDF();
      if (!pdf) return;

      const pdfBlob = pdf.output('blob');
      const pdfDataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(pdfBlob);
      });

      const subject = `Photo Collection - ${new Date().toLocaleDateString()}`;
      const body = `Hi there!\n\nI'm sharing a photo collection with you containing ${photoSets.length} photo set(s).\n\nTotal photos: ${photoSets.reduce((total, set) => total + set.photos.length, 0)}\n\nGenerated on: ${new Date().toLocaleString()}\n\nBest regards!`;
      
      const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location.href = mailtoLink;
      
      toast({
        title: "Email client opened",
        description: "PDF document details prepared for email.",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error generating PDF",
        description: "There was an issue creating the PDF document.",
        variant: "destructive",
      });
    }
  }, [photoSets, generatePDF]);

  const resetApp = useCallback(() => {
    setCurrentPhotos([]);
    setCurrentComment('');
    setPhotoSets([]);
    stopCamera();
    toast({
      title: "App reset",
      description: "All photo sets and comments cleared.",
    });
  }, [stopCamera]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader className="text-center pb-3">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              📸 Photo Collection
            </CardTitle>
            <p className="text-sm text-gray-600">
              Create multiple photo sets and export as PDF
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
                    disabled={currentPhotos.length >= 3}
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
                  {currentPhotos.length}/3
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
                  Take up to 3 photos per set and create multiple sets
                </p>
              </div>
              <Button
                onClick={startCamera}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
              >
                <Camera className="w-4 h-4 mr-2" />
                Start Camera
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Current Photo Gallery */}
        {currentPhotos.length > 0 && (
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                📷 Current Set ({currentPhotos.length}/3)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {currentPhotos.map((photo) => (
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
              
              {/* Current Comment */}
              <Textarea
                placeholder="Add a comment for this photo set..."
                value={currentComment}
                onChange={(e) => setCurrentComment(e.target.value)}
                className="resize-none border-gray-200 focus:border-purple-500 mb-4"
                rows={2}
              />
              
              <Button
                onClick={saveCurrentSet}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Save Photo Set
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Saved Photo Sets */}
        {photoSets.length > 0 && (
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Saved Sets ({photoSets.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {photoSets.map((set, index) => (
                <div key={set.id} className="border rounded-lg p-3 bg-gray-50">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">Set {index + 1}</h4>
                    <Button
                      onClick={() => deletePhotoSet(set.id)}
                      size="sm"
                      variant="destructive"
                      className="w-6 h-6 p-0"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-1 mb-2">
                    {set.photos.map((photo) => (
                      <img
                        key={photo.id}
                        src={photo.dataUrl}
                        alt="Set photo"
                        className="w-full aspect-square object-cover rounded"
                      />
                    ))}
                  </div>
                  {set.comment && (
                    <p className="text-sm text-gray-600 mt-2">{set.comment}</p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={sendPDFEmail}
            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
            disabled={photoSets.length === 0}
          >
            <Send className="w-4 h-4 mr-2" />
            Send PDF via Email
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
