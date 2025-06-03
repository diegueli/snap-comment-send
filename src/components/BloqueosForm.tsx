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
import BloqueosCameraView from './bloqueos/BloqueosCameraView';
import { uploadBloqueosPhotos } from '@/utils/bloqueosPhotoUpload';

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

interface Photo {
  id: string;
  url: string;
  file: File;
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
  const [productoSearchValue, setProductoSearchValue] = useState('');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [codigoBloqueo, setCodigoBloqueo] = useState<string>('');
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);

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

  // Generate codigo bloqueo when planta changes
  useEffect(() => {
    const generateCodigoBloqueo = async () => {
      const plantaId = form.watch('planta_id');
      if (plantaId) {
        try {
          const { data, error } = await supabase.rpc('generate_bloqueo_code', {
            p_planta_id: parseInt(plantaId)
          });
          
          if (error) {
            console.error('Error generating bloqueo code:', error);
          } else {
            setCodigoBloqueo(data);
          }
        } catch (error) {
          console.error('Error generating bloqueo code:', error);
        }
      }
    };

    generateCodigoBloqueo();
  }, [form.watch('planta_id')]);

  // Function to highlight matching text
  const highlightMatch = (text: string, search: string) => {
    if (!search.trim()) return text;
    
    const regex = new RegExp(`(${search})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <span key={index} className="bg-yellow-200 font-semibold">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  // Filter products based on search
  const filteredProductos = productos.filter(producto =>
    producto.nombre?.toLowerCase().includes(productoSearchValue.toLowerCase())
  );

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🛑 Form submit triggered');
    
    // Prevent default form submission
    const formData = form.getValues();
    const validationResult = form.trigger();
    
    if (!await validationResult) {
      console.log('❌ Form validation failed');
      return;
    }

    await onSubmit(formData);
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
        producto_id: parseInt(data.producto_id),
        cantidad: data.cantidad,
        lote: data.lote,
        turno_id: parseInt(data.turno_id),
        motivo: data.motivo,
        fecha: dbDate,
        quien_bloqueo: data.usuario,
        user_id: user.id,
        codigo_bloqueo: codigoBloqueo,
        foto_urls: [], // Will be updated after photo upload
      });

      // Upload photos first if any
      let uploadedPhotoUrls: string[] = [];
      if (photos.length > 0) {
        try {
          console.log('📸 Subiendo fotos al bucket...');
          uploadedPhotoUrls = await uploadBloqueosPhotos(photos, codigoBloqueo);
          setPhotoUrls(uploadedPhotoUrls);
          console.log('✅ Fotos subidas:', uploadedPhotoUrls);
        } catch (photoError) {
          console.error('❌ Error al subir fotos:', photoError);
          toast({
            title: "Error",
            description: "Error al subir las fotos. Por favor intenta de nuevo.",
            variant: "destructive",
          });
          return;
        }
      }

      // Create the bloqueo record with photo URLs
      const { data: bloqueosData, error } = await supabase.from('bloqueos').insert({
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
        codigo_bloqueo: codigoBloqueo,
        foto_urls: uploadedPhotoUrls,
      }).select().single();

      if (error) {
        console.error('❌ Error al insertar bloqueo:', error);
        throw error;
      }

      console.log('✅ Bloqueo creado exitosamente:', bloqueosData);

      toast({
        title: "Bloqueo creado",
        description: `El bloqueo ${codigoBloqueo} se ha registrado exitosamente${photos.length > 0 ? ' con evidencia fotográfica' : ''}. Los valores se conservan para envío por correo.`,
      });

      // Clear photos after successful submission
      photos.forEach(photo => URL.revokeObjectURL(photo.url));
      setPhotos([]);

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

    let emailBody = `
Datos del Bloqueo:

Código de Bloqueo: ${codigoBloqueo}
Planta: ${plantaName}
Area de Planta: ${areaName}
Producto: ${productoName}
Cantidad: ${formData.cantidad}
Lote: ${formData.lote}
Turno: ${turnoName}
Motivo: ${formData.motivo}
Fecha: ${formData.fecha}
Usuario: ${formData.usuario}`;

    // Add photo URLs if available
    if (photoUrls.length > 0) {
      emailBody += `

Evidencia Fotográfica:
`;
      photoUrls.forEach((url, index) => {
        emailBody += `Foto ${index + 1}: ${url}
`;
      });
    } else if (photos.length > 0) {
      emailBody += `

Evidencia Fotográfica:
Se han adjuntado ${photos.length} foto(s) como evidencia del bloqueo.
Nota: Las URLs de las fotos estarán disponibles después de registrar el bloqueo.`;
    }

    setSendingEmail(true);
    try {
      // Create mailto link with enhanced subject including codigo_bloqueo
      const subject = encodeURIComponent(`Registro de Bloqueo ${codigoBloqueo} - ${plantaName} - ${productoName} - ${formData.fecha}`);
      const body = encodeURIComponent(emailBody.trim());
      const mailtoLink = `mailto:?subject=${subject}&body=${body}`;
      
      // Open default email client
      window.location.href = mailtoLink;
      
      toast({
        title: "Cliente de correo abierto",
        description: `Se ha abierto tu cliente de correo predeterminado con los datos del bloqueo ${codigoBloqueo}`,
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
    <div className="bg-gradient-to-br from-red-50 via-orange-50 to-red-50 min-h-screen">
      <div className="max-w-5xl mx-auto p-4 space-y-4">
        {/* Header optimizado */}
        <Card className="bg-white/95 backdrop-blur-sm shadow-xl border-red-200/50">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1"></div>
              <div className="flex flex-col items-center space-y-2">
                <img 
                  src="/lovable-uploads/9ad6adb6-f76a-4982-92e9-09618c309f7c.png" 
                  alt="Quinta alimentos logo" 
                  className="h-14 object-contain"
                />
                <div className="text-center">
                  <CardTitle className="text-2xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                    Módulo de Bloqueos
                  </CardTitle>
                  {codigoBloqueo && (
                    <div className="mt-2 inline-block bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-semibold">
                      Código: {codigoBloqueo}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-1 flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-8 w-8 p-0 text-red-600 hover:bg-red-100 rounded-full"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed max-w-3xl mx-auto">
              Registra y gestiona bloqueos de productos para control de calidad, seguridad y trazabilidad completa
            </p>
          </CardHeader>
        </Card>

        {/* Form Card optimizado */}
        <Card className="bg-white/95 backdrop-blur-sm shadow-xl border-red-200/50">
          <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 border-b border-red-100">
            <CardTitle className="text-lg font-bold text-red-800 text-center">
              Información del Bloqueo
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <Form {...form}>
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Grid principal */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  
                  <FormField
                    control={form.control}
                    name="planta_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-red-800 font-medium">Planta</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="border-red-200 focus:border-red-400 focus:ring-2 focus:ring-red-400/20">
                              <SelectValue placeholder="Selecciona una planta" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-white border-red-200">
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
                        <FormLabel className="text-red-800 font-medium">Área de Planta</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="border-red-200 focus:border-red-400 focus:ring-2 focus:ring-red-400/20">
                              <SelectValue placeholder="Selecciona un área" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-white border-red-200">
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
                        <FormLabel className="text-red-800 font-medium">Producto</FormLabel>
                        <Popover open={productoOpen} onOpenChange={setProductoOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={productoOpen}
                                className={cn(
                                  "w-full justify-between border-red-200 focus:border-red-400 focus:ring-2 focus:ring-red-400/20",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value
                                  ? productos.find(
                                      (producto) => producto.id.toString() === field.value
                                    )?.nombre || "Producto no encontrado"
                                  : productoSearchValue || "Buscar producto..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0" align="start">
                            <Command>
                              <CommandInput 
                                placeholder="Buscar producto..." 
                                className="h-9"
                                value={productoSearchValue}
                                onValueChange={setProductoSearchValue}
                              />
                              <CommandList>
                                <CommandEmpty>
                                  {productos.length === 0 
                                    ? "No hay productos disponibles" 
                                    : "No se encontraron productos"}
                                </CommandEmpty>
                                <CommandGroup>
                                  {filteredProductos.map((producto) => (
                                    <CommandItem
                                      key={producto.id}
                                      value={producto.nombre || `Producto ${producto.id}`}
                                      onSelect={() => {
                                        field.onChange(producto.id.toString());
                                        setProductoSearchValue('');
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
                                      <span>
                                        {highlightMatch(
                                          producto.nombre || `Producto ${producto.id}`,
                                          productoSearchValue
                                        )}
                                      </span>
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
                        <FormLabel className="text-red-800 font-medium">Turno</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="border-red-200 focus:border-red-400 focus:ring-2 focus:ring-red-400/20">
                              <SelectValue placeholder="Selecciona un turno" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-white border-red-200">
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
                        <FormLabel className="text-red-800 font-medium">Cantidad</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Ingresa la cantidad"
                            className="border-red-200 focus:border-red-400 focus:ring-2 focus:ring-red-400/20"
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
                        <FormLabel className="text-red-800 font-medium">Lote</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Ingresa el número de lote"
                            className="border-red-200 focus:border-red-400 focus:ring-2 focus:ring-red-400/20"
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
                        <FormLabel className="text-red-800 font-medium">Fecha</FormLabel>
                        <FormControl>
                          <Input 
                            type="text" 
                            className="border-red-200 bg-gray-50 text-center font-medium focus:ring-2 focus:ring-red-400/20"
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
                        <FormLabel className="text-red-800 font-medium">Usuario</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Usuario que registra el bloqueo" 
                            className="border-red-200 bg-gray-50 focus:ring-2 focus:ring-red-400/20"
                            readOnly
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Campo motivo */}
                <FormField
                  control={form.control}
                  name="motivo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-red-800 font-medium">Motivo del Bloqueo</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe detalladamente el motivo del bloqueo (máximo 150 caracteres)"
                          className="resize-none border-red-200 focus:border-red-400 focus:ring-2 focus:ring-red-400/20"
                          maxLength={150}
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Detalla el motivo específico del bloqueo</span>
                        <span className="text-gray-500">{field.value?.length || 0}/150</span>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Sección de cámara */}
                <div className="border-t border-red-100 pt-5">
                  <BloqueosCameraView
                    currentPhotos={photos}
                    onPhotosChange={setPhotos}
                  />
                </div>

                {/* Botones de acción optimizados */}
                <div className="flex flex-col sm:flex-row gap-3 pt-5 border-t border-red-100">
                  <Button 
                    type="submit" 
                    disabled={loading} 
                    className="flex-1 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    {loading ? 'Registrando...' : 'Registrar Bloqueo'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={sendEmail}
                    disabled={sendingEmail}
                    className="flex-1 sm:flex-none border-red-200 text-red-600 hover:bg-red-50 font-medium py-3 px-6 rounded-lg"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    {sendingEmail ? 'Enviando...' : 'Enviar por Correo'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={onClose}
                    className="flex-1 sm:flex-none border-gray-200 text-gray-600 hover:bg-gray-50 font-medium py-3 px-6 rounded-lg"
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
