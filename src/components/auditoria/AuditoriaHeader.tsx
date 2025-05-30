
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AuditoriaData } from '@/types/auditoria';

interface AuditoriaHeaderProps {
  auditoriaData: AuditoriaData;
}

const AuditoriaHeader = ({ auditoriaData }: AuditoriaHeaderProps) => {
  return (
    <Card className="card-instagram mb-6 animate-fade-in">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl font-bold gradient-bg bg-clip-text text-transparent mb-2">
          📋 {auditoriaData.tituloDocumento}
        </CardTitle>
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 shadow-inner">
          <p className="text-sm font-medium text-gray-700">
            <span className="font-semibold">Auditor:</span> {auditoriaData.auditor}
          </p>
          <p className="text-sm font-medium text-gray-700 mt-1">
            <span className="font-semibold">Fecha:</span> {auditoriaData.fecha}
          </p>
        </div>
      </CardHeader>
    </Card>
  );
};

export default AuditoriaHeader;
