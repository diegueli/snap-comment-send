
import React from 'react';
import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';

interface BloqueosFormActionsProps {
  loading: boolean;
  emailLoading: boolean;
  onGenerateEmail: () => void;
  onClose: () => void;
}

const BloqueosFormActions: React.FC<BloqueosFormActionsProps> = ({
  loading,
  emailLoading,
  onGenerateEmail,
  onClose,
}) => {
  return (
    <div className="flex gap-3 pt-4 border-t border-gray-200">
      <Button 
        type="submit" 
        disabled={loading} 
        className="flex-1 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white font-medium h-10"
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
        disabled={emailLoading}
        className="bg-blue-500 hover:bg-blue-600 text-white font-medium h-10 px-6"
      >
        {emailLoading ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            Generando...
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Generar Correo
          </div>
        )}
      </Button>
      
      <Button 
        type="button" 
        variant="outline" 
        onClick={onClose}
        className="border-gray-300 text-gray-600 hover:bg-gray-50 px-6 h-10"
      >
        Cancelar
      </Button>
    </div>
  );
};

export default BloqueosFormActions;
