
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface DropdownData {
  plantas: Array<{ id: number; nombre: string }>;
  areas: Array<{ id: number; nombre: string }>;
  turnos: Array<{ id: number; nombre: string }>;
  gerencias: Array<{ id: number; nombre: string }>;
}

export const useDropdownData = () => {
  const [data, setData] = useState<DropdownData>({
    plantas: [],
    areas: [],
    turnos: [],
    gerencias: []
  });
  const [loading, setLoading] = useState(false);

  const loadDropdownData = async () => {
    setLoading(true);
    try {
      const [plantasResult, areasResult, turnosResult, gerenciasResult] = await Promise.all([
        supabase.from('plantas').select('*').order('nombre'),
        supabase.from('areas_planta').select('*').order('nombre'),
        supabase.from('turnos').select('*').order('nombre'),
        supabase.from('gerencias').select('*').order('nombre')
      ]);

      if (plantasResult.error) throw plantasResult.error;
      if (areasResult.error) throw areasResult.error;
      if (turnosResult.error) throw turnosResult.error;
      if (gerenciasResult.error) throw gerenciasResult.error;

      setData({
        plantas: plantasResult.data || [],
        areas: areasResult.data || [],
        turnos: turnosResult.data || [],
        gerencias: gerenciasResult.data || []
      });
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

  useEffect(() => {
    loadDropdownData();
  }, []);

  return { data, loading, refetch: loadDropdownData };
};
