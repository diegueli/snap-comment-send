
import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Gerencia {
  id: number;
  nombre: string;
  activo: boolean;
}

interface GerenciaSelectProps {
  value: string;
  onValueChange: (value: string, gerenciaId?: number) => void;
}

const GerenciaSelect = ({ value, onValueChange }: GerenciaSelectProps) => {
  const [gerencias, setGerencias] = useState<Gerencia[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGerencias = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('gerencias')
          .select('*')
          .eq('activo', true)
          .order('nombre');

        if (error) throw error;

        setGerencias(data || []);
      } catch (error: any) {
        console.error('Error fetching gerencias:', error);
        toast({
          title: "Error al cargar gerencias",
          description: error.message || "No se pudieron cargar las gerencias.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchGerencias();
  }, []);

  const handleValueChange = (selectedNombre: string) => {
    const selectedGerencia = gerencias.find(g => g.nombre === selectedNombre);
    onValueChange(selectedNombre, selectedGerencia?.id);
  };

  return (
    <div>
      <label htmlFor="gerencia" className="block text-sm font-medium text-gray-700 mb-2">
        Gerencia *
      </label>
      
      <Select onValueChange={handleValueChange} value={value}>
        <SelectTrigger className="border-gray-200 focus:border-red-500 bg-white">
          <SelectValue placeholder="Seleccione una gerencia" />
        </SelectTrigger>
        <SelectContent className="bg-white border border-gray-200 shadow-lg z-50 max-h-60">
          {loading ? (
            <SelectItem value="loading-state" disabled>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                Cargando gerencias...
              </div>
            </SelectItem>
          ) : gerencias.length === 0 ? (
            <SelectItem value="no-data-state" disabled>
              <div className="text-gray-500">No hay gerencias disponibles</div>
            </SelectItem>
          ) : (
            gerencias.map((gerencia) => (
              <SelectItem 
                key={gerencia.id} 
                value={gerencia.nombre}
                className="hover:bg-gray-100 cursor-pointer px-3 py-2"
              >
                {gerencia.nombre}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
};

export default GerenciaSelect;
