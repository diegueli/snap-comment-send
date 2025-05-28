import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { X, Shield } from 'lucide-react';
import BloqueosCameraModule from './BloqueosCameraModule';
import BloqueosFormFields from './BloqueosFormFields';
import BloqueosPhotoSection from './BloqueosPhotoSection';
import BloqueosFormActions from './BloqueosFormActions';
import { useBloqueoEmail } from '@/hooks/useBloqueoEmail';

const bloqueosSchema = z.object({
  planta_id: z.string().min(1, 'Selecciona una planta'),
  area_planta_id: z.string().min(1, 'Selecciona un área'),
  producto_id: z.string().min(1, 'Selecciona un producto'),
  cantidad: z.string().min(1, 'La cantidad es requerida'),
  lote: z.string().min(1, 'El lote es requerido'),
  turno_id: z.string().min(1, 'Selecciona un turno'),
  motivo: z.string().min(1, 'El motivo es requerido').max(150, 'El motivo no puede exceder 150 caracteres'),
  fecha: z.string().min(1, 'La fecha es requerida'),
  quien_bloqueo: z.string().min(1, 'El usuario es requerido'),
});

export type BloqueosFormData = z.infer<typeof bloqueosSchema>;

interface BloqueosFormProps {
  onClose: () => void;
}

interface CapturedPhoto {
  id: string;
  dataUrl: string;
  timestamp: Date;
}

const BloqueosForm: React.FC<BloqueosFormProps> = ({ onClose }) => {
  const { user, profile } = useAuth();
  const [plantas, setPlantas] = useState<Array<{ id: number; nombre: string }>>([]);
  const [areas, setAreas] = useState<Array<{ id: number; nombre: string }>>([]);
  const [productos, setProductos] = useState<Array<{ id: number; nombre: string }>>([]);
  const [turnos, setTurnos] = useState<Array<{ id: number; nombre: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const { generateBloqueoEmail, isGeneratingEmail } = useBloqueoEmail();

  // Format today's date as dd/mm/yyyy
  const formatDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const todayFormatted = formatDate(new Date());

  const form = useForm<BloqueosFormData>({
    resolver: zodResolver(bloqueosSchema),
    defaultValues: {
      fecha: todayFormatted,
      quien_bloqueo: profile?.name || '',
    },
  });

  useEffect(() => {
    loadDropdownData();
  }, []);

  useEffect(() => {
    if (profile?.name) {
      form.setValue('quien_bloqueo', profile.name);
    }
  }, [profile, form]);

  const loadDropdownData = async () => {
    try {
      const [plantasResult, areasResult, productosResult, turnosResult] = await Promise.all([
        supabase.from('plantas').select('*').order('nombre'),
        supabase.from('areas_planta').select('*').order('nombre'),
        supabase.from('productos').select('*').order('nombre'),
        supabase.from('turnos').select('*').order('nombre'),
      ]);

      if (plantasResult.error) throw plantasResult.error;
      if (areasResult.error) throw areasResult.error;
      if (productosResult.error) throw productosResult.error;
      if (turnosResult.error) throw turnosResult.error;

      setPlantas(plantasResult.data || []);
      setAreas(areasResult.data || []);
      setProductos(productosResult.data || []);
      setTurnos(turnosResult.data || []);
    } catch (error) {
      console.error('Error loading dropdown data:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las opciones del formulario",
        variant: "destructive",
      });
    }
  };

  const onSubmit = async (data: BloqueosFormData) => {
    if (!user) {
      toast({
        title: "Error",
        description: "Debes estar autenticado para crear un bloqueo",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Convert dd/mm/yyyy back to yyyy-mm-dd for database storage
      const [day, month, year] = data.fecha.split('/');
      const isoDate = `${year}-${month}-${day}`;

      const { error } = await supabase.from('bloqueos').insert({
        planta_id: parseInt(data.planta_id),
        area_planta_id: parseInt(data.area_planta_id),
        producto_id: parseInt(data.producto_id),
        cantidad: parseInt(data.cantidad),
        lote: parseInt(data.lote),
        turno_id: parseInt(data.turno_id),
        motivo: data.motivo,
        fecha: isoDate,
        quien_bloqueo: data.quien_bloqueo,
        user_id: user.id,
      });

      if (error) throw error;

      toast({
        title: "Bloqueo creado",
        description: "El bloqueo se ha registrado exitosamente",
      });

      form.reset({
        planta_id: '',
        area_planta_id: '',
        producto_id: '',
        cantidad: '',
        lote: '',
        turno_id: '',
        motivo: '',
        fecha: todayFormatted,
        quien_bloqueo: profile?.name || '',
      });
      setPhotos([]);
      onClose();
    } catch (error: any) {
      console.error('Error creating bloqueo:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el bloqueo",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputFocus = (fieldName: 'cantidad' | 'lote') => {
    const currentValue = form.getValues(fieldName);
    if (currentValue === '' || currentValue === '0') {
      form.setValue(fieldName, '');
    }
  };

  const handleGenerateEmail = () => {
    const formData = form.getValues();
    
    // Obtener nombres de los elementos seleccionados
    const plantaSeleccionada = plantas.find(p => p.id.toString() === formData.planta_id);
    const areaSeleccionada = areas.find(a => a.id.toString() === formData.area_planta_id);
    const productoSeleccionado = productos.find(p => p.id.toString() === formData.producto_id);
    const turnoSeleccionado = turnos.find(t => t.id.toString() === formData.turno_id);
    
    if (!plantaSeleccionada || !areaSeleccionada || !productoSeleccionado || !turnoSeleccionado) {
      toast({
        title: "Información incompleta",
        description: "Por favor completa todos los campos del formulario antes de generar el correo",
        variant: "destructive",
      });
      return;
    }

    const emailData = {
      planta_nombre: plantaSeleccionada.nombre,
      area_nombre: areaSeleccionada.nombre,
      producto_nombre: productoSeleccionado.nombre,
      cantidad: formData.cantidad,
      lote: formData.lote,
      turno_nombre: turnoSeleccionado.nombre,
      motivo: formData.motivo,
      fecha: formData.fecha,
      quien_bloqueo: formData.quien_bloqueo,
    };

    generateBloqueoEmail(emailData, photos);
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-gradient-to-br from-yellow-400 via-red-500 to-orange-600 p-6 rounded-lg">
      {showCamera ? (
        <BloqueosCameraModule
          photos={photos}
          onPhotosChange={setPhotos}
          onClose={() => setShowCamera(false)}
        />
      ) : (
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-yellow-500 to-red-600 text-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="h-8 w-8" />
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-white to-yellow-100 bg-clip-text text-transparent">
                  🛡️ Registrar Bloqueo
                </CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 text-white hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <BloqueosFormFields
                  control={form.control}
                  plantas={plantas}
                  areas={areas}
                  productos={productos}
                  turnos={turnos}
                  onInputFocus={handleInputFocus}
                />

                <BloqueosPhotoSection
                  photos={photos}
                  onShowCamera={() => setShowCamera(true)}
                />

                <BloqueosFormActions
                  loading={loading}
                  isGeneratingEmail={isGeneratingEmail}
                  onGenerateEmail={handleGenerateEmail}
                  onClose={onClose}
                />
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BloqueosForm;
