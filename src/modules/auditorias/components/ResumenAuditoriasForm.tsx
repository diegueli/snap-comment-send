import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, FileDown, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { generateResumenPDF } from '@/utils/resumenPdfGenerator';
import { AuditoriaInfo, AuditoriaSet } from '@/types/auditoria';

interface ResumenAuditoriasFormProps {
  onClose: () => void;
}

const ResumenAuditoriasForm = ({ onClose }: ResumenAuditoriasFormProps) => {
  const { user, profile } = useAuth();
  const [auditoriasDisponibles, setAuditoriasDisponibles] = useState<AuditoriaInfo[]>([]);
  const [auditoriaSeleccionada, setAuditoriaSeleccionada] = useState<string>('');
  const [auditoriaInfo, setAuditoriaInfo] = useState<AuditoriaInfo | null>(null);
  const [auditoriaSets, setAuditoriaSets] = useState<AuditoriaSet[]>([]);
  const [gerenciaNombre, setGerenciaNombre] = useState<string>('');
  const [isResetting, setIsResetting] = useState<string | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Verificar si el usuario pertenece a la gerencia de Calidad
  const isCalidadUser = profile?.gerencia_id && gerenciaNombre === 'Calidad';

  // Cargar información de la gerencia del usuario
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user?.id) return;

      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select(`
            gerencia_id,
            gerencias:gerencia_id (
              id,
              nombre
            )
          `)
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        if (profileData?.gerencias) {
          setGerenciaNombre(profileData.gerencias.nombre);
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
      }
    };

    loadUserProfile();
  }, [user?.id]);

  // Cargar auditorías disponibles
  useEffect(() => {
    const loadAuditorias = async () => {
      if (!isCalidadUser) return;

      try {
        const { data, error } = await supabase
          .from('auditorias')
          .select(`
            codigo_auditoria,
            titulo_documento,
            fecha,
            auditor,
            status,
            plantas:planta_id (nombre)
          `)
          .eq('status', 'Activo');

        if (error) throw error;

        const auditoriasFormatted = data.map(item => ({
          codigo_auditoria: item.codigo_auditoria,
          titulo_documento: item.titulo_documento,
          fecha: item.fecha,
          auditor: item.auditor,
          planta_nombre: item.plantas?.nombre || 'Sin planta',
          status: item.status || 'Activo'
        }));

        setAuditoriasDisponibles(auditoriasFormatted);
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
  }, [isCalidadUser]);

  // Cargar sets de la auditoría seleccionada
  const loadAuditoriaSets = useCallback(async (codigoAuditoria: string) => {
    try {
      const { data, error } = await supabase
        .from('auditoria_sets')
        .select('*')
        .eq('auditoria_codigo', codigoAuditoria);

      if (error) throw error;

      const setsFormatted = (data || []).map(set => ({
        id: set.id,
        area: set.area,
        levantamiento: set.levantamiento || '',
        responsable: set.responsable || '',
        foto_urls: set.foto_urls || [],
        evidencia_foto_url: set.evidencia_foto_url,
        fecha_compromiso: set.fecha_compromiso
      }));

      setAuditoriaSets(setsFormatted);
    } catch (error) {
      console.error('Error loading auditoria sets:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los sets de la auditoría.",
        variant: "destructive",
      });
    }
  }, []);

  // Manejar selección de auditoría
  const handleAuditoriaSelection = useCallback(async (codigoAuditoria: string) => {
    setAuditoriaSeleccionada(codigoAuditoria);
    
    const auditoria = auditoriasDisponibles.find(a => a.codigo_auditoria === codigoAuditoria);
    setAuditoriaInfo(auditoria || null);
    
    await loadAuditoriaSets(codigoAuditoria);
  }, [auditoriasDisponibles, loadAuditoriaSets]);

  // Reset observación
  const handleResetObservacion = async (setId: string, evidenciaUrl?: string) => {
    setIsResetting(setId);
    
    try {
      // Si hay evidencia fotográfica, eliminarla del storage
      if (evidenciaUrl) {
        const fileName = evidenciaUrl.split('/').pop();
        if (fileName) {
          const { error: storageError } = await supabase.storage
            .from('bucket_auditorias')
            .remove([`${auditoriaSeleccionada}_Gestion_Auditoria/${fileName}`]);

          if (storageError) {
            console.error('Error deleting photo from storage:', storageError);
          }
        }
      }

      // Actualizar la base de datos
      const { error } = await supabase
        .from('auditoria_sets')
        .update({
          evidencia_foto_url: null,
          fecha_compromiso: null
        })
        .eq('id', setId);

      if (error) throw error;

      // Actualizar estado local
      setAuditoriaSets(prev => prev.map(set => 
        set.id === setId 
          ? { ...set, evidencia_foto_url: undefined, fecha_compromiso: undefined }
          : set
      ));

      toast({
        title: "Observación reseteada",
        description: "La observación ha sido reseteada exitosamente.",
      });

    } catch (error) {
      console.error('Error resetting observación:', error);
      toast({
        title: "Error",
        description: "No se pudo resetear la observación.",
        variant: "destructive",
      });
    } finally {
      setIsResetting(null);
    }
  };

  // Generar PDF
  const handleGeneratePDF = async () => {
    if (!auditoriaInfo) return;

    setIsGeneratingPDF(true);
    try {
      await generateResumenPDF(auditoriaInfo, auditoriaSets);
      toast({
        title: "PDF generado",
        description: "El resumen de auditoría ha sido generado exitosamente.",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "No se pudo generar el PDF.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Verificar acceso
  if (!isCalidadUser) {
    return (
      <div className="bg-gradient-to-br from-yellow-400 via-red-500 to-orange-600 min-h-[80vh] p-4">
        <div className="max-w-4xl mx-auto space-y-6">
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

          <Card className="bg-white/95 backdrop-blur-sm shadow-xl">
            <CardContent className="p-6 text-center">
              <p className="text-gray-600">
                Este módulo está disponible únicamente para usuarios de la Gerencia de Calidad.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-yellow-400 via-red-500 to-orange-600 min-h-[80vh] p-4">
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
              Resumen Auditorías
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
                <Label className="text-sm font-medium text-gray-700">Gerencia</Label>
                <Input 
                  value={gerenciaNombre} 
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
                  {auditoriasDisponibles.map((auditoria) => (
                    <SelectItem key={auditoria.codigo_auditoria} value={auditoria.codigo_auditoria}>
                      {auditoria.codigo_auditoria} - {auditoria.titulo_documento}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Información de la auditoría seleccionada */}
            {auditoriaInfo && (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <Label className="text-sm font-medium text-gray-700">Planta</Label>
                  <Input value={auditoriaInfo.planta_nombre} disabled className="bg-white" />
                </div>
                
                {/* Botón generar PDF */}
                <div className="flex justify-center">
                  <Button
                    onClick={handleGeneratePDF}
                    disabled={isGeneratingPDF}
                    className="bg-gradient-to-r from-yellow-500 to-red-600 hover:from-yellow-600 hover:to-red-700 text-white px-6 py-2"
                  >
                    <FileDown className="w-4 h-4 mr-2" />
                    {isGeneratingPDF ? 'Generando PDF...' : 'Generar PDF Resumen'}
                  </Button>
                </div>
              </div>
            )}
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

                  {/* Fotografías originales del área */}
                  {set.foto_urls && set.foto_urls.length > 0 && (
                    <div className="mb-4">
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">
                        Fotografías del Levantamiento
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

                  {/* Sección de Gestión */}
                  <div className="border-t pt-4">
                    <Label className="text-lg font-medium text-gray-700 mb-3 block">
                      Gestión de Respuesta
                    </Label>

                    {/* Evidencia fotográfica o fecha de compromiso */}
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

                    {!set.evidencia_foto_url && !set.fecha_compromiso && (
                      <div className="mb-4">
                        <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                          <Label className="text-sm font-medium text-orange-700">
                            ⏳ Pendiente de Respuesta
                          </Label>
                        </div>
                      </div>
                    )}

                    {/* Botón Reset Observación */}
                    {(set.evidencia_foto_url || set.fecha_compromiso) && (
                      <div className="border-t pt-4">
                        <Button
                          onClick={() => handleResetObservacion(set.id, set.evidencia_foto_url)}
                          disabled={isResetting === set.id}
                          variant="outline"
                          className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                        >
                          <RotateCcw className="w-4 h-4 mr-2" />
                          {isResetting === set.id ? 'Reseteando...' : 'Reset Observación'}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {auditoriaSets.length === 0 && auditoriaSeleccionada && (
          <Card className="bg-white/95 backdrop-blur-sm shadow-xl">
            <CardContent className="p-6 text-center">
              <p className="text-gray-600">
                No hay sets de auditoría para esta auditoría.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ResumenAuditoriasForm;
