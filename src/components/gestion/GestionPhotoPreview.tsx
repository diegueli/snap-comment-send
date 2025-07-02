
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Camera, CheckCircle, Clock, AlertCircle, Edit, Save, X, Trash2, Eye, EyeOff } from 'lucide-react';
import ResponsableSelect from '../auditoria/ResponsableSelect';

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

interface GestionPhotoPreviewProps {
  auditoriaSets: AuditoriaSet[];
  expandedSets: Set<string>;
  editingField: { setId: string; field: 'levantamiento' | 'responsable' } | null;
  editingValue: string;
  editingGerenciaId: number | null;
  onToggleExpansion: (setId: string) => void;
  onStartEditing: (setId: string, field: 'levantamiento' | 'responsable', currentValue: string | null, gerenciaId?: number | null) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onEditingValueChange: (value: string) => void;
  onEditingGerenciaChange: (gerenciaId: number | null) => void;
  onDeleteSet: (setId: string) => void;
  gerenciaNombre: string;
}

const GestionPhotoPreview: React.FC<GestionPhotoPreviewProps> = ({
  auditoriaSets,
  expandedSets,
  editingField,
  editingValue,
  editingGerenciaId,
  onToggleExpansion,
  onStartEditing,
  onSaveEdit,
  onCancelEdit,
  onEditingValueChange,
  onEditingGerenciaChange,
  onDeleteSet,
  gerenciaNombre
}) => {
  const getStatusInfo = (set: AuditoriaSet) => {
    if (set.responsable) {
      return {
        status: 'assigned',
        label: 'Asignado',
        icon: CheckCircle,
        color: 'bg-green-100 text-green-800 border-green-200'
      };
    } else {
      return {
        status: 'unassigned',
        label: 'Sin asignar',
        icon: AlertCircle,
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200'
      };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Camera className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-800">
          Conjuntos de Fotos - {gerenciaNombre} ({auditoriaSets.length})
        </h3>
      </div>

      {auditoriaSets.map((set) => {
        const statusInfo = getStatusInfo(set);
        const StatusIcon = statusInfo.icon;
        const isExpanded = expandedSets.has(set.id);

        return (
          <Card key={set.id} className="bg-white/95 backdrop-blur-sm shadow-md hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium text-gray-800">
                  📍 {set.area}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge className={`${statusInfo.color} flex items-center gap-1`}>
                    <StatusIcon className="w-3 h-3" />
                    {statusInfo.label}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onToggleExpansion(set.id)}
                  >
                    {isExpanded ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteSet(set.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                <p><strong>Responsable:</strong> {set.responsable || 'Sin asignar'}</p>
                <p><strong>Fotos:</strong> {set.foto_urls?.length || 0}</p>
                <p><strong>Creado:</strong> {formatDate(set.created_at)}</p>
                {set.updated_at !== set.created_at && (
                  <p><strong>Actualizado:</strong> {formatDate(set.updated_at)}</p>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              {/* Fotografías del levantamiento */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Fotografías del levantamiento ({set.foto_urls?.length || 0})
                </h4>
                {set.foto_urls && set.foto_urls.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {set.foto_urls.slice(0, isExpanded ? set.foto_urls.length : 3).map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Levantamiento ${set.area} - ${index + 1}`}
                          className="w-full aspect-square object-cover rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
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
                ) : (
                  <div className="text-center py-4 text-gray-500 text-sm bg-gray-50 rounded-lg">
                    Sin fotografías de levantamiento
                  </div>
                )}
                
                {set.foto_urls && set.foto_urls.length > 3 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onToggleExpansion(set.id)}
                    className="mt-2 text-blue-600 hover:text-blue-800"
                  >
                    {isExpanded ? 'Ver menos' : `Ver ${set.foto_urls.length - 3} más`}
                  </Button>
                )}
              </div>

              {/* Levantamiento - Editable */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Levantamiento:</h4>
                {editingField?.setId === set.id && editingField?.field === 'levantamiento' ? (
                  <div className="flex gap-2">
                    <Textarea
                      value={editingValue}
                      onChange={(e) => onEditingValueChange(e.target.value)}
                      className="flex-1"
                      rows={3}
                    />
                    <div className="flex flex-col gap-1">
                      <Button size="sm" onClick={onSaveEdit}>
                        <Save className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={onCancelEdit}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <p className="text-sm text-gray-600">
                          {set.levantamiento || 'Sin levantamiento'}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onStartEditing(set.id, 'levantamiento', set.levantamiento)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Responsable - Editable */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Responsable:</h4>
                {editingField?.setId === set.id && editingField?.field === 'responsable' ? (
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <ResponsableSelect
                        value={editingValue}
                        onValueChange={(value, gerenciaId) => {
                          onEditingValueChange(value);
                          onEditingGerenciaChange(gerenciaId || null);
                        }}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Button size="sm" onClick={onSaveEdit}>
                        <Save className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={onCancelEdit}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <p className="text-sm text-gray-600">
                          {set.responsable || 'Sin responsable asignado'}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onStartEditing(set.id, 'responsable', set.responsable, set.gerencia_resp_id)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {auditoriaSets.length === 0 && (
        <Card className="bg-white/95 backdrop-blur-sm shadow-md">
          <CardContent className="p-6 text-center">
            <Camera className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">No hay sets de auditoría para mostrar</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GestionPhotoPreview;
