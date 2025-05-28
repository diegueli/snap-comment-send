
import React from 'react';
import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';

interface BloqueosFormActionsProps {
  loading: boolean;
  isGeneratingEmail: boolean;
  onGenerateEmail: () => void;
  onClose: () => void;
}

const BloqueosFormActions: React.FC<BloqueosFormActionsProps> = ({
  loading,
  isGeneratingEmail,
  onGenerateEmail,
  onClose,
}) => {
  return (
    <div className="flex gap-4 pt-6 border-t border-gray-200">
      <Button 
        type="submit" 
        disabled={loading} 
        className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-semibold py-3 shadow-lg"
      >
        {loading ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            Guardando...
          </div>
        ) : (
          'Registrar Bloqueo'
        )}
      </Button>
      
      <Button
        type="button"
        onClick={onGenerateEmail}
        disabled={isGeneratingEmail}
        className="bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white font-semibold py-3 px-6 shadow-lg"
      >
        {isGeneratingEmail ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            Generando...
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Generar Correo
          </div>
        )}
      </Button>
      
      <Button 
        type="button" 
        variant="outline" 
        onClick={onClose}
        className="border-blue-300 text-blue-600 hover:bg-blue-50 px-8"
      >
        Cancelar
      </Button>
    </div>
  );
};

export default BloqueosFormActions;
