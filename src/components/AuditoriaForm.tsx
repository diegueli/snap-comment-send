
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { AuditoriaFormData, UserData, Planta } from '@/types/auditoria';

interface AuditoriaFormProps {
  onSubmit: (data: AuditoriaFormData & { codigoAuditoria: string }) => void;
  userData: UserData | null;
}

const AuditoriaForm = ({ onSubmit, userData }: AuditoriaFormProps) => {
  const [tituloDocumento, setTituloDocumento] = useState('');
  const [plantaId, setPlantaId] = useState<number | null>(null);
  const [plantas, setPlantas] = useState<Planta[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const today = new Date();
  const formattedDate = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
  const auditor = userData?.name || '';

  useEffect(() => {
    const fetchPlantas = async () => {
      try {
        const { data, error } = await supabase
          .from('plantas')
          .select('id, nombre, iniciales')
          .order('nombre');

        if (error) throw error;
        setPlantas(data || []);
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

  const generateCodigoAuditoria = async (plantaId: number): Promise<string> => {
    try {
      // Llamar a la función de Supabase para generar el código
      const { data, error } = await supabase.rpc('generate_auditoria_code', {
        p_planta_id: plantaId
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error generating auditoria code:', error);
      // Fallback: generar código localmente
      const planta = plantas.find(p => p.id === plantaId);
      const iniciales = planta?.iniciales || 'XX';
      const numero = Math.floor(Math.random() * 9000 + 1000);
      return `${iniciales}${numero}`;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tituloDocumento.trim() && plantaId) {
      setSubmitting(true);
      try {
        const codigoAuditoria = await generateCodigoAuditoria(plantaId);
        onSubmit({
          tituloDocumento: tituloDocumento.trim(),
          fecha: formattedDate,
          auditor,
          plantaId,
          codigoAuditoria
        });
      } catch (error) {
        console.error('Error generating codigo:', error);
        toast({
          title: "Error",
          description: "No se pudo generar el código de auditoría.",
          variant: "destructive",
        });
      } finally {
        setSubmitting(false);
      }
    }
  };

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
      <CardHeader className="text-center pb-3">
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-yellow-500 to-red-600 bg-clip-text text-transparent">
          📋 Auditoría
        </CardTitle>
        <p className="text-sm text-gray-600">
          Complete la información inicial para comenzar la auditoría
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="titulo-auditoria" className="block text-sm font-medium text-gray-700 mb-2">
              Título Auditoría
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

          <div>
            <label htmlFor="planta" className="block text-sm font-medium text-gray-700 mb-2">
              Planta
            </label>
            <Select onValueChange={(value) => setPlantaId(Number(value))} required>
              <SelectTrigger className="border-gray-200 focus:border-red-500">
                <SelectValue placeholder="Seleccione una planta" />
              </SelectTrigger>
              <SelectContent>
                {loading ? (
                  <SelectItem value="loading" disabled>Cargando plantas...</SelectItem>
                ) : (
                  plantas.map((planta) => (
                    <SelectItem key={planta.id} value={planta.id.toString()}>
                      {planta.nombre}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

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

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-yellow-500 to-red-600 hover:from-yellow-600 hover:to-red-700 text-white"
            disabled={!tituloDocumento.trim() || !plantaId || loading || submitting}
          >
            {submitting ? 'Generando código...' : 'Continuar'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AuditoriaForm;
