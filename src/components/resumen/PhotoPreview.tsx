
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Camera, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface ResumenAuditoriaSet {
  id: string;
  area: string;
  levantamiento: string;
  responsable: string;
  foto_urls: string[];
  fecha_compromiso: string | null;
  evidencia_foto_url: string | null;
  gerencia_resp_id: number | null;
}

interface PhotoPreviewProps {
  auditoriaSets: ResumenAuditoriaSet[];
}

const PhotoPreview: React.FC<PhotoPreviewProps> = ({ auditoriaSets }) => {
  const [expandedSet, setExpandedSet] = useState<string | null>(null);

  const getStatusInfo = (set: ResumenAuditoriaSet) => {
    if (set.evidencia_foto_url) {
      return {
        status: 'completed',
        label: 'Completado',
        icon: CheckCircle,
        color: 'bg-green-100 text-green-800 border-green-200'
      };
    } else if (set.fecha_compromiso) {
      const compromiseDate = new Date(set.fecha_compromiso);
      const today = new Date();
      const isOverdue = compromiseDate < today;
      
      return {
        status: 'pending',
        label: isOverdue ? 'Vencido' : 'Pendiente',
        icon: isOverdue ? AlertCircle : Clock,
        color: isOverdue ? 'bg-red-100 text-red-800 border-red-200' : 'bg-yellow-100 text-yellow-800 border-yellow-200'
      };
    } else {
      return {
        status: 'no-response',
        label: 'Sin respuesta',
        icon: AlertCircle,
        color: 'bg-gray-100 text-gray-800 border-gray-200'
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

  const toggleExpanded = (setId: string) => {
    setExpandedSet(expandedSet === setId ? null : setId);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Camera className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-800">
          Preview de Fotografías ({auditoriaSets.length} áreas)
        </h3>
      </div>

      {auditoriaSets.map((set) => {
        const statusInfo = getStatusInfo(set);
        const StatusIcon = statusInfo.icon;
        const isExpanded = expandedSet === set.id;

        return (
          <Card key={set.id} className="bg-white/95 backdrop-blur-sm shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium text-gray-800">
                  📍 {set.area}
                </CardTitle>
                <Badge className={`${statusInfo.color} flex items-center gap-1`}>
                  <StatusIcon className="w-3 h-3" />
                  {statusInfo.label}
                </Badge>
              </div>
              <div className="text-sm text-gray-600">
                <p><strong>Responsable:</strong> {set.responsable || 'Sin asignar'}</p>
                {set.fecha_compromiso && (
                  <p className="flex items-center gap-1 mt-1">
                    <Calendar className="w-3 h-3" />
                    <strong>Fecha compromiso:</strong> {formatDate(set.fecha_compromiso)}
                  </p>
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
                        />
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
                    onClick={() => toggleExpanded(set.id)}
                    className="mt-2 text-blue-600 hover:text-blue-800"
                  >
                    {isExpanded ? 'Ver menos' : `Ver ${set.foto_urls.length - 3} más`}
                  </Button>
                )}
              </div>

              {/* Fotografía de evidencia de respuesta */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Evidencia de respuesta
                </h4>
                {set.evidencia_foto_url ? (
                  <div className="w-32 h-32">
                    <img
                      src={set.evidencia_foto_url}
                      alt={`Evidencia ${set.area}`}
                      className="w-full h-full object-cover rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => window.open(set.evidencia_foto_url!, '_blank')}
                    />
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500 text-sm bg-gray-50 rounded-lg">
                    {set.fecha_compromiso ? 'Pendiente de evidencia' : 'Sin respuesta'}
                  </div>
                )}
              </div>

              {/* Levantamiento */}
              {set.levantamiento && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Levantamiento:</h4>
                  <p className="text-sm text-gray-600">{set.levantamiento}</p>
                </div>
              )}
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

export default PhotoPreview;
