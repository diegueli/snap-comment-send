
import React from 'react';
import { Save, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ActionButtonsProps {
  photoSetsLength: number;
  onCloseAuditoria: () => void;
  onGeneratePDF: () => void;
  isSavingToDatabase: boolean;
}

const ActionButtons = ({
  photoSetsLength,
  onCloseAuditoria,
  onGeneratePDF,
  isSavingToDatabase
}: ActionButtonsProps) => {
  if (photoSetsLength === 0) return null;

  return (
    <div className="space-y-3">
      <Button
        onClick={onCloseAuditoria}
        className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white"
        disabled={isSavingToDatabase}
      >
        <Save className="w-4 h-4 mr-2" />
        {isSavingToDatabase ? 'Guardando...' : 'Cerrar Auditoría'}
      </Button>
      <Button
        onClick={onGeneratePDF}
        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
      >
        <FileText className="w-4 h-4 mr-2" />
        Descargar PDF
      </Button>
    </div>
  );
};

export default ActionButtons;
