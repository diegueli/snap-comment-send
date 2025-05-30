
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, CameraType } from 'react-camera-pro';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { X, Camera as CameraIcon, RotateCcw, Save } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface CameraAppProps {
  onClose: () => void;
  userData: {
    auditoriaId: string;
  };
}

interface UserProfile {
  id: string;
  name: string;
  position: string;
  gerencia_id: number | null;
}

interface Gerencia {
  id: number;
  nombre: string;
}

const CameraApp: React.FC<CameraAppProps> = ({ onClose, userData }) => {
  const camera = useRef<CameraType>(null);
  const { user } = useAuth();
  const [image, setImage] = useState<string | null>(null);
  const [area, setArea] = useState('');
  const [levantamiento, setLevantamiento] = useState('');
  const [evidencia, setEvidencia] = useState('');
  const [responsable, setResponsable] = useState('');
  const [loading, setLoading] = useState(false);
  const [gerencias, setGerencias] = useState<Gerencia[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    fetchGerencias();
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  const fetchGerencias = async () => {
    try {
      const { data, error } = await supabase
        .from('gerencias')
        .select('*')
        .order('nombre');

      if (error) throw error;
      setGerencias(data || []);
    } catch (error) {
      console.error('Error fetching gerencias:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las gerencias",
        variant: "destructive",
      });
    }
  };

  const fetchUserProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const takePhoto = useCallback(() => {
    if (camera.current) {
      const photo = camera.current.takePhoto();
      setImage(photo);
    }
  }, []);

  const retakePhoto = () => {
    setImage(null);
  };

  const saveAuditSet = async () => {
    if (!area || !levantamiento || !evidencia || !responsable) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos",
        variant: "destructive",
      });
      return;
    }

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
      let fotoUrl = null;

      // Upload photo if taken
      if (image) {
        const fileName = `audit_${userData.auditoriaId}_${Date.now()}.jpg`;
        const base64Data = image.split(',')[1];
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

        fotoUrl = urlData.publicUrl;
      }

      // Save audit set
      const { error } = await supabase.from('auditoria_sets').insert({
        auditoria_id: userData.auditoriaId,
        area,
        levantamiento,
        evidencia,
        gerencia_id: parseInt(responsable),
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

          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="area">Área</Label>
              <Input
                id="area"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="Ingresa el área"
              />
            </div>

            <div>
              <Label htmlFor="responsable">Responsable</Label>
              <Select value={responsable} onValueChange={setResponsable}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el responsable" />
                </SelectTrigger>
                <SelectContent>
                  {gerencias.map((gerencia) => (
                    <SelectItem key={gerencia.id} value={gerencia.id.toString()}>
                      {gerencia.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="levantamiento">Levantamiento</Label>
              <Textarea
                id="levantamiento"
                value={levantamiento}
                onChange={(e) => setLevantamiento(e.target.value)}
                placeholder="Describe el levantamiento"
                className="min-h-[100px]"
              />
            </div>

            <div>
              <Label htmlFor="evidencia">Evidencia</Label>
              <Textarea
                id="evidencia"
                value={evidencia}
                onChange={(e) => setEvidencia(e.target.value)}
                placeholder="Describe la evidencia"
                className="min-h-[100px]"
              />
            </div>
          </div>

          <Button onClick={saveAuditSet} disabled={loading} className="w-full">
            <Save className="mr-2 h-4 w-4" />
            {loading ? 'Guardando...' : 'Guardar Set de Auditoría'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default CameraApp;
