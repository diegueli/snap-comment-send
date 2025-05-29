
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface AuditoriaFormProps {
  onStartCamera: (auditoriaData: any) => void;
}

const AuditoriaForm = ({ onStartCamera }: AuditoriaFormProps) => {
  const { user, profile } = useAuth();
  const [formData, setFormData] = useState({
    titulo_documento: '',
    area: '',
    levantamiento: '',
    responsable: '',
    fecha_compromiso: '',
    status: 'Activo' as 'Activo' | 'Terminado',
    evidencia: ''
  });

  const currentDate = new Date().toISOString().split('T')[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.titulo_documento.trim() || !formData.area.trim()) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa el Título del Documento y el Área",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('auditorias')
        .insert({
          user_id: user?.id,
          titulo_documento: formData.titulo_documento,
          fecha: currentDate,
          auditor: profile?.name || '',
          area: formData.area,
          levantamiento: formData.levantamiento,
          responsable: formData.responsable,
          fecha_compromiso: formData.fecha_compromiso || null,
          status: formData.status,
          evidencia: formData.evidencia
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Auditoría creada",
        description: "La auditoría ha sido registrada exitosamente"
      });

      onStartCamera({
        ...data,
        auditorId: data.id
      });
    } catch (error: any) {
      console.error('Error creating auditoria:', error);
      toast({
        title: "Error",
        description: "No se pudo crear la auditoría",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-xl font-bold">
            Auditoría
          </CardTitle>
          <p className="text-center text-gray-600">
            Completa la información para iniciar la auditoría
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Título del Documento */}
            <div>
              <Label htmlFor="titulo_documento">Título Auditoría *</Label>
              <Input
                id="titulo_documento"
                value={formData.titulo_documento}
                onChange={(e) => setFormData(prev => ({ ...prev, titulo_documento: e.target.value }))}
                placeholder="Ingresa el título de la auditoría"
                required
              />
            </div>

            {/* Fecha (no editable) */}
            <div>
              <Label htmlFor="fecha">Fecha</Label>
              <Input
                id="fecha"
                value={currentDate}
                readOnly
                className="bg-gray-50"
              />
            </div>

            {/* Auditor (no editable) */}
            <div>
              <Label htmlFor="auditor">Auditor</Label>
              <Input
                id="auditor"
                value={profile?.name || ''}
                readOnly
                className="bg-gray-50"
              />
            </div>

            {/* Área */}
            <div>
              <Label htmlFor="area">Área *</Label>
              <Input
                id="area"
                value={formData.area}
                onChange={(e) => setFormData(prev => ({ ...prev, area: e.target.value }))}
                placeholder="Ingresa el área a auditar"
                required
              />
            </div>

            {/* Levantamiento */}
            <div>
              <Label htmlFor="levantamiento">Levantamiento</Label>
              <Textarea
                id="levantamiento"
                value={formData.levantamiento}
                onChange={(e) => setFormData(prev => ({ ...prev, levantamiento: e.target.value }))}
                placeholder="Observaciones del levantamiento..."
                rows={3}
              />
            </div>

            {/* Responsable */}
            <div>
              <Label htmlFor="responsable">Responsable</Label>
              <Input
                id="responsable"
                value={formData.responsable}
                onChange={(e) => setFormData(prev => ({ ...prev, responsable: e.target.value }))}
                placeholder="Nombre del responsable"
              />
            </div>

            {/* Fecha de Compromiso */}
            <div>
              <Label htmlFor="fecha_compromiso">Fecha de Compromiso</Label>
              <Input
                id="fecha_compromiso"
                type="date"
                value={formData.fecha_compromiso}
                onChange={(e) => setFormData(prev => ({ ...prev, fecha_compromiso: e.target.value }))}
              />
            </div>

            {/* Status */}
            <div>
              <Label htmlFor="status">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value: 'Activo' | 'Terminado') => 
                  setFormData(prev => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Activo">Activo</SelectItem>
                  <SelectItem value="Terminado">Terminado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Evidencia */}
            <div>
              <Label htmlFor="evidencia">Evidencia</Label>
              <Input
                id="evidencia"
                value={formData.evidencia}
                onChange={(e) => setFormData(prev => ({ ...prev, evidencia: e.target.value.slice(0, 120) }))}
                placeholder="Descripción de la evidencia (máx. 120 caracteres)"
                maxLength={120}
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.evidencia.length}/120 caracteres
              </p>
            </div>

            <Button type="submit" className="w-full">
              Iniciar Cámara
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditoriaForm;
