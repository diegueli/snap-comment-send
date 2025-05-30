
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AuditoriaData } from '@/types/auditoria';

interface AuditoriaHeaderProps {
  auditoriaData: AuditoriaData;
}

const AuditoriaHeader = ({ auditoriaData }: AuditoriaHeaderProps) => {
  return (
    <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
      <CardHeader className="text-center pb-3">
        <CardTitle className="text-xl font-bold bg-gradient-to-r from-yellow-500 to-red-600 bg-clip-text text-transparent">
          📋 {auditoriaData.tituloDocumento}
        </CardTitle>
        <p className="text-sm text-gray-600">
          Auditor: {auditoriaData.auditor} | Fecha: {auditoriaData.fecha}
        </p>
      </CardHeader>
    </Card>
  );
};

export default AuditoriaHeader;
