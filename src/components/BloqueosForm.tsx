
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { X, Mail } from 'lucide-react';
import { useDropdownData } from '@/hooks/useDropdownData';
import FormHeader from './FormHeader';
import SelectField from './common/SelectField';
import InputField from './common/InputField';
import TextareaField from './common/TextareaField';
import ProductCombobox from './ProductCombobox';

const bloqueosSchema = z.object({
  planta_id: z.string().min(1, 'Selecciona una planta'),
  area_planta_id: z.string().min(1, 'Selecciona un área'),
  producto_id: z.string().min(1, 'Selecciona un producto'),
  cantidad: z.number().min(1, 'La cantidad debe ser mayor a 0'),
  lote: z.number().min(1, 'El lote debe ser mayor a 0'),
  turno_id: z.string().min(1, 'Selecciona un turno'),
  motivo: z.string().min(1, 'El motivo es requerido').max(150, 'El motivo no puede exceder 150 caracteres'),
  fecha: z.string().min(1, 'La fecha es requerida'),
  usuario: z.string().min(1, 'El usuario es requerido'),
});

type BloqueosFormData = z.infer<typeof bloqueosSchema>;

interface BloqueosFormProps {
  onClose: () => void;
}

const BloqueosForm: React.FC<BloqueosFormProps> = ({ onClose }) => {
  const { user, profile } = useAuth();
  const { data: dropdownData, loading: dropdownLoading } = useDropdownData();
  const [loading, setLoading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  const getCurrentDateFormatted = () => {
    const today = new Date();
    const day = today.getDate().toString().padStart(2, '0');
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const year = today.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const form = useForm<BloqueosFormData>({
    resolver: zodResolver(bloqueosSchema),
    defaultValues: {
      planta_id: '',
      area_planta_id: '',
      producto_id: '',
      cantidad: undefined,
      lote: undefined,
      turno_id: '',
      motivo: '',
      fecha: getCurrentDateFormatted(),
      usuario: profile?.name || '',
    },
  });

  useEffect(() => {
    if (profile?.name) {
      form.setValue('usuario', profile.name);
    }
  }, [profile, form]);

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
      const dateParts = data.fecha.split('/');
      const dbDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;

      const { error } = await supabase.from('bloqueos').insert({
        planta_id: parseInt(data.planta_id),
        area_planta_id: parseInt(data.area_planta_id),
        producto_id: parseInt(data.producto_id),
        cantidad: data.cantidad,
        lote: data.lote,
        turno_id: parseInt(data.turno_id),
        motivo: data.motivo,
        fecha: dbDate,
        quien_bloqueo: data.usuario,
        user_id: user.id,
      });

      if (error) throw error;

      toast({
        title: "Bloqueo creado",
        description: "El bloqueo se ha registrado exitosamente. Los valores se conservan para envío por correo.",
      });
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

  const sendEmail = async () => {
    const formData = form.getValues();
    
    const plantaName = dropdownData.plantas.find(p => p.id.toString() === formData.planta_id)?.nombre || 'No seleccionada';
    const areaName = dropdownData.areas.find(a => a.id.toString() === formData.area_planta_id)?.nombre || 'No seleccionada';
    const turnoName = dropdownData.turnos.find(t => t.id.toString() === formData.turno_id)?.nombre || 'No seleccionado';

    let productoName = 'No seleccionado';
    if (formData.producto_id) {
      try {
        const { data: producto } = await supabase
          .from('productos')
          .select('nombre')
          .eq('id', parseInt(formData.producto_id))
          .single();
        
        if (producto?.nombre) {
          productoName = producto.nombre;
        }
      } catch (error) {
        console.error('Error fetching product name:', error);
      }
    }

    const emailBody = `
Datos del Bloqueo:

Planta: ${plantaName}
Area de Planta: ${areaName}
Producto: ${productoName}
Cantidad: ${formData.cantidad}
Lote: ${formData.lote}
Turno: ${turnoName}
Motivo: ${formData.motivo}
Fecha: ${formData.fecha}
Usuario: ${formData.usuario}
    `;

    setSendingEmail(true);
    try {
      const subject = encodeURIComponent(`Registro de Bloqueo - ${plantaName} - ${productoName} - ${formData.fecha}`);
      const body = encodeURIComponent(emailBody.trim());
      const mailtoLink = `mailto:?subject=${subject}&body=${body}`;
      
      window.location.href = mailtoLink;
      
      toast({
        title: "Cliente de correo abierto",
        description: "Se ha abierto tu cliente de correo predeterminado con los datos del bloqueo",
      });
    } catch (error) {
      console.error('Error opening email client:', error);
      toast({
        title: "Error",
        description: "No se pudo abrir el cliente de correo",
        variant: "destructive",
      });
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto overflow-y-auto max-h-[80vh]">
      <FormHeader 
        title="Módulo de Bloqueos"
        description="Este módulo permite registrar y gestionar bloqueos de productos en el sistema. Documenta productos que requieren retención por motivos de calidad, seguridad o control de procesos, asegurando la trazabilidad completa desde la identificación hasta la resolución del bloqueo."
      />

      <Card className="border-red-200 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-red-50 to-orange-50">
          <CardTitle className="text-xl font-bold text-red-800 flex-1 text-center">
            Registrar Bloqueo
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 text-red-600 hover:bg-red-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SelectField
                  control={form.control}
                  name="planta_id"
                  label="Planta"
                  placeholder="Selecciona una planta"
                  options={dropdownData.plantas}
                  required
                />

                <SelectField
                  control={form.control}
                  name="area_planta_id"
                  label="Área de Planta"
                  placeholder="Selecciona un área"
                  options={dropdownData.areas}
                  required
                />

                <div>
                  <label className="text-red-800 text-sm font-medium">Producto *</label>
                  <ProductCombobox
                    value={form.watch('producto_id')}
                    onValueChange={(value) => form.setValue('producto_id', value)}
                    placeholder="Buscar y seleccionar producto..."
                  />
                </div>

                <SelectField
                  control={form.control}
                  name="turno_id"
                  label="Turno"
                  placeholder="Selecciona un turno"
                  options={dropdownData.turnos}
                  required
                />

                <InputField
                  control={form.control}
                  name="cantidad"
                  label="Cantidad"
                  placeholder="Ingresa la cantidad"
                  type="number"
                  required
                />

                <InputField
                  control={form.control}
                  name="lote"
                  label="Lote"
                  placeholder="Ingresa el número de lote"
                  type="number"
                  required
                />

                <InputField
                  control={form.control}
                  name="fecha"
                  label="Fecha"
                  placeholder=""
                  readOnly
                />

                <InputField
                  control={form.control}
                  name="usuario"
                  label="Usuario"
                  placeholder="Usuario que registra el bloqueo"
                  readOnly
                />
              </div>

              <TextareaField
                control={form.control}
                name="motivo"
                label="Motivo del Bloqueo"
                placeholder="Describe el motivo del bloqueo (máximo 150 caracteres)"
                maxLength={150}
                showCharCount
                required
              />

              <div className="flex flex-col sm:flex-row gap-3 pt-6">
                <Button 
                  type="submit" 
                  disabled={loading || dropdownLoading} 
                  className="flex-1 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
                >
                  {loading ? 'Guardando...' : 'Registrar Bloqueo'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={sendEmail}
                  disabled={sendingEmail}
                  className="flex-1 sm:flex-none border-red-200 text-red-600 hover:bg-red-50"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  {sendingEmail ? 'Enviando...' : 'Enviar por Correo'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onClose}
                  className="flex-1 sm:flex-none border-red-200 text-red-600 hover:bg-red-50"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default BloqueosForm;
