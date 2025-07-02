import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, FileText, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import GestionPhotoPreview from './gestion/GestionPhotoPreview';

interface AuditoriaSet {
  id: string;
  auditoria_codigo: string;
  area: string;
  levantamiento: string | null;
  responsable: string | null;
  gerencia_resp_id: number | null;
  fecha_compromiso: string | null;
  foto_urls: string[];
  created_at: string;
  updated_at: string;
}

interface AuditoriaInfo {
  codigo_auditoria: string;
  titulo_documento: string;
  fecha: string;
  auditor: string;
  planta_nombre: string;
  status: string;
}

interface GestionAuditoriaFormProps {
  onClose: () => void;
}

const GestionAuditoriaForm: React.FC<GestionAuditoriaFormProps> = ({ onClose }) => {
  const { user, profile } = useAuth();
  const [auditoriasDisponibles, setAuditoriasDisponibles] = useState<AuditoriaInfo[]>([]);
  const [auditoriaSeleccionada, setAuditoriaSeleccionada] = useState<string>('');
  const [sets, setSets] = useState<AuditoriaSet[]>([]);
  const [auditoriaInfo, setAuditoriaInfo] = useState<AuditoriaInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedSets, setExpandedSets] = useState<Set<string>>(new Set());
  const [editingField, setEditingField] = useState<{ setId: string; field: 'levantamiento' | 'responsable' } | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [editingGerenciaId, setEditingGerenciaId] = useState<number | null>(null);
  const [gerenciaNombre, setGerenciaNombre] = useState<string>('');
  const [isLoadingAuditorias, setIsLoadingAuditorias] = useState(false);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(true);
  const [hasGestionAccess, setHasGestionAccess] = useState(false);

  // Verificar permisos del usuario para acceder al módulo Gestión
  useEffect(() => {
    const checkGestionAccess = async () => {
      console.log('🔍 Verificando acceso al módulo Gestión...');
      
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
          // Si tiene una gerencia asignada, puede acceder
          console.log('🏢 Usuario tiene gerencia asignada:', profile.gerencia_id);
          hasAccess = true;
          
          // Obtener nombre de la gerencia
          const { data: gerenciaData, error: gerenciaError } = await supabase
            .from('gerencias')
            .select('nombre')
            .eq('id', profile.gerencia_id)
            .single();

          if (!gerenciaError && gerenciaData) {
            console.log('✅ Gerencia obtenida:', gerenciaData.nombre);
            setGerenciaNombre(gerenciaData.nombre);
          }
        }

        console.log('🎯 Acceso al módulo Gestión:', hasAccess);
        setHasGestionAccess(hasAccess);
      } catch (error) {
        console.error('💥 Error verificando acceso:', error);
        setHasGestionAccess(false);
      } finally {
        console.log('✅ Verificación de acceso completada');
        setIsLoadingPermissions(false);
      }
    };

    checkGestionAccess();
  }, [user?.id, profile]);

  // Cargar auditorías disponibles (solo si tiene acceso)
  useEffect(() => {
    const loadAuditorias = async () => {
      console.log('📋 Intentando cargar auditorías...');
      console.log('🔐 hasGestionAccess:', hasGestionAccess);
      console.log('⏳ isLoadingPermissions:', isLoadingPermissions);
      
      if (!hasGestionAccess || isLoadingPermissions) {
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
  }, [hasGestionAccess, isLoadingPermissions]);

  // Cargar sets de auditoría (filtrados por gerencia del usuario)
  const loadAuditoriaSets = useCallback(async (codigoAuditoria: string) => {
    if (!codigoAuditoria) {
      console.log('❌ No se proporcionó código de auditoría');
      return;
    }
    
    console.log('🔄 Cargando sets para auditoría:', codigoAuditoria);
    console.log('🏢 Gerencia del usuario:', profile?.gerencia_id);
    setLoading(true);
    
    try {
      // Los sets se filtrarán automáticamente por las políticas RLS
      // Solo verá sets de su gerencia o sin gerencia asignada
      const { data, error } = await supabase
        .from('auditoria_sets')
        .select('*')
        .eq('auditoria_codigo', codigoAuditoria)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ Error al cargar los sets de auditoría:', error);
        toast.error('Error al cargar los sets de auditoría');
        setSets([]);
        return;
      }

      console.log('📊 Sets obtenidos (filtrados por gerencia):', data?.length || 0);
      console.log('📋 Detalle de sets:', data);
      setSets(data || []);
      
      if (!data || data.length === 0) {
        console.log('⚠️ No se encontraron sets para esta auditoría en tu gerencia');
        toast.info('No se encontraron conjuntos de fotos asignados a tu gerencia para esta auditoría');
      }
    } catch (error) {
      console.error('💥 Error inesperado al cargar los sets de auditoría:', error);
      toast.error('Error inesperado al cargar los sets de auditoría');
      setSets([]);
    } finally {
      console.log('✅ Carga de sets completada');
      setLoading(false);
    }
  }, [profile?.gerencia_id]);

  const handleAuditoriaChange = useCallback(async (codigoAuditoria: string) => {
    console.log('🎯 Seleccionando auditoría para gestión:', codigoAuditoria);
    
    // Limpiar estado anterior inmediatamente
    setAuditoriaSeleccionada(codigoAuditoria);
    setSets([]);
    setAuditoriaInfo(null);
    setExpandedSets(new Set());

    const selectedAuditoria = auditoriasDisponibles.find(a => a.codigo_auditoria === codigoAuditoria);
    if (selectedAuditoria) {
      console.log('✅ Auditoría encontrada:', selectedAuditoria);
      setAuditoriaInfo(selectedAuditoria);
      await loadAuditoriaSets(codigoAuditoria);
    } else {
      console.log('❌ Auditoría no encontrada');
    }
  }, [auditoriasDisponibles, loadAuditoriaSets]);

  const toggleSetExpansion = (setId: string) => {
    setExpandedSets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(setId)) {
        newSet.delete(setId);
      } else {
        newSet.add(setId);
      }
      return newSet;
    });
  };

  const startEditing = (setId: string, field: 'levantamiento' | 'responsable', currentValue: string | null, gerenciaId: number | null = null) => {
    setEditingField({ setId, field });
    setEditingValue(currentValue || '');
    setEditingGerenciaId(gerenciaId);
  };

  const saveEdit = async () => {
    if (!editingField) return;

    try {
      const updateData: any = {
        [editingField.field]: editingValue || null,
        updated_at: new Date().toISOString()
      };

      if (editingField.field === 'responsable') {
        updateData.gerencia_resp_id = editingGerenciaId;
      }

      const { error } = await supabase
        .from('auditoria_sets')
        .update(updateData)
        .eq('id', editingField.setId);

      if (error) throw error;

      setSets(prevSets =>
        prevSets.map(set =>
          set.id === editingField.setId
            ? { ...set, ...updateData }
            : set
        )
      );

      toast.success(`${editingField.field === 'levantamiento' ? 'Levantamiento' : 'Responsable'} actualizado correctamente`);
      cancelEdit();
    } catch (error) {
      console.error('Error updating field:', error);
      toast.error('Error al actualizar el campo');
    }
  };

  const cancelEdit = () => {
    setEditingField(null);
    setEditingValue('');
    setEditingGerenciaId(null);
  };

  const deleteSet = async (setId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este conjunto de fotos?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('auditoria_sets')
        .delete()
        .eq('id', setId);

      if (error) throw error;

      setSets(prevSets => prevSets.filter(set => set.id !== setId));
      toast.success('Conjunto eliminado correctamente');
    } catch (error) {
      console.error('Error deleting set:', error);
      toast.error('Error al eliminar el conjunto');
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
  if (!hasGestionAccess) {
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
                Este módulo requiere estar asignado a una gerencia para poder gestionar las auditorías correspondientes.
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
              Gestión de Auditorías
            </CardTitle>
            {gerenciaNombre && (
              <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                Gerencia: {gerenciaNombre}
              </div>
            )}
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
              <div className="w-full">
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
            )}

            {auditoriaInfo && (
              <div className="border rounded-md p-4">
                <h3 className="text-xl font-semibold mb-2">Información de la Auditoría</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <p><span className="font-bold">Código:</span> {auditoriaInfo.codigo_auditoria}</p>
                  <p><span className="font-bold">Título:</span> {auditoriaInfo.titulo_documento}</p>
                  <p><span className="font-bold">Fecha:</span> {new Date(auditoriaInfo.fecha).toLocaleDateString()}</p>
                  <p><span className="font-bold">Auditor:</span> {auditoriaInfo.auditor}</p>
                  <p><span className="font-bold">Planta:</span> {auditoriaInfo.planta_nombre}</p>
                  <p><span className="font-bold">Estado:</span> {auditoriaInfo.status}</p>
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
                <p className="text-gray-600">No se encontraron conjuntos de fotos asignados a tu gerencia para esta auditoría.</p>
              </div>
            )}

            {/* Preview de Fotografías usando el nuevo componente */}
            {!loading && sets.length > 0 && (
              <div className="mt-6">
                <GestionPhotoPreview
                  auditoriaSets={sets}
                  expandedSets={expandedSets}
                  editingField={editingField}
                  editingValue={editingValue}
                  editingGerenciaId={editingGerenciaId}
                  onToggleExpansion={toggleSetExpansion}
                  onStartEditing={startEditing}
                  onSaveEdit={saveEdit}
                  onCancelEdit={cancelEdit}
                  onEditingValueChange={setEditingValue}
                  onEditingGerenciaChange={setEditingGerenciaId}
                  onDeleteSet={deleteSet}
                  gerenciaNombre={gerenciaNombre}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GestionAuditoriaForm;
