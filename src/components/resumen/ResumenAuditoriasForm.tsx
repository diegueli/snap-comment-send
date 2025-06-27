import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, FileText, Download, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { generateResumenPDF } from '@/utils/resumenPdfGenerator';
import { toast } from 'sonner';
import PhotoPreview, { ResumenAuditoriaSet } from './PhotoPreview';

interface AuditoriaInfo {
  codigo_auditoria: string;
  titulo_documento: string;
  fecha: string;
  auditor: string;
  planta_nombre: string;
  status: string;
}

interface ResumenAuditoriasFormProps {
  onClose: () => void;
}

const ResumenAuditoriasForm: React.FC<ResumenAuditoriasFormProps> = ({ onClose }) => {
  const { user, profile } = useAuth();
  const [auditoriasDisponibles, setAuditoriasDisponibles] = useState<AuditoriaInfo[]>([]);
  const [auditoriaSeleccionada, setAuditoriaSeleccionada] = useState<string>('');
  const [sets, setSets] = useState<ResumenAuditoriaSet[]>([]);
  const [auditoriaInfo, setAuditoriaInfo] = useState<AuditoriaInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [gerenciaNombre, setGerenciaNombre] = useState<string>('');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [hasResumenAccess, setHasResumenAccess] = useState(false);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(true);
  const [isLoadingAuditorias, setIsLoadingAuditorias] = useState(false);

  // Verificar permisos del usuario para acceder al módulo Resumen
  useEffect(() => {
    const checkResumenAccess = async () => {
      console.log('🔍 Verificando acceso al módulo Resumen...');
      
      if (!user?.id || !profile) {
        console.log('❌ No hay usuario o perfil disponible');
        setIsLoadingPermissions(false);
        return;
      }

      try {
        console.log('👤 Usuario ID:', user.id);
        console.log('📋 Perfil:', profile);
        
        let hasAccess = false;
        
        // Verificar si tiene permisos globales
        if (profile.can_view_all_auditorias) {
          console.log('✅ Usuario tiene permisos globales');
          hasAccess = true;
        } else if (profile.gerencia_id) {
          // Verificar si pertenece a gerencia de Calidad
          console.log('🏢 Verificando gerencia ID:', profile.gerencia_id);
          const { data: gerenciaData, error: gerenciaError } = await supabase
            .from('gerencias')
            .select('nombre')
            .eq('id', profile.gerencia_id)
            .single();

          if (!gerenciaError && gerenciaData) {
            console.log('✅ Gerencia obtenida:', gerenciaData.nombre);
            setGerenciaNombre(gerenciaData.nombre);
            
            // Verificar si es gerencia de Calidad (case insensitive)
            if (gerenciaData.nombre.toLowerCase().includes('calidad')) {
              console.log('✅ Usuario pertenece a gerencia de Calidad');
              hasAccess = true;
            }
          } else {
            console.log('⚠️ No se pudo obtener gerencia:', gerenciaError);
          }
        }

        console.log('🎯 Acceso al módulo Resumen:', hasAccess);
        setHasResumenAccess(hasAccess);
      } catch (error) {
        console.error('💥 Error verificando acceso:', error);
        setHasResumenAccess(false);
      } finally {
        console.log('✅ Verificación de acceso completada');
        setIsLoadingPermissions(false);
      }
    };

    checkResumenAccess();
  }, [user?.id, profile]);

  // Cargar auditorías disponibles (solo si tiene acceso)
  useEffect(() => {
    const loadAuditorias = async () => {
      console.log('📋 Intentando cargar auditorías...');
      console.log('🔐 hasResumenAccess:', hasResumenAccess);
      console.log('⏳ isLoadingPermissions:', isLoadingPermissions);
      
      if (!hasResumenAccess || isLoadingPermissions) {
        console.log('❌ No se pueden cargar auditorías: acceso denegado o aún cargando');
        return;
      }

      setIsLoadingAuditorias(true);
      try {
        console.log('🔄 Ejecutando consulta a la base de datos...');
        
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
          console.error('❌ Error al cargar auditorías:', error);
          toast.error('Error al cargar las auditorías disponibles');
          return;
        }

        console.log('📊 Datos obtenidos de la base de datos:', data);
        console.log('📈 Cantidad de auditorías:', data?.length || 0);

        const auditoriasFormatted = data?.map(item => ({
          codigo_auditoria: item.codigo_auditoria,
          titulo_documento: item.titulo_documento,
          fecha: item.fecha,
          auditor: item.auditor,
          planta_nombre: item.plantas?.nombre || 'Sin planta',
          status: item.status || 'Activo'
        })) || [];

        console.log('✅ Auditorías formateadas:', auditoriasFormatted);
        setAuditoriasDisponibles(auditoriasFormatted);
      } catch (error) {
        console.error('💥 Error loading auditorías:', error);
        toast.error('Error al cargar las auditorías disponibles');
      } finally {
        setIsLoadingAuditorias(false);
      }
    };

    loadAuditorias();
  }, [hasResumenAccess, isLoadingPermissions]);

  const loadAuditoriaSets = useCallback(async (codigoAuditoria: string) => {
    if (!codigoAuditoria) {
      console.log('❌ No se proporcionó código de auditoría');
      return;
    }
    
    console.log('🔄 Cargando sets para auditoría:', codigoAuditoria);
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('auditoria_sets')
        .select('*')
        .eq('auditoria_codigo', codigoAuditoria);

      if (error) {
        console.error('❌ Error al cargar los sets de auditoría:', error);
        toast.error('Error al cargar los sets de auditoría');
        setSets([]);
        return;
      }

      console.log('📊 Sets obtenidos:', data);
      console.log('📈 Cantidad de sets:', data?.length || 0);
      setSets(data || []);
      
      if (!data || data.length === 0) {
        console.log('⚠️ No se encontraron sets para esta auditoría');
        toast.info('No se encontraron conjuntos de fotos para esta auditoría');
      }
    } catch (error) {
      console.error('💥 Error inesperado al cargar los sets de auditoría:', error);
      toast.error('Error inesperado al cargar los sets de auditoría');
      setSets([]);
    } finally {
      console.log('✅ Carga de sets completada');
      setLoading(false);
    }
  }, []);

  const handleAuditoriaChange = useCallback(async (codigoAuditoria: string) => {
    console.log('🎯 Seleccionando auditoría:', codigoAuditoria);
    
    // Limpiar estado anterior inmediatamente
    setAuditoriaSeleccionada(codigoAuditoria);
    setSets([]);
    setAuditoriaInfo(null);

    const selectedAuditoria = auditoriasDisponibles.find(a => a.codigo_auditoria === codigoAuditoria);
    if (selectedAuditoria) {
      console.log('✅ Auditoría encontrada:', selectedAuditoria);
      setAuditoriaInfo(selectedAuditoria);
      await loadAuditoriaSets(codigoAuditoria);
    } else {
      console.log('❌ Auditoría no encontrada');
    }
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

  // Mostrar spinner de carga mientras se verifican permisos
  if (isLoadingPermissions) {
    console.log('⏳ Mostrando spinner de permisos...');
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
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Verificando permisos...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Verificar acceso antes de mostrar el contenido
  if (!hasResumenAccess) {
    console.log('🚫 Acceso denegado - mostrando mensaje de restricción');
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
                Este módulo está disponible únicamente para usuarios de la gerencia de "Calidad" o con permisos especiales.
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

  console.log('🎨 Renderizando componente principal');
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

        <Card className="bg-white/95 backdrop-blur-sm shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-2xl font-bold">
              <FileText className="mr-2 inline-block h-5 w-5" />
              Resumen de Auditorías
            </CardTitle>
          </CardHeader>

          <CardContent className="grid gap-4">
            {/* Mostrar estado de carga de auditorías */}
            {isLoadingAuditorias && (
              <div className="text-center py-4">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-gray-600">Cargando auditorías disponibles...</p>
              </div>
            )}

            {!isLoadingAuditorias && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Select onValueChange={handleAuditoriaChange} value={auditoriaSeleccionada}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona una auditoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {auditoriasDisponibles.length > 0 ? (
                        auditoriasDisponibles.map((auditoria) => (
                          <SelectItem key={auditoria.codigo_auditoria} value={auditoria.codigo_auditoria}>
                            {auditoria.titulo_documento} - {auditoria.codigo_auditoria}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-auditorias" disabled>
                          No hay auditorías disponibles
                        </SelectItem>
                      )}
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
            )}

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
                  <Select onValueChange={handleStatusUpdate} defaultValue={auditoriaInfo.status} disabled={isUpdatingStatus}>
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

            {/* Mostrar estado de carga de sets */}
            {loading && (
              <div className="text-center py-4">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-gray-600">Cargando datos de la auditoría...</p>
              </div>
            )}

            {/* Mostrar mensaje cuando no hay sets pero no está cargando */}
            {!loading && auditoriaSeleccionada && sets.length === 0 && (
              <div className="text-center py-4 bg-gray-50 rounded-lg">
                <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">No se encontraron conjuntos de fotos para esta auditoría.</p>
              </div>
            )}

            {/* Preview de Fotografías */}
            {!loading && sets.length > 0 && (
              <div className="mt-6">
                <PhotoPreview auditoriaSets={sets} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResumenAuditoriasForm;
