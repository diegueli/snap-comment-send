import React, { useState, useEffect } from 'react';
import { Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { CapturedPhoto, Gerencia } from '@/types/auditoria';

interface PhotoGalleryProps {
  currentPhotos: CapturedPhoto[];
  currentArea: string;
  currentLevantamiento: string;
  currentResponsable: string;
  setCurrentLevantamiento: (value: string) => void;
  setCurrentResponsable: (value: string) => void;
  onDeletePhoto: (photoId: string) => void;
  onStartCamera: () => void;
  onSaveCurrentSet: () => void;
}

const PhotoGallery = ({
  currentPhotos,
  currentArea,
  currentLevantamiento,
  currentResponsable,
  setCurrentLevantamiento,
  setCurrentResponsable,
  onDeletePhoto,
  onStartCamera,
  onSaveCurrentSet
}: PhotoGalleryProps) => {
  const [gerencias, setGerencias] = useState<Gerencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGerencias = async () => {
      try {
        console.log('🔍 Iniciando fetch de gerencias...');
        setLoading(true);
        setError(null);

        // Test de conexión a Supabase
        const { data: testConnection, error: connectionError } = await supabase
          .from('gerencias')
          .select('count', { count: 'exact', head: true });

        if (connectionError) {
          console.error('❌ Error de conexión a Supabase:', connectionError);
          throw new Error(`Error de conexión: ${connectionError.message}`);
        }

        console.log('✅ Conexión a Supabase exitosa. Total registros:', testConnection);

        // Consulta principal
        const { data, error } = await supabase
          .from('gerencias')
          .select('id, nombre, iniciales, activo')
          .eq('activo', true)
          .order('nombre');

        console.log('📊 Resultado de la consulta:', { data, error });

        if (error) {
          console.error('❌ Error en la consulta de gerencias:', error);
          throw new Error(`Error en consulta: ${error.message}`);
        }

        if (!data) {
          console.warn('⚠️ La consulta no devolvió datos');
          setGerencias([]);
          setError('No se recibieron datos de la consulta');
          return;
        }

        console.log('✅ Gerencias cargadas exitosamente:', data.length, 'registros');
        setGerencias(data);

        if (data.length === 0) {
          setError('No hay gerencias activas disponibles');
        }

      } catch (error: any) {
        console.error('💥 Error completo en fetchGerencias:', error);
        setError(error.message || 'Error desconocido al cargar gerencias');
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

  // Log del estado actual para debugging
  console.log('🎯 Estado actual de PhotoGallery:', {
    loading,
    error,
    gerenciasCount: gerencias.length,
    gerencias: gerencias.map(g => ({ id: g.id, nombre: g.nombre }))
  });

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          📷 {currentArea} ({currentPhotos.length}/3)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {currentPhotos.map((photo) => (
            <div key={photo.id} className="relative group">
              <img
                src={photo.url || URL.createObjectURL(photo.file!)}
                alt={`Captured photo ${photo.id}`}
                className="w-full aspect-square object-cover rounded-lg shadow-md"
              />
              <Button
                onClick={() => onDeletePhoto(photo.id)}
                size="sm"
                variant="destructive"
                className="absolute top-1 right-1 w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>

        {currentPhotos.length < 3 && (
          <div className="mb-4">
            <Button
              onClick={onStartCamera}
              variant="outline"
              className="w-full border-2 border-dashed border-red-300 text-red-600 hover:border-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar Foto ({currentPhotos.length}/3)
            </Button>
          </div>
        )}
        
        <div className="mb-4">
          <label htmlFor="levantamiento" className="block text-sm font-medium text-gray-700 mb-2">
            Levantamiento
          </label>
          <Textarea
            id="levantamiento"
            placeholder="Agregar levantamiento para este conjunto de fotos..."
            value={currentLevantamiento}
            onChange={(e) => setCurrentLevantamiento(e.target.value)}
            className="resize-none border-gray-200 focus:border-red-500"
            rows={2}
          />
        </div>

        <div className="mb-4">
          <label htmlFor="responsable" className="block text-sm font-medium text-gray-700 mb-2">
            Responsable
          </label>
          {error && (
            <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
              Error: {error}
            </div>
          )}
          <Select onValueChange={setCurrentResponsable} value={currentResponsable}>
            <SelectTrigger className="border-gray-200 focus:border-red-500 bg-white">
              <SelectValue placeholder="Seleccione una gerencia responsable" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 shadow-lg z-50 max-h-60">
              {loading ? (
                <SelectItem value="loading" disabled>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                    Cargando gerencias...
                  </div>
                </SelectItem>
              ) : error ? (
                <SelectItem value="error-state" disabled>
                  <div className="text-red-600">Error al cargar gerencias</div>
                </SelectItem>
              ) : gerencias.length === 0 ? (
                <SelectItem value="no-gerencias" disabled>
                  <div className="text-gray-500">No hay gerencias disponibles</div>
                </SelectItem>
              ) : (
                gerencias.map((gerencia) => (
                  <SelectItem 
                    key={gerencia.id} 
                    value={gerencia.nombre}
                    className="hover:bg-gray-100 cursor-pointer px-3 py-2"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>{gerencia.nombre}</span>
                      <span className="text-xs text-gray-400 ml-2">({gerencia.iniciales})</span>
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {!loading && !error && gerencias.length > 0 && (
            <div className="mt-1 text-xs text-gray-500">
              {gerencias.length} gerencia(s) disponible(s)
            </div>
          )}
        </div>
        
        <Button
          onClick={onSaveCurrentSet}
          className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Guardar Conjunto de Fotos
        </Button>
      </CardContent>
    </Card>
  );
};

export default PhotoGallery;
