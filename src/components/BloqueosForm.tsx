
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
import { X } from 'lucide-react';

const bloqueosSchema = z.object({
  planta_id: z.string().min(1, 'Selecciona una planta'),
  area_planta_id: z.string().min(1, 'Selecciona un área'),
  producto_id: z.string().min(1, 'Selecciona un producto'),
  cantidad: z.number().min(1, 'La cantidad debe ser mayor a 0'),
  lote: z.number().min(1, 'El lote debe ser mayor a 0'),
  turno_id: z.string().min(1, 'Selecciona un turno'),
  motivo: z.string().min(1, 'El motivo es requerido').max(150, 'El motivo no puede exceder 150 caracteres'),
  fecha: z.string().min(1, 'La fecha es requerida'),
  usuario: z.string().min(1, 'Indica quién realizó el bloqueo'),
});

type BloqueosFormData = z.infer<typeof bloqueosSchema>;

interface BloqueosFormProps {
  onClose: () => void;
}

const BloqueosForm: React.FC<BloqueosFormProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [plantas, setPlantas] = useState<Array<{ id: number; nombre: string }>>([]);
  const [areas, setAreas] = useState<Array<{ id: number; nombre: string }>>([]);
  const [productos, setProductos] = useState<Array<{ id: number; nombre: string }>>([]);
  const [turnos, setTurnos] = useState<Array<{ id: number; nombre: string }>>([]);
  const [loading, setLoading] = useState(false);

  const form = useForm<BloqueosFormData>({
    resolver: zodResolver(bloqueosSchema),
    defaultValues: {
      planta_id: '',
      area_planta_id: '',
      producto_id: '',
      cantidad: 0,
      lote: 0,
      turno_id: '',
      motivo: '',
      fecha: new Date().toISOString().split('T')[0],
      usuario: '',
    },
  });

  useEffect(() => {
    loadDropdownData();
  }, []);

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
      const { error } = await supabase.from('bloqueos').insert({
        planta_id: parseInt(data.planta_id),
        area_planta_id: parseInt(data.area_planta_id),
        producto_id: parseInt(data.producto_id),
        cantidad: data.cantidad,
        lote: data.lote,
        turno_id: parseInt(data.turno_id),
        motivo: data.motivo,
        fecha: data.fecha,
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

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-2xl font-bold text-center flex-1">
          Registrar Bloqueo
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="planta_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Planta</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una planta" />
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

              <FormField
                control={form.control}
                name="area_planta_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Área de Planta</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un área" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
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
                    <FormLabel>Producto</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un producto" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
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
                    <FormLabel>Turno</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un turno" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
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
                    <FormLabel>Cantidad</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Ingresa la cantidad"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
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
                    <FormLabel>Lote</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Ingresa el número de lote"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
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
                    <FormLabel>Fecha</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
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
                    <FormLabel>Quién Bloqueó</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre de quien realizó el bloqueo" {...field} />
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
                  <FormLabel>Motivo del Bloqueo</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe el motivo del bloqueo (máximo 150 caracteres)"
                      className="resize-none"
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

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'Guardando...' : 'Registrar Bloqueo'}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default BloqueosForm;
