
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface DropdownData {
  plantas: Array<{ id: number; nombre: string }>;
  areas: Array<{ id: number; nombre: string }>;
  productos: Array<{ id: number; nombre: string }>;
  turnos: Array<{ id: number; nombre: string }>;
}

export const useBloqueosFormData = () => {
  const [data, setData] = useState<DropdownData>({
    plantas: [],
    areas: [],
    productos: [],
    turnos: [],
  });
  const [isLoading, setIsLoading] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
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

      setData({
        plantas: plantasResult.data || [],
        areas: areasResult.data || [],
        productos: productosResult.data || [],
        turnos: turnosResult.data || [],
      });
    } catch (error) {
      console.error('Error loading dropdown data:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las opciones del formulario",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return { ...data, isLoading, reload: loadData };
};
