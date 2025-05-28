import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useBloqueosEmail } from '@/hooks/useBloqueosEmail';
import { X, Shield, Mail } from 'lucide-react';

const bloqueosSchema = z.object({
  planta_id: z.string().min(1, 'Selecciona una planta'),
  area_planta_id: z.string().min(1, 'Selecciona un área'),
  producto_id: z.string().min(1, 'Selecciona un producto'),
  cantidad: z.string().min(1, 'La cantidad es requerida').transform((val) => parseInt(val)),
  lote: z.string().min(1, 'El lote es requerido').transform((val) => parseInt(val)),
  turno_id: z.string().min(1, 'Selecciona un turno'),
  motivo: z.string().min(1, 'El motivo es requerido').max(150, 'El motivo no puede exceder 150 caracteres'),
  fecha: z.string().min(1, 'La fecha es requerida'),
  quien_bloqueo: z.string().min(1, 'El usuario es requerido'),
});

type BloqueosFormData = z.infer<typeof bloqueosSchema>;

interface BloqueosFormProps {
  onClose: () => void;
}

const BloqueosForm: React.FC<BloqueosFormProps> = ({ onClose }) => {
  const { user, profile } = useAuth();
  const { sendEmail, loading: emailLoading } = useBloqueosEmail();
  const [plantas, setPlantas] = useState<Array<{ id: number; nombre: string }>>([]);
  const [areas, setAreas] = useState<Array<{ id: number; nombre: string }>>([]);
  const [productos, setProductos] = useState<Array<{ id: number; nombre: string }>>([]);
  const [turnos, setTurnos] = useState<Array<{ id: number; nombre: string }>>([]);
  const [loading, setLoading] = useState(false);

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
      planta_id: '',
      area_planta_id: '',
      producto_id: '',
      cantidad: '',
      lote: '',
      turno_id: '',
      motivo: '',
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
        cantidad: data.cantidad,
        lote: data.lote,
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
    
    // Get display names for dropdowns
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
    <div className="w-full h-full bg-gradient-to-br from-yellow-50 to-red-50 p-6 flex items-center justify-center">
      <Card className="w-full max-w-5xl border-2 border-red-200 shadow-xl bg-white max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader className="bg-gradient-to-r from-yellow-500 to-red-600 text-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8" />
              <CardTitle className="text-2xl font-bold">
                Registrar Bloqueo
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
        <CardContent className="p-6 flex-1 overflow-y-auto">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="planta_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-semibold">Planta</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="border-red-200 focus:border-red-500 focus:ring-red-500">
                            <SelectValue placeholder="Selecciona una planta" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white border-red-200">
                          {plantas.map((planta) => (
                            <SelectItem key={planta.id} value={planta.id.toString()}>
                              {planta.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="area_planta_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-semibold">Área de Planta</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="border-red-200 focus:border-red-500 focus:ring-red-500">
                            <SelectValue placeholder="Selecciona un área" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white border-red-200">
                          {areas.map((area) => (
                            <SelectItem key={area.id} value={area.id.toString()}>
                              {area.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="producto_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-semibold">Producto</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="border-red-200 focus:border-red-500 focus:ring-red-500">
                            <SelectValue placeholder="Selecciona un producto" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white border-red-200">
                          {productos.map((producto) => (
                            <SelectItem key={producto.id} value={producto.id.toString()}>
                              {producto.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="turno_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-semibold">Turno</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="border-red-200 focus:border-red-500 focus:ring-red-500">
                            <SelectValue placeholder="Selecciona un turno" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white border-red-200">
                          {turnos.map((turno) => (
                            <SelectItem key={turno.id} value={turno.id.toString()}>
                              {turno.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cantidad"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-semibold">Cantidad</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="Ingresa la cantidad"
                          className="border-red-200 focus:border-red-500 focus:ring-red-500"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lote"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-semibold">Lote</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="Ingresa el número de lote"
                          className="border-red-200 focus:border-red-500 focus:ring-red-500"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fecha"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-semibold">Fecha</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          readOnly 
                          className="bg-gray-100 border-gray-300 text-gray-600 cursor-not-allowed"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="quien_bloqueo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-semibold">Usuario</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          readOnly 
                          className="bg-gray-100 border-gray-300 text-gray-600 cursor-not-allowed"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="motivo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-semibold">Motivo del Bloqueo</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe el motivo del bloqueo (máximo 150 caracteres)"
                        className="resize-none border-red-200 focus:border-red-500 focus:ring-red-500 min-h-[100px]"
                        maxLength={150}
                        {...field}
                      />
                    </FormControl>
                    <div className="flex justify-between items-center mt-1">
                      <div className="text-sm text-gray-500">
                        {field.value?.length || 0}/150 caracteres
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-4 pt-6 border-t border-gray-200">
                <Button 
                  type="submit" 
                  disabled={loading} 
                  className="flex-1 bg-gradient-to-r from-yellow-500 to-red-600 hover:from-yellow-600 hover:to-red-700 text-white font-semibold py-3 shadow-lg"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Guardando...
                    </div>
                  ) : (
                    'Registrar Bloqueo'
                  )}
                </Button>
                
                <Button 
                  type="button" 
                  onClick={handleGenerateEmail}
                  disabled={emailLoading}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 shadow-lg"
                >
                  {emailLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Generando...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Generar Correo
                    </div>
                  )}
                </Button>
                
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onClose}
                  className="border-red-300 text-red-600 hover:bg-red-50 px-8"
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
