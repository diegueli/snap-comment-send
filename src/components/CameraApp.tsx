import React, { useState, useRef, useCallback } from 'react';
import { Camera, X, RotateCcw, Download, Edit2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import AuditoriaForm from './AuditoriaForm';
import jsPDF from 'jspdf';

interface CameraAppProps {
  onClose: () => void;
  userData: {
    name: string;
    email: string;
    position: string;
  };
}

interface PhotoSet {
  id: string;
  title: string;
  photos: string[];
  comment: string;
}

interface AuditoriaData {
  id: string;
  titulo_documento: string;
  fecha: string;
  auditor: string;
  area: string;
  levantamiento?: string;
  responsable?: string;
  fecha_compromiso?: string;
  status: string;
  evidencia?: string;
}

const CameraApp = ({ onClose, userData }: CameraAppProps) => {
  const [currentView, setCurrentView] = useState<'form' | 'camera'>('form');
  const [auditoriaData, setAuditoriaData] = useState<AuditoriaData | null>(null);
  const [currentPhoto, setCurrentPhoto] = useState<string | null>(null);
  const [photoSets, setPhotoSets] = useState<PhotoSet[]>([]);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [tempTitle, setTempTitle] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [tempComment, setTempComment] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('No se pudo acceder a la cámara. Asegúrate de permitir el acceso.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);
        
        const dataURL = canvas.toDataURL('image/jpeg', 0.8);
        setCurrentPhoto(dataURL);
      }
    }
  };

  const handleStartCamera = (data: AuditoriaData) => {
    setAuditoriaData(data);
    setCurrentView('camera');
    setTimeout(startCamera, 100);
  };

  const addPhotoToCurrentSet = () => {
    if (!currentPhoto || !auditoriaData) return;

    setPhotoSets(prev => {
      const newSets = [...prev];
      
      if (newSets[currentSetIndex]) {
        newSets[currentSetIndex].photos.push(currentPhoto);
      } else {
        newSets[currentSetIndex] = {
          id: `set-${Date.now()}`,
          title: auditoriaData.area,
          photos: [currentPhoto],
          comment: ''
        };
      }
      
      return newSets;
    });
    
    setCurrentPhoto(null);
  };

  const createNewSet = () => {
    if (!auditoriaData) return;
    
    const newSetIndex = photoSets.length;
    setCurrentSetIndex(newSetIndex);
    setPhotoSets(prev => [...prev, {
      id: `set-${Date.now()}`,
      title: auditoriaData.area,
      photos: [],
      comment: ''
    }]);
  };

  const switchToSet = (index: number) => {
    setCurrentSetIndex(index);
  };

  const startEditingTitle = (setId: string, currentTitle: string) => {
    setEditingTitleId(setId);
    setTempTitle(currentTitle);
  };

  const saveTitle = (setId: string) => {
    setPhotoSets(prev => 
      prev.map(set => 
        set.id === setId ? { ...set, title: tempTitle } : set
      )
    );
    setEditingTitleId(null);
    setTempTitle('');
  };

  const startEditingComment = (setId: string, currentComment: string) => {
    setEditingCommentId(setId);
    setTempComment(currentComment);
  };

  const saveComment = (setId: string) => {
    setPhotoSets(prev => 
      prev.map(set => 
        set.id === setId ? { ...set, comment: tempComment } : set
      )
    );
    setEditingCommentId(null);
    setTempComment('');
  };

  const generatePDF = () => {
    if (!auditoriaData) return;

    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.width;
    const pageHeight = pdf.internal.pageSize.height;
    
    // Header
    pdf.setFontSize(20);
    pdf.text('Quinta Alimentos', pageWidth / 2, 30, { align: 'center' });
    
    pdf.setFontSize(16);
    pdf.text('Auditoría', pageWidth / 2, 45, { align: 'center' });
    
    // Document info
    pdf.setFontSize(12);
    let yPosition = 65;
    
    pdf.text(`Título: ${auditoriaData.titulo_documento}`, 20, yPosition);
    yPosition += 10;
    pdf.text(`Fecha: ${auditoriaData.fecha}`, 20, yPosition);
    yPosition += 10;
    pdf.text(`Auditor: ${auditoriaData.auditor}`, 20, yPosition);
    yPosition += 10;
    
    if (auditoriaData.responsable) {
      pdf.text(`Responsable: ${auditoriaData.responsable}`, 20, yPosition);
      yPosition += 10;
    }
    
    if (auditoriaData.fecha_compromiso) {
      pdf.text(`Fecha de Compromiso: ${auditoriaData.fecha_compromiso}`, 20, yPosition);
      yPosition += 10;
    }
    
    pdf.text(`Status: ${auditoriaData.status}`, 20, yPosition);
    yPosition += 15;

    // Photo sets
    photoSets.forEach((set, setIndex) => {
      if (set.photos.length === 0) return;
      
      // Check if we need a new page
      if (yPosition > pageHeight - 100) {
        pdf.addPage();
        yPosition = 30;
      }
      
      // Set title
      pdf.setFontSize(14);
      pdf.text(`${set.title}`, 20, yPosition);
      yPosition += 15;
      
      // Set comment if exists
      if (set.comment.trim()) {
        pdf.setFontSize(10);
        const commentLines = pdf.splitTextToSize(`Levantamiento: ${set.comment}`, pageWidth - 40);
        pdf.text(commentLines, 20, yPosition);
        yPosition += commentLines.length * 5 + 10;
      }
      
      // Photos
      set.photos.forEach((photo, photoIndex) => {
        if (yPosition > pageHeight - 80) {
          pdf.addPage();
          yPosition = 30;
        }
        
        try {
          const imgWidth = 60;
          const imgHeight = 80;
          pdf.addImage(photo, 'JPEG', 20, yPosition, imgWidth, imgHeight);
          yPosition += imgHeight + 10;
        } catch (error) {
          console.error('Error adding image to PDF:', error);
        }
      });
      
      yPosition += 10;
    });
    
    pdf.save(`auditoria_${auditoriaData.titulo_documento}_${auditoriaData.fecha}.pdf`);
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  if (currentView === 'form') {
    return <AuditoriaForm onStartCamera={handleStartCamera} />;
  }

  const currentSet = photoSets[currentSetIndex];

  return (
    <div className="w-full max-w-md mx-auto bg-white">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-lg font-semibold">Auditoría</h2>
        <Button onClick={handleClose} variant="ghost" size="sm">
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Document Info */}
      {auditoriaData && (
        <div className="p-4 bg-gray-50 border-b">
          <h3 className="font-medium">{auditoriaData.titulo_documento}</h3>
          <p className="text-sm text-gray-600">
            {auditoriaData.fecha} - {auditoriaData.auditor}
          </p>
        </div>
      )}

      {/* Set Navigation */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">
            {currentSet ? currentSet.title : auditoriaData?.area || 'Nuevo Conjunto'}
          </span>
          <span className="text-xs text-gray-500">
            {currentSetIndex + 1}/{Math.max(photoSets.length, 1)}
          </span>
        </div>
        
        <div className="flex gap-2 overflow-x-auto">
          {photoSets.map((set, index) => (
            <Button
              key={set.id}
              onClick={() => switchToSet(index)}
              variant={index === currentSetIndex ? 'default' : 'outline'}
              size="sm"
              className="whitespace-nowrap"
            >
              {set.title} ({set.photos.length})
            </Button>
          ))}
          <Button onClick={createNewSet} variant="outline" size="sm">
            +
          </Button>
        </div>
      </div>

      {/* Camera View */}
      <div className="relative">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-64 object-cover bg-black"
        />
        <canvas ref={canvasRef} className="hidden" />
        
        {currentPhoto && (
          <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
            <div className="bg-white p-4 rounded-lg max-w-xs">
              <img src={currentPhoto} alt="Captured" className="w-full h-40 object-cover rounded mb-3" />
              <div className="flex gap-2">
                <Button onClick={() => setCurrentPhoto(null)} variant="outline" size="sm" className="flex-1">
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Repetir
                </Button>
                <Button onClick={addPhotoToCurrentSet} size="sm" className="flex-1">
                  Guardar
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Camera Controls */}
      <div className="p-4 border-b">
        <Button onClick={takePhoto} className="w-full" size="lg">
          <Camera className="w-5 h-5 mr-2" />
          Tomar Foto
        </Button>
      </div>

      {/* Current Set Photos */}
      {currentSet && currentSet.photos.length > 0 && (
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <span className="font-medium">
              {editingTitleId === currentSet.id ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={tempTitle}
                    onChange={(e) => setTempTitle(e.target.value)}
                    className="text-sm"
                    onKeyPress={(e) => e.key === 'Enter' && saveTitle(currentSet.id)}
                  />
                  <Button
                    onClick={() => saveTitle(currentSet.id)}
                    size="sm"
                    variant="ghost"
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span>{currentSet.title}</span>
                  <Button
                    onClick={() => startEditingTitle(currentSet.id, currentSet.title)}
                    size="sm"
                    variant="ghost"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </span>
          </div>
          
          <div className="grid grid-cols-3 gap-2 mb-4">
            {currentSet.photos.map((photo, index) => (
              <div key={index} className="aspect-square">
                <img 
                  src={photo} 
                  alt={`Foto ${index + 1}`}
                  className="w-full h-full object-cover rounded border"
                />
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Levantamiento</Label>
            {editingCommentId === currentSet.id ? (
              <div className="space-y-2">
                <Textarea
                  value={tempComment}
                  onChange={(e) => setTempComment(e.target.value)}
                  placeholder="Observaciones para este conjunto..."
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => saveComment(currentSet.id)}
                    size="sm"
                    className="flex-1"
                  >
                    Guardar
                  </Button>
                  <Button
                    onClick={() => {
                      setEditingCommentId(null);
                      setTempComment('');
                    }}
                    size="sm"
                    variant="outline"
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="p-2 bg-gray-50 rounded border min-h-[60px]">
                  {currentSet.comment || 'Sin observaciones'}
                </div>
                <Button
                  onClick={() => startEditingComment(currentSet.id, currentSet.comment)}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  {currentSet.comment ? 'Editar Observaciones' : 'Agregar Observaciones'}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Export Button */}
      {photoSets.some(set => set.photos.length > 0) && (
        <div className="p-4">
          <Button onClick={generatePDF} className="w-full" size="lg">
            <Download className="w-5 h-5 mr-2" />
            Generar PDF
          </Button>
        </div>
      )}
    </div>
  );
};

export default CameraApp;
