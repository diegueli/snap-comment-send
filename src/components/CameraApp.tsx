
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, CameraType } from 'react-camera-pro';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Camera as CameraIcon, RotateCcw, Save } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useDropdownData } from '@/hooks/useDropdownData';
import SelectField from './common/SelectField';
import InputField from './common/InputField';
import TextareaField from './common/TextareaField';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@/components/ui/form';
import * as z from 'zod';

const auditSetSchema = z.object({
  area: z.string().min(1, 'El área es requerida'),
  levantamiento: z.string().min(1, 'El levantamiento es requerido'),
  evidencia: z.string().min(1, 'La evidencia es requerida'),
  responsable: z.string().min(1, 'Selecciona un responsable'),
});

type AuditSetFormData = z.infer<typeof auditSetSchema>;

interface CameraAppProps {
  onClose: () => void;
  userData: {
    auditoriaId: string;
    name: string;
    email: string;
    position: string;
  };
}

const CameraApp: React.FC<CameraAppProps> = ({ onClose, userData }) => {
  const camera = useRef<CameraType>(null);
  const { user } = useAuth();
  const { data: dropdownData } = useDropdownData();
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<AuditSetFormData>({
    resolver: zodResolver(auditSetSchema),
    defaultValues: {
      area: '',
      levantamiento: '',
      evidencia: '',
      responsable: '',
    },
  });

  const takePhoto = useCallback(() => {
    if (camera.current) {
      const photo = camera.current.takePhoto();
      if (typeof photo === 'string') {
        setImage(photo);
      }
    }
  }, []);

  const retakePhoto = () => {
    setImage(null);
  };

  const uploadPhoto = async (imageData: string): Promise<string | null> => {
    try {
      const fileName = `audit_${userData.auditoriaId}_${Date.now()}.jpg`;
      const base64Data = imageData.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      const file = new Blob([byteArray], { type: 'image/jpeg' });

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('audit-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('audit-photos')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading photo:', error);
      return null;
    }
  };

  const onSubmit = async (data: AuditSetFormData) => {
    if (!image) {
      toast({
        title: "Foto requerida",
        description: "Por favor toma una foto antes de guardar",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const fotoUrl = await uploadPhoto(image);

      const { error } = await supabase.from('auditoria_sets').insert({
        auditoria_id: userData.auditoriaId,
        area: data.area,
        levantamiento: data.levantamiento,
        evidencia: data.evidencia,
        gerencia_id: parseInt(data.responsable),
        foto_urls: fotoUrl ? [fotoUrl] : null,
      });

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Set de auditoría guardado correctamente",
      });

      onClose();
    } catch (error: any) {
      console.error('Error saving audit set:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar el set de auditoría",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Cámara de Auditoría</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {!image ? (
            <div className="space-y-4">
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                <Camera
                  ref={camera}
                  aspectRatio={16 / 9}
                  numberOfCamerasCallback={() => {}}
                  errorMessages={{
                    noCameraAccessible: 'No hay cámaras accesibles',
                    permissionDenied: 'Permiso denegado para acceder a la cámara',
                    switchCamera: 'No es posible cambiar de cámara',
                    canvas: 'Canvas no soportado',
                  }}
                />
              </div>
              <Button onClick={takePhoto} className="w-full">
                <CameraIcon className="mr-2 h-4 w-4" />
                Tomar Foto
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                <img src={image} alt="Foto tomada" className="w-full h-full object-cover" />
              </div>
              <Button onClick={retakePhoto} variant="outline" className="w-full">
                <RotateCcw className="mr-2 h-4 w-4" />
                Tomar Nueva Foto
              </Button>
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <InputField
                control={form.control}
                name="area"
                label="Área"
                placeholder="Ingresa el área"
                required
              />

              <SelectField
                control={form.control}
                name="responsable"
                label="Responsable"
                placeholder="Selecciona el responsable"
                options={dropdownData.gerencias}
                required
              />

              <TextareaField
                control={form.control}
                name="levantamiento"
                label="Levantamiento"
                placeholder="Describe el levantamiento"
                required
              />

              <TextareaField
                control={form.control}
                name="evidencia"
                label="Evidencia"
                placeholder="Describe la evidencia"
                required
              />

              <Button type="submit" disabled={loading} className="w-full">
                <Save className="mr-2 h-4 w-4" />
                {loading ? 'Guardando...' : 'Guardar Set de Auditoría'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CameraApp;
