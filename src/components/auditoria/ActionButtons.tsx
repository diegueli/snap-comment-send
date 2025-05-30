
import React from 'react';
import { Save, FileText, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ActionButtonsProps {
  photoSetsLength: number;
  onCloseAuditoria: () => void;
  onGeneratePDF: () => void;
  onResetApp: () => void;
  isSavingToDatabase: boolean;
}

const ActionButtons = ({
  photoSetsLength,
  onCloseAuditoria,
  onGeneratePDF,
  onResetApp,
  isSavingToDatabase
}: ActionButtonsProps) => {
  if (photoSetsLength === 0) return null;

  return (
    <div className="space-y-4 animate-fade-in">
      <Button
        onClick={onCloseAuditoria}
        className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-4 rounded-xl shadow-lg transition-all duration-200 active:scale-95"
        disabled={isSavingToDatabase}
      >
        <Save className="w-5 h-5 mr-2" />
        {isSavingToDatabase ? 'Guardando...' : 'Cerrar Auditoría'}
      </Button>
      
      <Button
        onClick={onGeneratePDF}
        className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-4 rounded-xl shadow-lg transition-all duration-200 active:scale-95"
      >
        <FileText className="w-5 h-5 mr-2" />
        Descargar PDF
      </Button>
      
      <Button
        onClick={onResetApp}
        variant="outline"
        className="w-full bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-white text-gray-700 font-semibold py-4 rounded-xl shadow-lg transition-all duration-200 active:scale-95"
      >
        <RotateCcw className="w-5 h-5 mr-2" />
        Reiniciar
      </Button>
    </div>
  );
};

export default ActionButtons;
