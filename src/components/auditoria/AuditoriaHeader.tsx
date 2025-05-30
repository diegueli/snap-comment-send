
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AuditoriaData } from '@/types/auditoria';

interface AuditoriaHeaderProps {
  auditoriaData: AuditoriaData;
  codigoAuditoria?: string | null;
}

const AuditoriaHeader = ({ auditoriaData, codigoAuditoria }: AuditoriaHeaderProps) => {
  return (
    <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
      <CardHeader className="text-center pb-3">
        <CardTitle className="text-xl font-bold bg-gradient-to-r from-yellow-500 to-red-600 bg-clip-text text-transparent">
          📋 {auditoriaData.tituloDocumento}
        </CardTitle>
        <div className="space-y-1 text-sm text-gray-600">
          <p>Auditor: {auditoriaData.auditor} | Fecha: {auditoriaData.fecha}</p>
          {codigoAuditoria && (
            <p className="font-semibold text-blue-600">
              Código Asignado: {codigoAuditoria}
            </p>
          )}
        </div>
      </CardHeader>
    </Card>
  );
};

export default AuditoriaHeader;
