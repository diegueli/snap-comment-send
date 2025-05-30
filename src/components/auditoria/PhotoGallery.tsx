
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

  useEffect(() => {
    const fetchGerencias = async () => {
      try {
        console.log('Fetching gerencias...');
        
        // First, let's check if there's any data at all in the table
        const { data: allGerencias, error: allError } = await supabase
          .from('gerencias')
          .select('id, nombre, iniciales, activo');

        console.log('All gerencias in table:', { data: allGerencias, error: allError });

        // Now get only active ones
        const { data, error } = await supabase
          .from('gerencias')
          .select('id, nombre, iniciales, activo')
          .eq('activo', true)
          .order('nombre');

        console.log('Active gerencias query result:', { data, error });

        if (error) {
          console.error('Error fetching gerencias:', error);
          throw error;
        }
        
        console.log('Setting gerencias:', data);
        setGerencias(data || []);
      } catch (error) {
        console.error('Error in fetchGerencias:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar las gerencias.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchGerencias();
  }, []);

  console.log('Current gerencias state:', gerencias);
  console.log('Loading state:', loading);

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
          <Select onValueChange={setCurrentResponsable} value={currentResponsable}>
            <SelectTrigger className="border-gray-200 focus:border-red-500 bg-white">
              <SelectValue placeholder="Seleccione una gerencia responsable" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
              {loading ? (
                <SelectItem value="loading" disabled>Cargando gerencias...</SelectItem>
              ) : gerencias.length === 0 ? (
                <SelectItem value="no-gerencias" disabled>No hay gerencias disponibles</SelectItem>
              ) : (
                gerencias.map((gerencia) => (
                  <SelectItem 
                    key={gerencia.id} 
                    value={gerencia.nombre}
                    className="hover:bg-gray-100 cursor-pointer"
                  >
                    {gerencia.nombre}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
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
