import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileText, Calendar, User, Building, Download, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { generateResumenPDF } from '@/utils/resumenPdfGenerator';
import { toast } from 'sonner';

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

interface ResumenAuditoriasFormProps {
  onClose: () => void;
}

const ResumenAuditoriasForm: React.FC<ResumenAuditoriasFormProps> = ({ onClose }) => {
  const { user, profile } = useAuth();
  const [auditoriasDisponibles, setAuditoriasDisponibles] = useState<AuditoriaInfo[]>([]);
  const [auditoriaSeleccionada, setAuditoriaSeleccionada] = useState<string>('');
  const [sets, setSets] = useState<AuditoriaSet[]>([]);
  const [auditoriaInfo, setAuditoriaInfo] = useState<AuditoriaInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [gerenciaNombre, setGerenciaNombre] = useState<string>('');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(isGeneratingPDF);
  const [canViewAllAuditorias, setCanViewAllAuditorias] = useState(false);

  // Verificar permisos del usuario
  useEffect(() => {
    const checkUserPermissions = async () => {
      if (!user?.id || !profile) return;

      try {
        // Verificar si el usuario tiene permisos para ver todas las auditorías
        const { data: canViewAll, error } = await supabase
          .rpc('can_user_view_all_auditorias');

        if (error) {
          console.error('Error checking permissions:', error);
          return;
        }

        console.log('User can view all auditorias:', canViewAll);
        setCanViewAllAuditorias(canViewAll || false);

        // También obtener el nombre de la gerencia para mostrar información
        if (profile.gerencia_id) {
          const { data: gerenciaData, error: gerenciaError } = await supabase
            .from('gerencias')
            .select('nombre')
            .eq('id', profile.gerencia_id)
            .single();

          if (!gerenciaError && gerenciaData) {
            setGerenciaNombre(gerenciaData.nombre);
          }
        }
      } catch (error) {
        console.error('Error in checkUserPermissions:', error);
      }
    };

    checkUserPermissions();
  }, [user?.id, profile]);

  // Cargar auditorías disponibles
  useEffect(() => {
    const loadAuditorias = async () => {
      if (!canViewAllAuditorias) return;

      try {
        console.log('Cargando auditorías disponibles...');
        
        const { data, error } = await supabase
          .from('auditorias')
          .select(`
            codigo_auditoria,
            titulo_documento,
            fecha,
            auditor,
            status,
            plantas (
              nombre
            )
          `)
          .order('fecha', { ascending: false });

        if (error) {
          console.error('Error al cargar auditorías:', error);
          throw error;
        }

        console.log('Auditorías obtenidas de la base de datos:', data?.length || 0);

        const auditoriasFormatted = data?.map(item => ({
          codigo_auditoria: item.codigo_auditoria,
          titulo_documento: item.titulo_documento,
          fecha: item.fecha,
          auditor: item.auditor,
          planta_nombre: item.plantas?.nombre || 'Sin planta',
          status: item.status || 'Activo'
        })) || [];

        console.log('Auditorías formateadas:', auditoriasFormatted);
        setAuditoriasDisponibles(auditoriasFormatted);
      } catch (error) {
        console.error('Error loading auditorías:', error);
        toast.error('Error al cargar las auditorías disponibles');
      }
    };

    loadAuditorias();
  }, [canViewAllAuditorias]);

  const loadAuditoriaSets = useCallback(async (codigoAuditoria: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('auditoria_sets')
        .select('*')
        .eq('auditoria_codigo', codigoAuditoria);

      if (error) {
        console.error('Error al cargar los sets de auditoría:', error);
        toast.error('Error al cargar los sets de auditoría');
        return;
      }

      setSets(data || []);
    } catch (error) {
      console.error('Error inesperado al cargar los sets de auditoría:', error);
      toast.error('Error inesperado al cargar los sets de auditoría');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleAuditoriaChange = useCallback(async (codigoAuditoria: string) => {
    setAuditoriaSeleccionada(codigoAuditoria);

    const selectedAuditoria = auditoriasDisponibles.find(a => a.codigo_auditoria === codigoAuditoria);
    if (selectedAuditoria) {
      setAuditoriaInfo(selectedAuditoria);
    } else {
      setAuditoriaInfo(null);
    }

    await loadAuditoriaSets(codigoAuditoria);
  }, [auditoriasDisponibles, loadAuditoriaSets]);

  const handleGenerarPDF = async () => {
    if (!auditoriaInfo || sets.length === 0) {
      toast.error('No hay datos suficientes para generar el PDF.');
      return;
    }

    setIsGeneratingPDF(true);
    try {
      await generateResumenPDF(auditoriaInfo, sets);
      toast.success('PDF generado con éxito!');
    } catch (error) {
      console.error('Error al generar el PDF:', error);
      toast.error('Error al generar el PDF.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!auditoriaSeleccionada) {
      toast.error('No se ha seleccionado ninguna auditoría.');
      return;
    }

    setIsUpdatingStatus(true);
    try {
      const { error } = await supabase
        .from('auditorias')
        .update({ status: newStatus })
        .eq('codigo_auditoria', auditoriaSeleccionada);

      if (error) {
        console.error('Error al actualizar el estado de la auditoría:', error);
        toast.error('Error al actualizar el estado de la auditoría.');
        return;
      }

      // Actualizar el estado en la lista de auditorías disponibles
      setAuditoriasDisponibles(prevAuditorias =>
        prevAuditorias.map(auditoria =>
          auditoria.codigo_auditoria === auditoriaSeleccionada ? { ...auditoria, status: newStatus } : auditoria
        )
      );

      // Actualizar el estado en la información de la auditoría seleccionada
      setAuditoriaInfo(prevInfo =>
        prevInfo ? { ...prevInfo, status: newStatus } : null
      );

      toast.success('Estado de la auditoría actualizado con éxito!');
    } catch (error) {
      console.error('Error inesperado al actualizar el estado de la auditoría:', error);
      toast.error('Error inesperado al actualizar el estado de la auditoría.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Verificar acceso antes de mostrar el contenido
  if (!canViewAllAuditorias) {
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
              <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Acceso Restringido
              </h3>
              <p className="text-gray-600 mb-2">
                Este módulo está disponible únicamente para usuarios con permisos especiales.
              </p>
              <p className="text-sm text-gray-500">
                {gerenciaNombre && `Gerencia actual: ${gerenciaNombre}`}
              </p>
            </CardContent>
          </Card>
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
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </div>

        <Card className="bg-white/95 backdrop-blur-sm shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-2xl font-bold">
              <FileText className="mr-2 inline-block h-5 w-5" />
              Resumen de Auditorías
            </CardTitle>
          </CardHeader>

          <CardContent className="grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Select onValueChange={handleAuditoriaChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona una auditoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {auditoriasDisponibles.map((auditoria) => (
                      <SelectItem key={auditoria.codigo_auditoria} value={auditoria.codigo_auditoria}>
                        {auditoria.titulo_documento} - {auditoria.codigo_auditoria}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Button
                  className="w-full"
                  onClick={handleGenerarPDF}
                  disabled={!auditoriaInfo || sets.length === 0 || isGeneratingPDF}
                >
                  {isGeneratingPDF ? (
                    <>Generando PDF...</>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Generar Resumen PDF
                    </>
                  )}
                </Button>
              </div>
            </div>

            {auditoriaInfo && (
              <div className="border rounded-md p-4">
                <h3 className="text-xl font-semibold mb-2">Información de la Auditoría</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <p>
                    <span className="font-bold">Código:</span> {auditoriaInfo.codigo_auditoria}
                  </p>
                  <p>
                    <span className="font-bold">Título:</span> {auditoriaInfo.titulo_documento}
                  </p>
                  <p>
                    <span className="font-bold">Fecha:</span>{' '}
                    {new Date(auditoriaInfo.fecha).toLocaleDateString()}
                  </p>
                  <p>
                    <span className="font-bold">Auditor:</span> {auditoriaInfo.auditor}
                  </p>
                  <p>
                    <span className="font-bold">Planta:</span> {auditoriaInfo.planta_nombre}
                  </p>
                  <p>
                    <span className="font-bold">Estado:</span> {auditoriaInfo.status}
                  </p>
                </div>

                <div className="mt-4">
                  <Select onValueChange={handleStatusUpdate} defaultValue={auditoriaInfo.status}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Activo">Activo</SelectItem>
                      <SelectItem value="En Proceso">En Proceso</SelectItem>
                      <SelectItem value="Completado">Completado</SelectItem>
                      <SelectItem value="Cerrado">Cerrado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {sets.length > 0 && (
              <div className="mt-6">
                <h3 className="text-xl font-semibold mb-4">Sets de Auditoría</h3>
                <div className="grid grid-cols-1 gap-4">
                  {sets.map((set) => (
                    <Card key={set.id} className="shadow-md">
                      <CardContent className="p-4">
                        <h4 className="text-lg font-semibold">{set.area}</h4>
                        <p className="text-sm text-gray-500">
                          <span className="font-bold">Levantamiento:</span> {set.levantamiento}
                        </p>
                        <p className="text-sm text-gray-500">
                          <span className="font-bold">Responsable:</span> {set.responsable}
                        </p>
                        {set.evidencia_foto_url ? (
                          <Badge variant="outline">
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Evidencia Adjunta
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <AlertCircle className="mr-2 h-4 w-4" />
                            Sin Evidencia
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {loading && <p>Cargando datos...</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResumenAuditoriasForm;
