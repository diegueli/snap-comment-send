import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, FileText, Edit, Save, X, Trash2, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import ResponsableSelect from './auditoria/ResponsableSelect';

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

  // Obtener información de la gerencia del usuario
  useEffect(() => {
    const getGerenciaInfo = async () => {
      if (!profile?.gerencia_id) return;

      try {
        const { data: gerenciaData, error } = await supabase
          .from('gerencias')
          .select('nombre')
          .eq('id', profile.gerencia_id)
          .single();

        if (!error && gerenciaData) {
          setGerenciaNombre(gerenciaData.nombre);
        }
      } catch (error) {
        console.error('Error obteniendo gerencia:', error);
      }
    };

    getGerenciaInfo();
  }, [profile?.gerencia_id]);

  // Cargar auditorías disponibles
  useEffect(() => {
    const loadAuditorias = async () => {
      if (!user?.id) return;

      setIsLoadingAuditorias(true);
      try {
        console.log('🔄 Cargando auditorías para gestión...');
        
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

        console.log('📊 Auditorías obtenidas:', data?.length || 0);

        const auditoriasFormatted = data?.map(item => ({
          codigo_auditoria: item.codigo_auditoria,
          titulo_documento: item.titulo_documento,
          fecha: item.fecha,
          auditor: item.auditor,
          planta_nombre: item.plantas?.nombre || 'Sin planta',
          status: item.status || 'Activo'
        })) || [];

        setAuditoriasDisponibles(auditoriasFormatted);
      } catch (error) {
        console.error('💥 Error loading auditorías:', error);
        toast.error('Error al cargar las auditorías disponibles');
      } finally {
        setIsLoadingAuditorias(false);
      }
    };

    loadAuditorias();
  }, [user?.id]);

  // Cargar sets de auditoría (filtrados por gerencia del usuario)
  const loadAuditoriaSets = useCallback(async (codigoAuditoria: string) => {
    if (!codigoAuditoria) return;
    
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
              Gestión de Auditoría
            </CardTitle>
            {gerenciaNombre && (
              <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                Gerencia: {gerenciaNombre}
              </div>
            )}
          </CardHeader>

          <CardContent className="grid gap-4">
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

            {loading && (
              <div className="text-center py-4">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-gray-600">Cargando conjuntos de fotos de tu gerencia...</p>
              </div>
            )}

            {!loading && auditoriaSeleccionada && sets.length === 0 && (
              <div className="text-center py-4 bg-gray-50 rounded-lg">
                <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">No se encontraron conjuntos de fotos asignados a tu gerencia para esta auditoría.</p>
              </div>
            )}

            {/* Sets Display */}
            {sets.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">
                  Conjuntos de Fotos - {gerenciaNombre} ({sets.length})
                </h3>
                
                {sets.map((set) => (
                  <Card key={set.id} className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{set.area}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleSetExpansion(set.id)}
                          >
                            {expandedSets.has(set.id) ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteSet(set.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {/* Levantamiento Field */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Levantamiento
                          </label>
                          {editingField?.setId === set.id && editingField?.field === 'levantamiento' ? (
                            <div className="flex gap-2">
                              <Textarea
                                value={editingValue}
                                onChange={(e) => setEditingValue(e.target.value)}
                                className="flex-1"
                                rows={3}
                              />
                              <div className="flex flex-col gap-1">
                                <Button size="sm" onClick={saveEdit}>
                                  <Save className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={cancelEdit}>
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start gap-2">
                              <div className="flex-1 min-h-[2.5rem] p-2 border rounded-md bg-gray-50">
                                {set.levantamiento || 'Sin levantamiento'}
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => startEditing(set.id, 'levantamiento', set.levantamiento)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* Responsable Field */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Responsable
                          </label>
                          {editingField?.setId === set.id && editingField?.field === 'responsable' ? (
                            <div className="flex gap-2">
                              <div className="flex-1">
                                <ResponsableSelect
                                  value={editingValue}
                                  onValueChange={(value, gerenciaId) => {
                                    setEditingValue(value);
                                    setEditingGerenciaId(gerenciaId || null);
                                  }}
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <Button size="sm" onClick={saveEdit}>
                                  <Save className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={cancelEdit}>
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <div className="flex-1 p-2 border rounded-md bg-gray-50">
                                {set.responsable || 'Sin responsable asignado'}
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => startEditing(set.id, 'responsable', set.responsable, set.gerencia_resp_id)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Información adicional */}
                      <div className="text-sm text-gray-600 mb-2">
                        <p>Fotos: {set.foto_urls?.length || 0}</p>
                        <p>Creado: {new Date(set.created_at).toLocaleString()}</p>
                        {set.updated_at !== set.created_at && (
                          <p>Actualizado: {new Date(set.updated_at).toLocaleString()}</p>
                        )}
                      </div>

                      {/* Photo Gallery - Preview de fotografías */}
                      {expandedSets.has(set.id) && set.foto_urls && set.foto_urls.length > 0 && (
                        <div className="mt-4">
                          <h4 className="font-medium mb-2 text-gray-700">
                            Fotografías ({set.foto_urls.length})
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {set.foto_urls.map((url, index) => (
                              <div key={index} className="aspect-square relative group">
                                <img
                                  src={url}
                                  alt={`Foto ${index + 1} de ${set.area}`}
                                  className="w-full h-full object-cover rounded-lg border-2 border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:border-blue-300"
                                  onClick={() => window.open(url, '_blank')}
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                  }}
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                                  <Eye className="text-white w-6 h-6" />
                                </div>
                                <div className="absolute top-1 right-1 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                                  {index + 1}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Mostrar mensaje cuando no hay fotos para visualizar */}
                      {expandedSets.has(set.id) && (!set.foto_urls || set.foto_urls.length === 0) && (
                        <div className="mt-4 text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                          <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-600 text-sm">No hay fotografías disponibles para este conjunto</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GestionAuditoriaForm;
