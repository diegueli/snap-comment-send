
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface AuditoriaFormData {
  tituloDocumento: string;
  fecha: string;
  auditor: string;
  plantaId: number;
  plantaNombre: string;
}

interface AuditoriaFormProps {
  onSubmit: (data: AuditoriaFormData) => void;
  userData: {
    name: string;
    email: string;
    position: string;
  } | null;
}

interface Planta {
  id: number;
  nombre: string;
}

const AuditoriaForm = ({ onSubmit, userData }: AuditoriaFormProps) => {
  const [tituloDocumento, setTituloDocumento] = useState('');
  const [selectedPlantaId, setSelectedPlantaId] = useState<number | null>(null);
  const [plantas, setPlantas] = useState<Planta[]>([]);
  const [loading, setLoading] = useState(true);
  
  const today = new Date();
  const formattedDate = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
  const auditor = userData?.name || '';

  useEffect(() => {
    const fetchPlantas = async () => {
      try {
        const { data, error } = await supabase
          .from('plantas')
          .select('*')
          .order('nombre');

        if (error) {
          console.error('Error fetching plantas:', error);
          toast({
            title: "Error",
            description: "No se pudieron cargar las plantas.",
            variant: "destructive",
          });
        } else {
          setPlantas(data || []);
        }
      } catch (error) {
        console.error('Error fetching plantas:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar las plantas.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPlantas();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tituloDocumento.trim() && selectedPlantaId) {
      const selectedPlanta = plantas.find(p => p.id === selectedPlantaId);
      onSubmit({
        tituloDocumento: tituloDocumento.trim(),
        fecha: formattedDate,
        auditor,
        plantaId: selectedPlantaId,
        plantaNombre: selectedPlanta?.nombre || ''
      });
    }
  };

  if (loading) {
    return (
      <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando plantas...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
      <CardHeader className="text-center pb-3">
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-yellow-500 to-red-600 bg-clip-text text-transparent">
          📋 Auditoría Fotográfica
        </CardTitle>
        <p className="text-sm text-gray-600">
          Capture evidencias fotográficas de manera sistemática y organizada
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Título del Documento */}
          <div>
            <label htmlFor="titulo-auditoria" className="block text-sm font-medium text-gray-700 mb-2">
              Título del Documento <span className="text-gray-400">(opcional)</span>
            </label>
            <Input
              id="titulo-auditoria"
              placeholder="Ingrese el título de la auditoría"
              value={tituloDocumento}
              onChange={(e) => setTituloDocumento(e.target.value)}
              className="border-gray-200 focus:border-red-500"
              required
            />
          </div>

          {/* Planta Auditada */}
          <div>
            <label htmlFor="planta" className="block text-sm font-medium text-gray-700 mb-2">
              Planta Auditada
            </label>
            <Select value={selectedPlantaId?.toString()} onValueChange={(value) => setSelectedPlantaId(Number(value))} required>
              <SelectTrigger className="border-gray-200 focus:border-red-500">
                <SelectValue placeholder="Seleccione la planta" />
              </SelectTrigger>
              <SelectContent>
                {plantas.map((planta) => (
                  <SelectItem key={planta.id} value={planta.id.toString()}>
                    {planta.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Información de la Auditoría */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="fecha" className="block text-sm font-medium text-gray-700 mb-2">
                Fecha
              </label>
              <div className="bg-gray-100 border border-gray-200 rounded-md px-3 py-2 text-sm">
                {formattedDate}
              </div>
            </div>

            <div>
              <label htmlFor="auditor" className="block text-sm font-medium text-gray-700 mb-2">
                Auditor
              </label>
              <div className="bg-gray-100 border border-gray-200 rounded-md px-3 py-2 text-sm">
                {auditor}
              </div>
            </div>
          </div>

          {/* Sección: ¿Listo para capturar fotos? */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">
              ¿Listo para capturar fotos?
            </h3>
            <p className="text-sm text-blue-700 mb-4">
              Una vez que inicie la cámara, podrá tomar múltiples fotografías organizadas por sets. 
              Cada set incluirá información sobre el área, responsable, levantamiento y evidencia encontrada.
            </p>
            <ul className="text-xs text-blue-600 space-y-1 mb-4">
              <li>• Tome fotos claras y bien iluminadas</li>
              <li>• Complete la información de cada set</li>
              <li>• Puede agregar múltiples sets a la auditoría</li>
              <li>• Los datos se guardan automáticamente</li>
            </ul>
          </div>

          {/* Botón Iniciar Cámara */}
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-3 text-lg"
            disabled={!tituloDocumento.trim() || !selectedPlantaId}
          >
            📷 Iniciar Cámara
          </Button>

          {/* Botones adicionales */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <Button
              type="button"
              variant="outline"
              className="border-orange-200 text-orange-600 hover:bg-orange-50"
              disabled
            >
              📄 Descargar PDF
            </Button>
            <Button
              type="button"
              variant="outline"
              className="border-gray-200 text-gray-600 hover:bg-gray-50"
              onClick={() => {
                setTituloDocumento('');
                setSelectedPlantaId(null);
              }}
            >
              🔄 Reiniciar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default AuditoriaForm;
