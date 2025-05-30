
import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Gerencia } from '@/types/auditoria';

interface ResponsableSelectProps {
  value: string;
  onValueChange: (value: string, gerenciaId?: number) => void;
}

const ResponsableSelect = ({ value, onValueChange }: ResponsableSelectProps) => {
  const [gerencias, setGerencias] = useState<Gerencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGerencias = async () => {
      try {
        console.log('🔍 Iniciando fetch de gerencias...');
        setLoading(true);
        setError(null);

        const { data, error, count } = await supabase
          .from('gerencias')
          .select('*', { count: 'exact' });

        console.log('📊 Respuesta completa de Supabase:', { 
          data, 
          error, 
          count,
          dataLength: data?.length 
        });

        if (error) {
          console.error('❌ Error en la consulta:', error);
          throw new Error(`Error en consulta: ${error.message}`);
        }

        if (!data) {
          console.warn('⚠️ Data es null o undefined');
          setGerencias([]);
          setError('No se recibieron datos');
          return;
        }

        console.log('✅ Datos recibidos:', data);
        
        const gerenciasActivas = data.filter(g => g.activo === true);
        console.log('✅ Gerencias activas filtradas:', gerenciasActivas);
        
        setGerencias(gerenciasActivas);

        if (gerenciasActivas.length === 0) {
          setError('No hay gerencias activas en los datos');
        }

      } catch (error: any) {
        console.error('💥 Error completo:', error);
        setError(error.message || 'Error desconocido');
        setGerencias([]);
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

  console.log('🎯 Estado actual de ResponsableSelect:', {
    loading,
    error,
    gerenciasCount: gerencias.length,
    gerencias: gerencias.map(g => ({ id: g.id, nombre: g.nombre, activo: g.activo }))
  });

  return (
    <div>
      <label htmlFor="responsable" className="block text-sm font-medium text-gray-700 mb-2">
        Responsable
      </label>
      
      {error && (
        <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
          Error: {error}
        </div>
      )}
      
      <Select onValueChange={handleValueChange} value={value}>
        <SelectTrigger className="border-gray-200 focus:border-red-500 bg-white">
          <SelectValue placeholder="Seleccione una gerencia responsable" />
        </SelectTrigger>
        <SelectContent className="bg-white border border-gray-200 shadow-lg z-50 max-h-60">
          {loading ? (
            <SelectItem value="loading-state" disabled>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                Cargando gerencias...
              </div>
            </SelectItem>
          ) : error ? (
            <SelectItem value="error-state" disabled>
              <div className="text-red-600">Error: {error}</div>
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

export default ResponsableSelect;
