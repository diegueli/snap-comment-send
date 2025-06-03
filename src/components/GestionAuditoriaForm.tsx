import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowLeft, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import GestionCameraView from './gestion/GestionCameraView';

interface AuditoriaSet {
  id: string;
  area: string;
  levantamiento: string;
  responsable: string;
  foto_urls: string[];
  evidencia_foto_url?: string;
  fecha_compromiso?: string;
}

interface GestionAuditoriaFormProps {
  onClose: () => void;
}

const GestionAuditoriaForm = ({ onClose }: GestionAuditoriaFormProps) => {
  const { user, profile } = useAuth();
  const [auditoriasDisponibles, setAuditoriasDisponibles] = useState<string[]>([]);
  const [auditoriaSeleccionada, setAuditoriaSeleccionada] = useState<string>('');
  const [auditoriaSets, setAuditoriaSets] = useState<AuditoriaSet[]>([]);
  const [respuestasSet, setRespuestasSet] = useState<{ [key: string]: { tipo: 'evidencia' | 'fecha'; fechaCompromiso?: string } }>({});
  const [showCamera, setShowCamera] = useState(false);
  const [currentSetId, setCurrentSetId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);

  // Cargar auditorías disponibles
  useEffect(() => {
    const loadAuditorias = async () => {
      if (!user?.id) return;

      try {
        // Obtener auditorías donde el usuario esté involucrado como responsable en algún set
        const { data: setsData, error: setsError } = await supabase
          .from('auditoria_sets')
          .select('auditoria_codigo')
          .eq('gerencia_resp_id', profile?.gerencia_id);

        if (setsError) throw setsError;

        const codigosUnicos = [...new Set(setsData?.map(set => set.auditoria_codigo) || [])];
        setAuditoriasDisponibles(codigosUnicos);
      } catch (error) {
        console.error('Error loading auditorías:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar las auditorías disponibles.",
          variant: "destructive",
        });
      }
    };

    loadAuditorias();
  }, [user?.id, profile?.gerencia_id]);

  // Cargar sets de la auditoría seleccionada
  const loadAuditoriaSets = useCallback(async (codigoAuditoria: string) => {
    try {
      const { data, error } = await supabase
        .from('auditoria_sets')
        .select('*')
        .eq('auditoria_codigo', codigoAuditoria)
        .eq('gerencia_resp_id', profile?.gerencia_id);

      if (error) throw error;

      // Ordenar alfabéticamente por área
      const setsOrdenados = (data || [])
        .map(set => ({
          id: set.id,
          area: set.area,
          levantamiento: set.levantamiento || '',
          responsable: set.responsable || '',
          foto_urls: set.foto_urls || [],
          evidencia_foto_url: set.evidencia_foto_url,
          fecha_compromiso: set.fecha_compromiso
        }))
        .sort((a, b) => a.area.localeCompare(b.area));

      setAuditoriaSets(setsOrdenados);
    } catch (error) {
      console.error('Error loading auditoria sets:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los sets de la auditoría.",
        variant: "destructive",
      });
    }
  }, [profile?.gerencia_id]);

  // Manejar selección de auditoría
  const handleAuditoriaSelection = useCallback(async (codigoAuditoria: string) => {
    setAuditoriaSeleccionada(codigoAuditoria);
    await loadAuditoriaSets(codigoAuditoria);
  }, [loadAuditoriaSets]);

  // Manejar respuesta del set
  const handleRespuestaChange = (setId: string, tipo: 'evidencia' | 'fecha', fechaCompromiso?: string) => {
    setRespuestasSet(prev => ({
      ...prev,
      [setId]: { tipo, fechaCompromiso }
    }));
  };

  // Manejar foto capturada
  const handlePhotoCapture = async (file: File) => {
    if (!currentSetId || !auditoriaSeleccionada) return;

    try {
      const fileName = `${Date.now()}_evidencia.jpg`;
      const filePath = `${auditoriaSeleccionada}_Gestion_Auditoria/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('bucket_auditorias')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('bucket_auditorias')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('auditoria_sets')
        .update({ evidencia_foto_url: publicUrl })
        .eq('id', currentSetId);

      if (updateError) throw updateError;

      // Actualizar estado local
      setAuditoriaSets(prev => prev.map(set => 
        set.id === currentSetId 
          ? { ...set, evidencia_foto_url: publicUrl }
          : set
      ));

      setShowCamera(false);
      setCurrentSetId(null);
      
      toast({
        title: "Evidencia guardada",
        description: "La evidencia fotográfica ha sido guardada exitosamente.",
      });

    } catch (error) {
      console.error('Error saving evidence photo:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la evidencia fotográfica.",
        variant: "destructive",
      });
    }
  };

  // Contestar levantamiento
  const handleContestarLevantamiento = async (setId: string) => {
    const respuesta = respuestasSet[setId];
    if (!respuesta) return;

    setIsSubmitting(setId);

    try {
      if (respuesta.tipo === 'evidencia') {
        setCurrentSetId(setId);
        setShowCamera(true);
      } else if (respuesta.tipo === 'fecha' && respuesta.fechaCompromiso) {
        const { error } = await supabase
          .from('auditoria_sets')
          .update({ fecha_compromiso: respuesta.fechaCompromiso })
          .eq('id', setId);

        if (error) throw error;

        // Actualizar estado local
        setAuditoriaSets(prev => prev.map(set => 
          set.id === setId 
            ? { ...set, fecha_compromiso: respuesta.fechaCompromiso }
            : set
        ));

        toast({
          title: "Fecha de compromiso guardada",
          description: "La fecha de compromiso ha sido guardada exitosamente.",
        });
      }
    } catch (error) {
      console.error('Error contestando levantamiento:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la respuesta del levantamiento.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(null);
    }
  };

  // Verificar si se puede contestar un set
  const canAnswerSet = (set: AuditoriaSet) => {
    return !set.evidencia_foto_url && !set.fecha_compromiso;
  };

  if (showCamera && currentSetId) {
    return (
      <GestionCameraView
        onPhotoTaken={handlePhotoCapture}
        onCancel={() => {
          setShowCamera(false);
          setCurrentSetId(null);
        }}
      />
    );
  }

  return (
    <div className="bg-gradient-to-br from-yellow-400 via-red-500 to-orange-600 min-h-screen p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-end mb-4">
          <Button
            onClick={onClose}
            variant="outline"
            size="sm"
            className="bg-white/80 backdrop-blur-sm border-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </div>

        {/* Header */}
        <Card className="bg-white/95 backdrop-blur-sm shadow-xl">
          <CardHeader>
            <CardTitle className="text-center text-2xl text-gray-800">
              Gestión de Auditoría
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Información del usuario */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">Usuario</Label>
                <Input 
                  value={profile?.name || ''} 
                  disabled 
                  className="bg-gray-50"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Cargo</Label>
                <Input 
                  value={profile?.position || ''} 
                  disabled 
                  className="bg-gray-50"
                />
              </div>
            </div>

            {/* Selección de auditoría */}
            <div>
              <Label className="text-sm font-medium text-gray-700">Código de Auditoría</Label>
              <Select value={auditoriaSeleccionada} onValueChange={handleAuditoriaSelection}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione una auditoría" />
                </SelectTrigger>
                <SelectContent>
                  {auditoriasDisponibles.map((codigo) => (
                    <SelectItem key={codigo} value={codigo}>
                      {codigo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Sets de la auditoría */}
        {auditoriaSets.length > 0 && (
          <div className="space-y-4">
            {auditoriaSets.map((set, index) => (
              <Card key={set.id} className="bg-white/95 backdrop-blur-sm shadow-xl">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-800">
                    Set {index + 1}: {set.area}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Levantamiento</Label>
                      <Input value={set.levantamiento || 'Sin levantamiento'} disabled className="bg-gray-50" />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Responsable</Label>
                      <Input value={set.responsable || 'Sin responsable'} disabled className="bg-gray-50" />
                    </div>
                  </div>

                  {/* Fotografías del área */}
                  {set.foto_urls && set.foto_urls.length > 0 && (
                    <div className="mb-4">
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">
                        Fotografías del Área
                      </Label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {set.foto_urls.map((url, photoIndex) => (
                          <img
                            key={photoIndex}
                            src={url}
                            alt={`Foto ${photoIndex + 1} del área ${set.area}`}
                            className="w-full h-24 object-cover rounded border border-gray-200"
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Estado actual de respuesta */}
                  {set.evidencia_foto_url && (
                    <div className="mb-4">
                      <Label className="text-sm font-medium text-green-700 mb-2 block">
                        ✅ Evidencia Fotográfica Proporcionada
                      </Label>
                      <img
                        src={set.evidencia_foto_url}
                        alt={`Evidencia ${set.area}`}
                        className="w-32 h-24 object-cover rounded border border-green-300"
                      />
                    </div>
                  )}

                  {set.fecha_compromiso && (
                    <div className="mb-4">
                      <Label className="text-sm font-medium text-blue-700 mb-2 block">
                        📅 Fecha de Compromiso
                      </Label>
                      <Input 
                        value={format(new Date(set.fecha_compromiso), 'dd/MM/yyyy', { locale: es })} 
                        disabled 
                        className="bg-blue-50 border-blue-200 max-w-xs" 
                      />
                    </div>
                  )}

                  {/* Sección de respuesta (solo si puede contestar) */}
                  {canAnswerSet(set) && (
                    <div className="border-t pt-4">
                      <Label className="text-lg font-medium text-gray-700 mb-3 block">
                        Responder Set
                      </Label>

                      <RadioGroup
                        value={respuestasSet[set.id]?.tipo || ''}
                        onValueChange={(value: 'evidencia' | 'fecha') => 
                          handleRespuestaChange(set.id, value)
                        }
                        className="mb-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="evidencia" id={`evidencia-${set.id}`} />
                          <Label htmlFor={`evidencia-${set.id}`}>Opción 1: Evidencia Fotográfica</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="fecha" id={`fecha-${set.id}`} />
                          <Label htmlFor={`fecha-${set.id}`}>Opción 2: Fecha de Compromiso</Label>
                        </div>
                      </RadioGroup>

                      {respuestasSet[set.id]?.tipo === 'fecha' && (
                        <div className="mb-4">
                          <Label className="text-sm font-medium text-gray-700">Fecha de Compromiso</Label>
                          <Input
                            type="date"
                            value={respuestasSet[set.id]?.fechaCompromiso || ''}
                            onChange={(e) => handleRespuestaChange(set.id, 'fecha', e.target.value)}
                            className="max-w-xs"
                          />
                        </div>
                      )}

                      {respuestasSet[set.id] && (
                        respuestasSet[set.id].tipo === 'evidencia' || 
                        (respuestasSet[set.id].tipo === 'fecha' && respuestasSet[set.id].fechaCompromiso)
                      ) && (
                        <Button
                          onClick={() => handleContestarLevantamiento(set.id)}
                          disabled={isSubmitting === set.id}
                          className="bg-gradient-to-r from-yellow-500 to-red-600 hover:from-yellow-600 hover:to-red-700 text-white"
                        >
                          {isSubmitting === set.id ? 'Guardando...' : 'Contestar Levantamiento'}
                        </Button>
                      )}
                    </div>
                  )}

                  {!canAnswerSet(set) && (
                    <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                      <Label className="text-sm font-medium text-green-700">
                        ✅ Set ya respondido
                      </Label>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {auditoriaSets.length === 0 && auditoriaSeleccionada && (
          <Card className="bg-white/95 backdrop-blur-sm shadow-xl">
            <CardContent className="p-6 text-center">
              <p className="text-gray-600">
                No hay sets de auditoría asignados a su gerencia para esta auditoría.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default GestionAuditoriaForm;
