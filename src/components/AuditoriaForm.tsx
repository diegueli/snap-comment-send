
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AuditoriaFormData {
  tituloDocumento: string;
  fecha: string;
  auditor: string;
}

interface AuditoriaFormProps {
  onSubmit: (data: AuditoriaFormData) => void;
  userData: {
    name: string;
    email: string;
    position: string;
  } | null;
}

const AuditoriaForm = ({ onSubmit, userData }: AuditoriaFormProps) => {
  const [tituloDocumento, setTituloDocumento] = useState('');
  const today = new Date().toISOString().split('T')[0];
  const auditor = userData?.name || '';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tituloDocumento.trim()) {
      onSubmit({
        tituloDocumento: tituloDocumento.trim(),
        fecha: today,
        auditor
      });
    }
  };

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
      <CardHeader className="text-center pb-3">
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-yellow-500 to-red-600 bg-clip-text text-transparent">
          📋 Auditoría
        </CardTitle>
        <p className="text-sm text-gray-600">
          Complete la información inicial para comenzar la auditoría
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="titulo-auditoria" className="block text-sm font-medium text-gray-700 mb-2">
              Título Auditoría
            </label>
            <Input
              id="titulo-auditoria"
              placeholder="Ingrese el título de la auditoría"
              value={tituloDocumento}
              onChange={(e) => setTituloDocumento(e.target.value)}
              className="border-gray-200 focus:border-red-500"
              required
            />
          </div>

          <div>
            <label htmlFor="fecha" className="block text-sm font-medium text-gray-700 mb-2">
              Fecha
            </label>
            <Input
              id="fecha"
              type="date"
              value={today}
              readOnly
              className="bg-gray-100 border-gray-200 cursor-not-allowed"
            />
          </div>

          <div>
            <label htmlFor="auditor" className="block text-sm font-medium text-gray-700 mb-2">
              Auditor
            </label>
            <Input
              id="auditor"
              value={auditor}
              readOnly
              className="bg-gray-100 border-gray-200 cursor-not-allowed"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-yellow-500 to-red-600 hover:from-yellow-600 hover:to-red-700 text-white"
            disabled={!tituloDocumento.trim()}
          >
            Continuar
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AuditoriaForm;
