
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Camera, X, Send } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import GestionCameraView from './gestion/GestionCameraView';

interface AuditoriaInfo {
  codigo_auditoria: string;
  titulo_documento: string;
  fecha: string;
  auditor: string;
  planta_nombre: string;
  status: string;
}

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
  const [auditoriasDisponibles, setAuditoriasDisponibles] = useState<AuditoriaInfo[]>([]);
  const [auditoriaSeleccionada, setAuditoriaSeleccionada] = useState<string>('');
  const [auditoriaInfo, setAuditoriaInfo] = useState<AuditoriaInfo | null>(null);
  const [auditoriaSets, setAuditoriaSets] = useState<AuditoriaSet[]>([]);
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [fechaCompromiso, setFechaCompromiso] = useState<Date | undefined>(undefined);
  const [showCalendar, setShowCalendar] = useState(false);
  const [gerenciaNombre, setGerenciaNombre] = useState<string>('');
  const [gerenciaId, setGerenciaId] = useState<number | null>(null);
  const [currentArea, setCurrentArea] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);

  // Cargar información de la gerencia del usuario desde la tabla profiles
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
          setGerenciaId(profileData.gerencia_id);
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
  }, []);

  // Cargar sets de la auditoría seleccionada
  const loadAuditoriaSets = useCallback(async (codigoAuditoria: string) => {
    if (!gerenciaNombre) return;

    try {
      const { data, error } = await supabase
        .from('auditoria_sets')
        .select('*')
        .eq('auditoria_codigo', codigoAuditoria)
        .eq('responsable', gerenciaNombre);

      if (error) throw error;

      // Convertir los datos para el formato esperado
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
  }, [gerenciaNombre]);

  // Manejar selección de auditoría
  const handleAuditoriaSelection = useCallback(async (codigoAuditoria: string) => {
    setAuditoriaSeleccionada(codigoAuditoria);
    
    const auditoria = auditoriasDisponibles.find(a => a.codigo_auditoria === codigoAuditoria);
    setAuditoriaInfo(auditoria || null);
    
    await loadAuditoriaSets(codigoAuditoria);
  }, [auditoriasDisponibles, loadAuditoriaSets]);

  // Manejar captura de evidencia fotográfica
  const handleCaptureEvidence = (setId: string, area: string) => {
    setSelectedSetId(setId);
    setCurrentArea(area);
    setShowCamera(true);
  };

  // Manejar foto capturada
  const handlePhotoTaken = async (photoFile: File) => {
    if (!selectedSetId || !auditoriaSeleccionada || !currentArea) return;

    try {
      // Subir foto a storage en subcarpeta de gestión
      const cleanAreaName = currentArea.replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `${auditoriaSeleccionada}_Gestion_Auditoria/${cleanAreaName}_${Date.now()}.jpg`;
      
      const { data, error } = await supabase.storage
        .from('bucket_auditorias')
        .upload(fileName, photoFile, {
          contentType: 'image/jpeg',
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('bucket_auditorias')
        .getPublicUrl(fileName);

      // Actualizar estado local con la nueva evidencia fotográfica
      setAuditoriaSets(prev => prev.map(set => 
        set.id === selectedSetId 
          ? { ...set, evidencia_foto_url: publicUrl }
          : set
      ));

      setShowCamera(false);
      setSelectedSetId(null);
      setCurrentArea('');

      toast({
        title: "Evidencia guardada",
        description: "La evidencia fotográfica ha sido guardada exitosamente.",
      });
    } catch (error) {
      console.error('Error saving evidence:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la evidencia fotográfica.",
        variant: "destructive",
      });
    }
  };

  // Manejar fecha de compromiso
  const handleFechaCompromiso = async (setId: string) => {
    if (!fechaCompromiso) {
      toast({
        title: "Fecha requerida",
        description: "Por favor seleccione una fecha de compromiso.",
        variant: "destructive",
      });
      return;
    }

    try {
      const fechaFormatted = format(fechaCompromiso, 'yyyy-MM-dd');
      
      // Actualizar estado local
      setAuditoriaSets(prev => prev.map(set => 
        set.id === setId 
          ? { ...set, fecha_compromiso: fechaFormatted }
          : set
      ));

      setFechaCompromiso(undefined);
      setShowCalendar(false);

      toast({
        title: "Fecha de compromiso guardada",
        description: "La fecha de compromiso ha sido guardada exitosamente.",
      });
    } catch (error) {
      console.error('Error saving fecha compromiso:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la fecha de compromiso.",
        variant: "destructive",
      });
    }
  };

  // Contestar levantamiento - enviar respuesta a base de datos
  const handleContestarLevantamiento = async (setId: string) => {
    setIsSubmitting(setId);
    
    try {
      const currentSet = auditoriaSets.find(set => set.id === setId);
      if (!currentSet) return;

      // Verificar que tenga al menos una respuesta (fecha de compromiso o evidencia fotográfica)
      const tieneEvidencia = currentSet.evidencia_foto_url;
      const tieneFechaCompromiso = currentSet.fecha_compromiso;

      if (!tieneEvidencia && !tieneFechaCompromiso) {
        toast({
          title: "Respuesta requerida",
          description: "Debe proporcionar evidencia fotográfica o fecha de compromiso.",
          variant: "destructive",
        });
        return;
      }

      // Preparar datos para actualizar
      const updateData: any = {};
      
      if (tieneEvidencia) {
        updateData.evidencia_foto_url = currentSet.evidencia_foto_url;
      }
      
      if (tieneFechaCompromiso) {
        updateData.fecha_compromiso = currentSet.fecha_compromiso;
      }

      // Actualizar en la base de datos
      const { error } = await supabase
        .from('auditoria_sets')
        .update(updateData)
        .eq('id', setId);

      if (error) throw error;

      toast({
        title: "Levantamiento contestado",
        description: "La respuesta ha sido enviada exitosamente.",
      });

      // Recargar los sets para obtener la información actualizada
      if (auditoriaSeleccionada) {
        await loadAuditoriaSets(auditoriaSeleccionada);
      }

    } catch (error) {
      console.error('Error contestando levantamiento:', error);
      toast({
        title: "Error",
        description: "No se pudo enviar la respuesta.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(null);
    }
  };

  // Verificar si el set tiene respuesta completa
  const hasResponse = (set: AuditoriaSet) => {
    return set.evidencia_foto_url || set.fecha_compromiso;
  };

  if (showCamera && selectedSetId) {
    return (
      <div className="bg-gradient-to-br from-yellow-400 via-red-500 to-orange-600 min-h-[80vh] p-4">
        <div className="max-w-md mx-auto">
          <div className="flex justify-end mb-4">
            <Button
              onClick={() => {
                setShowCamera(false);
                setSelectedSetId(null);
                setCurrentArea('');
              }}
              variant="outline"
              size="sm"
              className="bg-white/80 backdrop-blur-sm border-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <GestionCameraView
            onPhotoTaken={handlePhotoTaken}
            onCancel={() => {
              setShowCamera(false);
              setSelectedSetId(null);
              setCurrentArea('');
            }}
          />
        </div>
      </div>
    );
  }

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
            <X className="w-4 h-4" />
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Planta</Label>
                  <Input value={auditoriaInfo.planta_nombre} disabled className="bg-white" />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Status</Label>
                  <Input value={auditoriaInfo.status} disabled className="bg-white" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sets de la auditoría */}
        {auditoriaSets.length > 0 && (
          <div className="space-y-4">
            {auditoriaSets.map((set) => (
              <Card key={set.id} className="bg-white/95 backdrop-blur-sm shadow-xl">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Área</Label>
                      <Input value={set.area} disabled className="bg-gray-50" />
                    </div>
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
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">Fotografías del Área</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {set.foto_urls.map((url, index) => (
                          <img
                            key={index}
                            src={url}
                            alt={`Foto ${index + 1} del área ${set.area}`}
                            className="w-full h-24 object-cover rounded border"
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Evidencia fotográfica de gestión */}
                  {set.evidencia_foto_url && (
                    <div className="mb-4">
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">Evidencia Fotográfica de Gestión</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        <img
                          src={set.evidencia_foto_url}
                          alt={`Evidencia de gestión ${set.area}`}
                          className="w-full h-24 object-cover rounded border"
                        />
                      </div>
                    </div>
                  )}

                  {/* Mostrar fecha de compromiso si existe */}
                  {set.fecha_compromiso && (
                    <div className="mb-4">
                      <Label className="text-sm font-medium text-gray-700">Fecha de Compromiso</Label>
                      <Input 
                        value={format(new Date(set.fecha_compromiso), 'dd/MM/yyyy', { locale: es })} 
                        disabled 
                        className="bg-gray-50" 
                      />
                    </div>
                  )}

                  {/* Acciones para evidencia o fecha de compromiso */}
                  <div className="border-t pt-4 space-y-4">
                    {!hasResponse(set) && (
                      <>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleCaptureEvidence(set.id, set.area)}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <Camera className="w-4 h-4 mr-2" />
                            Tomar Evidencia Fotográfica
                          </Button>
                        </div>
                        
                        <div className="border-t pt-4">
                          <Label className="text-sm font-medium text-gray-700 mb-2 block">
                            O seleccione Fecha de Compromiso
                          </Label>
                          <div className="flex gap-2">
                            <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "justify-start text-left font-normal",
                                    !fechaCompromiso && "text-muted-foreground"
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {fechaCompromiso ? format(fechaCompromiso, "dd/MM/yyyy", { locale: es }) : "Seleccionar fecha"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={fechaCompromiso}
                                  onSelect={setFechaCompromiso}
                                  disabled={(date) => date < new Date()}
                                  initialFocus
                                  locale={es}
                                />
                              </PopoverContent>
                            </Popover>
                            {fechaCompromiso && (
                              <Button
                                onClick={() => handleFechaCompromiso(set.id)}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                Guardar Fecha
                              </Button>
                            )}
                          </div>
                        </div>
                      </>
                    )}

                    {/* Botón Contestar Levantamiento */}
                    {hasResponse(set) && (
                      <div className="border-t pt-4">
                        <Button
                          onClick={() => handleContestarLevantamiento(set.id)}
                          disabled={isSubmitting === set.id}
                          className="bg-orange-600 hover:bg-orange-700 text-white w-full"
                        >
                          <Send className="w-4 h-4 mr-2" />
                          {isSubmitting === set.id ? 'Enviando...' : 'Contestar Levantamiento'}
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
