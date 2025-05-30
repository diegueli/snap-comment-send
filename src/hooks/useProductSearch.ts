
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Producto {
  id: number;
  nombre: string | null;
}

export const useProductSearch = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(false);

  const loadProductos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('id, nombre')
        .not('nombre', 'is', null)
        .order('nombre');

      if (error) throw error;
      setProductos(data || []);
    } catch (error) {
      console.error('Error loading productos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProductos();
  }, []);

  return { productos, loading, refetch: loadProductos };
};
