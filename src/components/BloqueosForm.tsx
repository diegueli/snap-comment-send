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
  const [plantas, setPlantas] = useState<Array<{ id: number; nombre: string }>>([]);
  const [areas, setAreas] = useState<Array<{ id: number; nombre: string }>>([]);
  const [productos, setProductos] = useState<Array<{ id: number; nombre: string }>>([]);
  const [turnos, setTurnos] = useState<Array<{ id: number; nombre: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [productoOpen, setProductoOpen] = useState(false);

  // Format current date as dd/mm/yyyy
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
    loadDropdownData();
  }, []);

  useEffect(() => {
    if (profile?.name) {
      form.setValue('usuario', profile.name);
    }
  }, [profile, form]);

  const loadDropdownData = async () => {
    try {
      console.log('🔍 Cargando datos de dropdowns...');
      
      const [plantasResult, areasResult, productosResult, turnosResult] = await Promise.all([
        supabase.from('plantas').select('*').order('nombre'),
        supabase.from('areas_planta').select('*').order('nombre'),
        supabase.from('productos').select('*').order('nombre'),
        supabase.from('turnos').select('*').order('nombre'),
      ]);

      console.log('📊 Resultados de consultas:');
      console.log('Plantas:', plantasResult);
      console.log('Areas:', areasResult);
      console.log('Productos:', productosResult);
      console.log('Turnos:', turnosResult);

      if (plantasResult.error) {
        console.error('❌ Error en plantas:', plantasResult.error);
        throw plantasResult.error;
      }
      if (areasResult.error) {
        console.error('❌ Error en areas:', areasResult.error);
        throw areasResult.error;
      }
      if (productosResult.error) {
        console.error('❌ Error en productos:', productosResult.error);
        throw productosResult.error;
      }
      if (turnosResult.error) {
        console.error('❌ Error en turnos:', turnosResult.error);
        throw turnosResult.error;
      }

      console.log('✅ Datos cargados exitosamente:');
      console.log('Plantas encontradas:', plantasResult.data?.length || 0);
      console.log('Areas encontradas:', areasResult.data?.length || 0);
      console.log('Productos encontrados:', productosResult.data?.length || 0);
      console.log('Turnos encontrados:', turnosResult.data?.length || 0);

      setPlantas(plantasResult.data || []);
      setAreas(areasResult.data || []);
      setProductos(productosResult.data || []);
      setTurnos(turnosResult.data || []);

      // Log adicional para productos para debug
      if (productosResult.data && productosResult.data.length > 0) {
        console.log('🔍 Estructura del primer producto:', productosResult.data[0]);
      }
    } catch (error) {
      console.error('💥 Error loading dropdown data:', error);
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
      // Convert dd/mm/yyyy to yyyy-mm-dd for database
      const dateParts = data.fecha.split('/');
      const dbDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;

      console.log('💾 Enviando datos de bloqueo:', {
        planta_id: parseInt(data.planta_id),
        area_planta_id: parseInt(data.area_planta_id),
        producto_id: parseInt(data.producto_id), // Cambio aquí: mantenemos parseInt para compatibilidad
        cantidad: data.cantidad,
        lote: data.lote,
        turno_id: parseInt(data.turno_id),
        motivo: data.motivo,
        fecha: dbDate,
        quien_bloqueo: data.usuario,
        user_id: user.id,
      });

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

      if (error) {
        console.error('❌ Error al insertar bloqueo:', error);
        throw error;
      }

      console.log('✅ Bloqueo creado exitosamente');
      toast({
        title: "Bloqueo creado",
        description: "El bloqueo se ha registrado exitosamente. Los valores se conservan para envío por correo.",
      });

      // Note: Form values are preserved after successful submission for potential email sending
    } catch (error: any) {
      console.error('💥 Error creating bloqueo:', error);
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
    
    // Get names for display
    const plantaName = plantas.find(p => p.id.toString() === formData.planta_id)?.nombre || 'No seleccionada';
    const areaName = areas.find(a => a.id.toString() === formData.area_planta_id)?.nombre || 'No seleccionada';
    const productoName = productos.find(p => p.id.toString() === formData.producto_id)?.nombre || 'No seleccionado';
    const turnoName = turnos.find(t => t.id.toString() === formData.turno_id)?.nombre || 'No seleccionado';

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
      // Create mailto link with enhanced subject
      const subject = encodeURIComponent(`Registro de Bloqueo - ${plantaName} - ${productoName} - ${formData.fecha}`);
      const body = encodeURIComponent(emailBody.trim());
      const mailtoLink = `mailto:?subject=${subject}&body=${body}`;
      
      // Open default email client
      window.location.href = mailtoLink;
      
      toast({
        title: "Cliente de correo abierto",
        description: "Se ha abierto tu cliente de correo predeterminado con los datos del bloqueo",
      });

      // Note: Form values are preserved after sending email for potential re-sending
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
      {/* Header with Logo and Title */}
      <Card className="mb-6 bg-gradient-to-r from-red-50 to-orange-50 border-red-200">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center items-center mb-4">
            <img 
              src="/lovable-uploads/9ad6adb6-f76a-4982-92e9-09618c309f7c.png" 
              alt="Quinta alimentos logo" 
              className="h-12 object-contain"
            />
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent mb-2">
            Módulo de Bloqueos
          </CardTitle>
          <p className="text-gray-700 text-sm leading-relaxed max-w-2xl mx-auto">
            Este módulo permite registrar y gestionar bloqueos de productos en el sistema. 
            Documenta productos que requieren retención por motivos de calidad, seguridad o 
            control de procesos, asegurando la trazabilidad completa desde la identificación 
            hasta la resolución del bloqueo.
          </p>
        </CardHeader>
      </Card>

      {/* Form Card */}
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
                <FormField
                  control={form.control}
                  name="planta_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-red-800">Planta</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="border-red-200 focus:border-red-400">
                            <SelectValue placeholder="Selecciona una planta" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {plantas.length > 0 ? (
                            plantas.map((planta) => (
                              <SelectItem key={planta.id} value={planta.id.toString()}>
                                {planta.nombre}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-plantas" disabled>
                              No hay plantas disponibles
                            </SelectItem>
                          )}
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
                      <FormLabel className="text-red-800">Área de Planta</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="border-red-200 focus:border-red-400">
                            <SelectValue placeholder="Selecciona un área" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {areas.length > 0 ? (
                            areas.map((area) => (
                              <SelectItem key={area.id} value={area.id.toString()}>
                                {area.nombre}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-areas" disabled>
                              No hay áreas disponibles
                            </SelectItem>
                          )}
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
                      <FormLabel className="text-red-800">Producto</FormLabel>
                      <Popover open={productoOpen} onOpenChange={setProductoOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={productoOpen}
                              className={cn(
                                "w-full justify-between border-red-200 focus:border-red-400 hover:bg-red-50",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value
                                ? productos.find(
                                    (producto) => producto.id.toString() === field.value
                                  )?.nombre || "Producto no encontrado"
                                : "Buscar producto..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                          <Command>
                            <CommandInput 
                              placeholder="Buscar producto..." 
                              className="h-9"
                            />
                            <CommandList>
                              <CommandEmpty>
                                {productos.length === 0 
                                  ? "No hay productos disponibles" 
                                  : "No se encontraron productos"}
                              </CommandEmpty>
                              <CommandGroup>
                                {productos.map((producto) => (
                                  <CommandItem
                                    key={producto.id}
                                    value={producto.nombre || `Producto ${producto.id}`}
                                    onSelect={() => {
                                      field.onChange(producto.id.toString());
                                      setProductoOpen(false);
                                    }}
                                    className="cursor-pointer"
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        field.value === producto.id.toString()
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                    {producto.nombre || `Producto ${producto.id}`}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="turno_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-red-800">Turno</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="border-red-200 focus:border-red-400">
                            <SelectValue placeholder="Selecciona un turno" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {turnos.length > 0 ? (
                            turnos.map((turno) => (
                              <SelectItem key={turno.id} value={turno.id.toString()}>
                                {turno.nombre}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-turnos" disabled>
                              No hay turnos disponibles
                            </SelectItem>
                          )}
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
                      <FormLabel className="text-red-800">Cantidad</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Ingresa la cantidad"
                          className="border-red-200 focus:border-red-400"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
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
                      <FormLabel className="text-red-800">Lote</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Ingresa el número de lote"
                          className="border-red-200 focus:border-red-400"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
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
                      <FormLabel className="text-red-800">Fecha</FormLabel>
                      <FormControl>
                        <Input 
                          type="text" 
                          className="border-red-200 bg-gray-50 text-center font-medium"
                          readOnly
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="usuario"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-red-800">Usuario</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Usuario que registra el bloqueo" 
                          className="border-red-200 bg-gray-50"
                          readOnly
                          {...field} 
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
                    <FormLabel className="text-red-800">Motivo del Bloqueo</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe el motivo del bloqueo (máximo 150 caracteres)"
                        className="resize-none border-red-200 focus:border-red-400"
                        maxLength={150}
                        {...field}
                      />
                    </FormControl>
                    <div className="text-sm text-gray-500 text-right">
                      {field.value?.length || 0}/150
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex flex-col sm:flex-row gap-3 pt-6">
                <Button 
                  type="submit" 
                  disabled={loading} 
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
