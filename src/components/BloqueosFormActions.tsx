
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
    <div className="flex flex-col sm:flex-row gap-3 pt-4 sm:pt-6 border-t border-gray-200 w-full">
      <Button 
        type="submit" 
        disabled={loading} 
        className="flex-1 bg-gradient-to-r from-yellow-600 to-red-700 hover:from-yellow-700 hover:to-red-800 text-white font-semibold py-3 shadow-lg order-1"
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
        className="bg-gradient-to-r from-yellow-500 to-red-600 hover:from-yellow-600 hover:to-red-700 text-white font-semibold py-3 px-4 sm:px-6 shadow-lg order-2 sm:order-2"
      >
        {isGeneratingEmail ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span className="hidden sm:inline">Generando...</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            <span className="hidden sm:inline">Generar Correo</span>
            <span className="sm:hidden">Correo</span>
          </div>
        )}
      </Button>
      
      <Button 
        type="button" 
        variant="outline" 
        onClick={onClose}
        className="border-red-300 text-red-600 hover:bg-red-50 px-4 sm:px-6 order-3 whitespace-nowrap"
      >
        Cancelar
      </Button>
    </div>
  );
};

export default BloqueosFormActions;
