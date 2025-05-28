
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useBloqueosEmail } from '@/hooks/useBloqueosEmail';
import { useBloqueosData } from '@/hooks/useBloqueosData';
import { X, Shield } from 'lucide-react';
import BloqueosFormFields from './BloqueosFormFields';
import BloqueosFormActions from './BloqueosFormActions';

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

const BloqueosForm: React.FC<BloqueosFormProps> = ({ onClose }) => {
  const { user, profile } = useAuth();
  const { sendEmail, loading: emailLoading } = useBloqueosEmail();
  const { plantas, areas, productos, turnos } = useBloqueosData();
  const [loading, setLoading] = useState(false);

  const form = useForm<BloqueosFormData>({
    resolver: zodResolver(bloqueosSchema),
    defaultValues: {
      fecha: new Date().toLocaleDateString('es-ES'),
      quien_bloqueo: profile?.name || user?.email || '',
      planta_id: '',
      area_planta_id: '',
      producto_id: '',
      cantidad: '',
      lote: '',
      turno_id: '',
      motivo: '',
    },
  });

  useEffect(() => {
    if (profile?.name) {
      form.setValue('quien_bloqueo', profile.name);
    } else if (user?.email) {
      form.setValue('quien_bloqueo', user.email);
    }
  }, [profile, user, form]);

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

      form.reset();
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

  const handleGenerateEmail = () => {
    const formData = form.getValues();
    
    const planta = plantas.find(p => p.id.toString() === formData.planta_id)?.nombre || '';
    const area = areas.find(a => a.id.toString() === formData.area_planta_id)?.nombre || '';
    const producto = productos.find(p => p.id.toString() === formData.producto_id)?.nombre || '';
    const turno = turnos.find(t => t.id.toString() === formData.turno_id)?.nombre || '';

    const emailData = {
      planta,
      area,
      producto,
      cantidad: formData.cantidad,
      lote: formData.lote,
      turno,
      motivo: formData.motivo,
      fecha: formData.fecha,
      quien_bloqueo: formData.quien_bloqueo,
    };

    sendEmail(emailData);
  };

  return (
    <div className="flex flex-col h-full w-full bg-white">
      {/* Fixed Header */}
      <div className="bg-gradient-to-r from-red-500 to-orange-600 text-white p-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6" />
            <h2 className="text-xl font-semibold">Registrar Bloqueo</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 text-white hover:bg-white/20 rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Scrollable Content */}
      <div className="flex-1 overflow-hidden w-full">
        <div className="h-full overflow-y-auto">
          <div className="p-6 w-full">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 w-full">
                <BloqueosFormFields
                  form={form}
                  plantas={plantas}
                  areas={areas}
                  productos={productos}
                  turnos={turnos}
                />

                <BloqueosFormActions
                  loading={loading}
                  emailLoading={emailLoading}
                  onGenerateEmail={handleGenerateEmail}
                  onClose={onClose}
                />
              </form>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BloqueosForm;
