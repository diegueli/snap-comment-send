import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import BloqueosCameraView from './bloqueos/BloqueosCameraView';
import { uploadBloqueosPhotos, sendBloqueoEmail } from '@/utils/bloqueosPhotoUpload';

interface Photo {
  id: string;
  url: string;
  file: File;
}

interface PlantData {
  id: number;
  nombre: string;
  iniciales: string;
}

interface AreaData {
  id: number;
  nombre: string;
}

interface ProductoData {
  id: number;
  nombre: string;
  seccion: string;
}

interface TurnoData {
  id: number;
  nombre: string;
}

const BloqueosForm = () => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [plantas, setPlantas] = useState<PlantData[]>([]);
  const [areas, setAreas] = useState<AreaData[]>([]);
  const [productos, setProductos] = useState<ProductoData[]>([]);
  const [turnos, setTurnos] = useState<TurnoData[]>([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    plantaId: '',
    productoId: '',
    cantidad: '',
    lote: '',
    motivo: '',
    quienBloqueo: '',
    areaPlantaId: '',
    turnoId: ''
  });

  useEffect(() => {
    const fetchPlantas = async () => {
      const { data, error } = await supabase.from('plantas').select('*');
      if (error) {
        console.error('Error fetching plantas:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar las plantas.",
          variant: "destructive",
        });
      }
      if (data) {
        setPlantas(data);
      }
    };

    const fetchAreas = async () => {
      const { data, error } = await supabase.from('areas_planta').select('*');
      if (error) {
        console.error('Error fetching areas:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar las áreas.",
          variant: "destructive",
        });
      }
      if (data) {
        setAreas(data);
      }
    };

    const fetchProductos = async () => {
      const { data, error } = await supabase.from('productos').select('*');
      if (error) {
        console.error('Error fetching productos:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los productos.",
          variant: "destructive",
        });
      }
      if (data) {
        setProductos(data);
      }
    };

    const fetchTurnos = async () => {
      const { data, error } = await supabase.from('turnos').select('*');
      if (error) {
        console.error('Error fetching turnos:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los turnos.",
          variant: "destructive",
        });
      }
      if (data) {
        setTurnos(data);
      }
    };

    fetchPlantas();
    fetchAreas();
    fetchProductos();
    fetchTurnos();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (photos.length === 0) {
      toast({
        title: "Error",
        description: "Debe tomar al menos una foto como evidencia del bloqueo.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Primero obtener los datos necesarios para el código de bloqueo
      const { data: codigoData, error: codigoError } = await supabase
        .rpc('generate_bloqueo_code', { p_planta_id: parseInt(formData.plantaId) });

      if (codigoError) {
        throw codigoError;
      }

      const codigoBloqueo = codigoData;

      // Subir las fotos primero
      const photoUrls = await uploadBloqueosPhotos(photos, codigoBloqueo);

      // Obtener los nombres de planta, producto, área y turno para el correo
      const [plantaData, productoData, areaData, turnoData] = await Promise.all([
        supabase.from('plantas').select('nombre').eq('id', formData.plantaId).single(),
        supabase.from('productos').select('nombre').eq('id', formData.productoId).single(),
        supabase.from('areas_planta').select('nombre').eq('id', formData.areaPlantaId).single(),
        supabase.from('turnos').select('nombre').eq('id', formData.turnoId).single()
      ]);

      // Crear el registro del bloqueo
      const { data: bloqueoData, error: bloqueoError } = await supabase
        .from('bloqueos')
        .insert({
          fecha: formData.fecha,
          planta_id: parseInt(formData.plantaId),
          producto_id: parseInt(formData.productoId),
          cantidad: parseInt(formData.cantidad),
          lote: parseInt(formData.lote),
          motivo: formData.motivo,
          quien_bloqueo: formData.quienBloqueo,
          area_planta_id: parseInt(formData.areaPlantaId),
          turno_id: parseInt(formData.turnoId),
          foto_urls: photoUrls,
          user_id: (await supabase.auth.getUser()).data.user?.id || ''
        })
        .select()
        .single();

      if (bloqueoError) {
        throw bloqueoError;
      }

      // Preparar datos para el correo
      const emailData = {
        codigo_bloqueo: codigoBloqueo,
        fecha: formData.fecha,
        producto: productoData.data?.nombre || '',
        cantidad: formData.cantidad,
        lote: formData.lote,
        motivo: formData.motivo,
        quien_bloqueo: formData.quienBloqueo,
        area: areaData.data?.nombre || '',
        turno: turnoData.data?.nombre || ''
      };

      // Enviar correo de notificación
      try {
        await sendBloqueoEmail(emailData, photoUrls);
        toast({
          title: "Bloqueo registrado exitosamente",
          description: `Código: ${codigoBloqueo}. Se ha enviado notificación por correo.`,
        });
      } catch (emailError) {
        // El bloqueo se registró pero falló el correo
        toast({
          title: "Bloqueo registrado",
          description: `Código: ${codigoBloqueo}. Advertencia: No se pudo enviar el correo de notificación.`,
          variant: "destructive",
        });
      }

      // Limpiar formulario
      setFormData({
        fecha: new Date().toISOString().split('T')[0],
        plantaId: '',
        productoId: '',
        cantidad: '',
        lote: '',
        motivo: '',
        quienBloqueo: '',
        areaPlantaId: '',
        turnoId: ''
      });
      setPhotos([]);

    } catch (error) {
      console.error('Error registrando bloqueo:', error);
      toast({
        title: "Error",
        description: "No se pudo registrar el bloqueo. Inténtelo nuevamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 p-4">
      <Card className="w-full max-w-4xl mx-auto shadow-xl">
        <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50">
          <CardTitle className="text-2xl font-bold text-red-800 text-center">
            Registro de Bloqueo de Producto
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="fecha">Fecha del Bloqueo</Label>
              <Input
                type="date"
                id="fecha"
                name="fecha"
                value={formData.fecha}
                onChange={handleInputChange}
                className="w-full"
                required
              />
            </div>
            <div>
              <Label htmlFor="plantaId">Planta</Label>
              <Select onValueChange={(value) => handleSelectChange('plantaId', value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona una planta" />
                </SelectTrigger>
                <SelectContent>
                  {plantas.map((planta) => (
                    <SelectItem key={planta.id} value={planta.id.toString()}>
                      {planta.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="productoId">Producto</Label>
              <Select onValueChange={(value) => handleSelectChange('productoId', value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona un producto" />
                </SelectTrigger>
                <SelectContent>
                  {productos.map((producto) => (
                    <SelectItem key={producto.id} value={producto.id.toString()}>
                      {producto.nombre} ({producto.seccion})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="cantidad">Cantidad Bloqueada</Label>
              <Input
                type="number"
                id="cantidad"
                name="cantidad"
                value={formData.cantidad}
                onChange={handleInputChange}
                className="w-full"
                required
              />
            </div>
            <div>
              <Label htmlFor="lote">Lote</Label>
              <Input
                type="number"
                id="lote"
                name="lote"
                value={formData.lote}
                onChange={handleInputChange}
                className="w-full"
                required
              />
            </div>
            <div>
              <Label htmlFor="motivo">Motivo del Bloqueo</Label>
              <Textarea
                id="motivo"
                name="motivo"
                value={formData.motivo}
                onChange={handleInputChange}
                className="w-full"
                required
              />
            </div>
            <div>
              <Label htmlFor="quienBloqueo">¿Quién Bloqueó?</Label>
              <Input
                type="text"
                id="quienBloqueo"
                name="quienBloqueo"
                value={formData.quienBloqueo}
                onChange={handleInputChange}
                className="w-full"
                required
              />
            </div>
            <div>
              <Label htmlFor="areaPlantaId">Área de la Planta</Label>
              <Select onValueChange={(value) => handleSelectChange('areaPlantaId', value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona un área" />
                </SelectTrigger>
                <SelectContent>
                  {areas.map((area) => (
                    <SelectItem key={area.id} value={area.id.toString()}>
                      {area.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="turnoId">Turno</Label>
              <Select onValueChange={(value) => handleSelectChange('turnoId', value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona un turno" />
                </SelectTrigger>
                <SelectContent>
                  {turnos.map((turno) => (
                    <SelectItem key={turno.id} value={turno.id.toString()}>
                      {turno.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <BloqueosCameraView
              onPhotosChange={setPhotos}
              currentPhotos={photos}
            />

            <Button 
              type="submit" 
              disabled={loading}
              className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
            >
              {loading ? 'Registrando...' : 'Registrar Bloqueo'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default BloqueosForm;
