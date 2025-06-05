import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { X, Mail, Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import BloqueosCameraView from './BloqueosCameraView';
import { uploadBloqueosPhotos } from '../utils/photoUpload';
import { BloqueosPhoto, BloqueosFormData, BloqueosData } from '../types';

const bloqueosSchema = z.object({
  fecha: z.string().min(1, 'La fecha es requerida'),
  lote: z.string().min(1, 'El lote es requerido'),
  codigoProducto: z.string().min(1, 'El código de producto es requerido'),
  nombreProducto: z.string().min(1, 'El nombre de producto es requerido'),
  tipoBloqueo: z.string().min(1, 'El tipo de bloqueo es requerido'),
  motivoBloqueo: z.string().min(1, 'El motivo de bloqueo es requerido'),
  plantaId: z.string().min(1, 'La planta es requerida'),
  cantidad: z.string().min(1, 'La cantidad es requerida'),
  ubicacion: z.string().min(1, 'La ubicación es requerida'),
  observaciones: z.string().optional(),
  notificarGerencias: z.array(z.string()).default([]),
});

type BloqueosFormValues = z.infer<typeof bloqueosSchema>;

interface BloqueosFormProps {
  onClose: () => void;
}

interface Planta {
  id: number;
  nombre: string;
  iniciales?: string;
}

interface Gerencia {
  id: number;
  nombre: string;
  iniciales: string;
  activo?: boolean;
}

const tiposBloqueo = [
  'Calidad',
  'Seguridad Alimentaria',
  'Proceso',
  'Materia Prima',
  'Producto Terminado',
  'Otros'
];

const BloqueosForm: React.FC<BloqueosFormProps> = ({ onClose }) => {
  const { user, profile } = useAuth();
  const [plantas, setPlantas] = useState<Planta[]>([]);
  const [gerencias, setGerencias] = useState<Gerencia[]>([]);
  const [selectedGerencias, setSelectedGerencias] = useState<string[]>([]);
  const [openGerenciasPopover, setOpenGerenciasPopover] = useState(false);
  const [codigoBloqueo, setCodigoBloqueo] = useState<string>('');
  const [photos, setPhotos] = useState<BloqueosPhoto[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<BloqueosFormValues>({
    resolver: zodResolver(bloqueosSchema),
    defaultValues: {
      fecha: new Date().toISOString().split('T')[0],
      lote: '',
      codigoProducto: '',
      nombreProducto: '',
      tipoBloqueo: '',
      motivoBloqueo: '',
      plantaId: '',
      cantidad: '',
      ubicacion: '',
      observaciones: '',
      notificarGerencias: [],
    },
  });

  useEffect(() => {
    const loadPlantas = async () => {
      try {
        const { data, error } = await supabase
          .from('plantas')
          .select('*')
          .eq('activo', true)
          .order('nombre');

        if (error) throw error;
        setPlantas(data || []);
      } catch (error) {
        console.error('Error loading plantas:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar las plantas.",
          variant: "destructive",
        });
      }
    };

    loadPlantas();
  }, []);

  useEffect(() => {
    const loadGerencias = async () => {
      try {
        const { data, error } = await supabase
          .from('gerencias')
          .select('*')
          .eq('activo', true)
          .order('nombre');

        if (error) throw error;
        setGerencias(data || []);
      } catch (error) {
        console.error('Error loading gerencias:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar las gerencias.",
          variant: "destructive",
        });
      }
    };

    loadGerencias();
  }, []);

  const generateCodigoBloqueo = (plantaId: string) => {
    const planta = plantas.find(p => p.id.toString() === plantaId);
    const iniciales = planta?.iniciales || 'XX';
    const fecha = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const timestamp = Date.now().toString().slice(-4);
    return `BLQ-${iniciales}-${fecha}-${timestamp}`;
  };

  const handlePlantaChange = (plantaId: string) => {
    form.setValue('plantaId', plantaId);
    if (plantaId) {
      const codigo = generateCodigoBloqueo(plantaId);
      setCodigoBloqueo(codigo);
    } else {
      setCodigoBloqueo('');
    }
  };

  const toggleGerencia = (gerenciaId: string) => {
    const newSelection = selectedGerencias.includes(gerenciaId)
      ? selectedGerencias.filter(id => id !== gerenciaId)
      : [...selectedGerencias, gerenciaId];
    
    setSelectedGerencias(newSelection);
    form.setValue('notificarGerencias', newSelection);
  };

  const handlePhotosChange = (newPhotos: BloqueosPhoto[]) => {
    setPhotos(newPhotos);
  };

  const handleSubmit = async (data: BloqueosFormValues) => {
    if (photos.length === 0) {
      toast({
        title: "Error",
        description: "Se requiere al menos una evidencia fotográfica.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      console.log('Iniciando guardado de bloqueo...');
      
      const photoUrls = await uploadBloqueosPhotos(photos, codigoBloqueo);
      console.log('Fotos subidas:', photoUrls);

      const bloqueosData: BloqueosData = {
        codigo_bloqueo: codigoBloqueo,
        fecha: data.fecha,
        lote: data.lote,
        codigo_producto: data.codigoProducto,
        nombre_producto: data.nombreProducto,
        tipo_bloqueo: data.tipoBloqueo,
        motivo_bloqueo: data.motivoBloqueo,
        planta_id: parseInt(data.plantaId),
        cantidad: data.cantidad,
        ubicacion: data.ubicacion,
        observaciones: data.observaciones || '',
        usuario_registro_id: user?.id || '',
        foto_urls: photoUrls,
        notificar_gerencias: data.notificarGerencias,
        status: 'Activo'
      };

      console.log('Datos a guardar:', bloqueosData);

      const { error: insertError } = await supabase
        .from('bloqueos')
        .insert([bloqueosData]);

      if (insertError) {
        console.error('Error insertando bloqueo:', insertError);
        throw insertError;
      }

      if (data.notificarGerencias.length > 0) {
        try {
          const { error: emailError } = await supabase.functions.invoke('send-bloqueo-notification', {
            body: {
              bloqueosData,
              gerenciasIds: data.notificarGerencias,
              userProfile: profile
            }
          });

          if (emailError) {
            console.error('Error enviando notificaciones:', emailError);
          } else {
            console.log('Notificaciones enviadas exitosamente');
          }
        } catch (emailError) {
          console.error('Error en función de email:', emailError);
        }
      }

      toast({
        title: "¡Bloqueo registrado exitosamente!",
        description: `Código: ${codigoBloqueo}`,
      });

      form.reset();
      setPhotos([]);
      setCodigoBloqueo('');
      setSelectedGerencias([]);

    } catch (error) {
      console.error('Error al guardar bloqueo:', error);
      toast({
        title: "Error",
        description: "No se pudo registrar el bloqueo. Inténtelo nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-red-50 to-orange-50 pb-8">
      <div className="max-w-4xl mx-auto p-4">
        <Card className="bg-white shadow-xl border-red-200 mb-6 overflow-hidden">
          <div className="bg-gradient-to-r from-red-600 to-orange-600 p-1">
            <CardHeader className="bg-white m-1 rounded-sm text-center space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex-1"></div>
                <div className="flex justify-center items-center">
                  <img 
                    src="/lovable-uploads/9ad6adb6-f76a-4982-92e9-09618c309f7c.png" 
                    alt="Quinta alimentos logo" 
                    className="h-12 object-contain"
                  />
                </div>
                <div className="flex-1 flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="h-8 w-8 p-0 text-red-600 hover:bg-red-100"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div>
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                  Módulo de Bloqueos
                </CardTitle>
                {codigoBloqueo && (
                  <div className="mt-3 p-3 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border border-red-200">
                    <p className="text-lg font-bold text-red-700">
                      Código: {codigoBloqueo}
                    </p>
                  </div>
                )}
              </div>
              <div className="bg-gray-50 rounded-xl p-4 border-l-4 border-red-500">
                <p className="text-gray-700 text-sm leading-relaxed">
                  <strong>Sistema de Gestión de Bloqueos:</strong> Documenta productos que requieren 
                  retención por motivos de calidad, seguridad o control de procesos, asegurando 
                  la trazabilidad completa desde la identificación hasta la resolución del bloqueo.
                </p>
              </div>
            </CardHeader>
          </div>
        </Card>

        <Card className="bg-white shadow-xl border-red-200 mb-6 overflow-hidden">
          <div className="bg-gradient-to-r from-red-600 to-orange-600 p-1">
            <CardHeader className="bg-white m-1 rounded-sm">
              <CardTitle className="text-xl font-bold text-red-800 text-center">
                Registrar Bloqueo de Producto
              </CardTitle>
            </CardHeader>
          </div>
          <CardContent className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="fecha"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-red-800">Fecha *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} className="border-red-200 focus:border-red-500" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="plantaId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-red-800">Planta *</FormLabel>
                        <Select onValueChange={handlePlantaChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="border-red-200 focus:border-red-500">
                              <SelectValue placeholder="Seleccione una planta" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="lote"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-red-800">Lote *</FormLabel>
                        <FormControl>
                          <Input {...field} className="border-red-200 focus:border-red-500" placeholder="Ingrese el lote" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="codigoProducto"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-red-800">Código de Producto *</FormLabel>
                        <FormControl>
                          <Input {...field} className="border-red-200 focus:border-red-500" placeholder="Código del producto" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="nombreProducto"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-red-800">Nombre del Producto *</FormLabel>
                      <FormControl>
                        <Input {...field} className="border-red-200 focus:border-red-500" placeholder="Nombre completo del producto" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="tipoBloqueo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-red-800">Tipo de Bloqueo *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="border-red-200 focus:border-red-500">
                              <SelectValue placeholder="Seleccione el tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {tiposBloqueo.map((tipo) => (
                              <SelectItem key={tipo} value={tipo}>
                                {tipo}
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
                        <FormLabel className="text-red-800">Cantidad *</FormLabel>
                        <FormControl>
                          <Input {...field} className="border-red-200 focus:border-red-500" placeholder="Cantidad bloqueada" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="motivoBloqueo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-red-800">Motivo del Bloqueo *</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          className="border-red-200 focus:border-red-500" 
                          placeholder="Describa detalladamente el motivo del bloqueo"
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ubicacion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-red-800">Ubicación *</FormLabel>
                      <FormControl>
                        <Input {...field} className="border-red-200 focus:border-red-500" placeholder="Ubicación física del producto" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="observaciones"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-red-800">Observaciones Adicionales</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          className="border-red-200 focus:border-red-500" 
                          placeholder="Observaciones adicionales (opcional)"
                          rows={2}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notificarGerencias"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-red-800">Notificar a Gerencias</FormLabel>
                      <Popover open={openGerenciasPopover} onOpenChange={setOpenGerenciasPopover}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={openGerenciasPopover}
                              className="w-full justify-between border-red-200 focus:border-red-500"
                            >
                              {selectedGerencias.length === 0
                                ? "Seleccionar gerencias..."
                                : `${selectedGerencias.length} gerencia(s) seleccionada(s)`}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput placeholder="Buscar gerencias..." />
                            <CommandEmpty>No se encontraron gerencias.</CommandEmpty>
                            <CommandGroup>
                              <CommandList>
                                {gerencias.map((gerencia) => (
                                  <CommandItem
                                    key={gerencia.id}
                                    onSelect={() => toggleGerencia(gerencia.id.toString())}
                                    className="cursor-pointer"
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        selectedGerencias.includes(gerencia.id.toString())
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                    <Mail className="mr-2 h-4 w-4 text-red-600" />
                                    {gerencia.nombre}
                                  </CommandItem>
                                ))}
                              </CommandList>
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="mt-8">
                  <BloqueosCameraView 
                    onPhotosChange={handlePhotosChange}
                    currentPhotos={photos}
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-6">
                  <Button
                    type="submit"
                    disabled={isSaving || photos.length === 0}
                    className="flex-1 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-semibold py-3"
                  >
                    {isSaving ? 'Guardando...' : 'Registrar Bloqueo'}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="flex-1 border-red-300 text-red-600 hover:bg-red-50 font-semibold py-3"
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BloqueosForm;
