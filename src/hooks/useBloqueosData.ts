
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface DropdownOption {
  id: number;
  nombre: string;
}

export const useBloqueosData = () => {
  const [plantas, setPlantas] = useState<DropdownOption[]>([]);
  const [areas, setAreas] = useState<DropdownOption[]>([]);
  const [productos, setProductos] = useState<DropdownOption[]>([]);
  const [turnos, setTurnos] = useState<DropdownOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDropdownData();
  }, []);

  const loadDropdownData = async () => {
    try {
      setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  return {
    plantas,
    areas,
    productos,
    turnos,
    loading
  };
};
