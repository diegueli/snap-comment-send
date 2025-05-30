
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

  console.log('🎯 Estado actual de PhotoGallery:', {
    loading,
    error,
    gerenciasCount: gerencias.length,
    gerencias: gerencias.map(g => ({ id: g.id, nombre: g.nombre, activo: g.activo }))
  });

  return (
    <Card className="card-instagram animate-fade-in">
      <CardHeader>
        <CardTitle className="text-xl font-bold flex items-center gap-3">
          <div className="w-8 h-8 gradient-bg rounded-full flex items-center justify-center">
            <span className="text-white text-sm">📷</span>
          </div>
          {currentArea} 
          <span className="text-sm font-normal bg-gradient-to-r from-amber-100 to-red-100 text-gray-700 px-3 py-1 rounded-full">
            {currentPhotos.length}/3
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Photo Grid */}
        <div className="grid grid-cols-3 gap-3">
          {currentPhotos.map((photo) => (
            <div key={photo.id} className="relative group">
              <div className="aspect-square rounded-xl overflow-hidden shadow-lg">
                <img
                  src={photo.url || URL.createObjectURL(photo.file!)}
                  alt={`Captured photo ${photo.id}`}
                  className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                />
              </div>
              <Button
                onClick={() => onDeletePhoto(photo.id)}
                size="sm"
                variant="destructive"
                className="absolute -top-2 -right-2 w-8 h-8 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>

        {/* Add Photo Button */}
        {currentPhotos.length < 3 && (
          <Button
            onClick={onStartCamera}
            variant="outline"
            className="w-full border-2 border-dashed border-amber-300 text-amber-600 hover:border-amber-500 hover:text-amber-700 hover:bg-amber-50 py-6 rounded-xl font-semibold transition-all duration-200"
          >
            <Plus className="w-5 h-5 mr-2" />
            Agregar Foto ({currentPhotos.length}/3)
          </Button>
        )}
        
        {/* Levantamiento Field */}
        <div>
          <label htmlFor="levantamiento" className="block text-sm font-semibold text-gray-700 mb-3">
            Levantamiento
          </label>
          <Textarea
            id="levantamiento"
            placeholder="Descripción del levantamiento para este conjunto de fotos..."
            value={currentLevantamiento}
            onChange={(e) => setCurrentLevantamiento(e.target.value)}
            className="input-instagram resize-none min-h-[100px]"
            rows={3}
          />
        </div>

        {/* Responsable Field */}
        <div>
          <label htmlFor="responsable" className="block text-sm font-semibold text-gray-700 mb-3">
            Gerencia Responsable
          </label>
          
          {/* Debug info for development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs">
              <div className="font-medium text-blue-800 mb-1">Debug Info:</div>
              <div className="text-blue-600">
                Loading: {loading.toString()} | Error: {error || 'none'} | Count: {gerencias.length}
              </div>
            </div>
          )}
          
          {error && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
              <div className="font-medium">Error:</div>
              <div>{error}</div>
            </div>
          )}
          
          <Select onValueChange={setCurrentResponsable} value={currentResponsable}>
            <SelectTrigger className="input-instagram">
              <SelectValue placeholder="Seleccione una gerencia responsable" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 shadow-xl rounded-xl z-50 max-h-60">
              {loading ? (
                <SelectItem value="loading-state" disabled>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-amber-500 rounded-full animate-spin"></div>
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
                    className="hover:bg-amber-50 cursor-pointer px-4 py-3 rounded-lg"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-medium">{gerencia.nombre}</span>
                      <span className="text-xs text-gray-400 ml-2 bg-gray-100 px-2 py-1 rounded-full">
                        {gerencia.iniciales}
                      </span>
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          
          {!loading && !error && gerencias.length > 0 && (
            <div className="mt-2 text-xs text-gray-500">
              {gerencias.length} gerencia(s) disponible(s)
            </div>
          )}
        </div>
        
        {/* Save Button */}
        <Button
          onClick={onSaveCurrentSet}
          className="button-primary w-full py-4"
        >
          <Plus className="w-5 h-5 mr-2" />
          Guardar Conjunto de Fotos
        </Button>
      </CardContent>
    </Card>
  );
};

export default PhotoGallery;
