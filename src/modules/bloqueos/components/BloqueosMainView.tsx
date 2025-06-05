
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, List, BarChart3 } from 'lucide-react';
import BloqueosForm from './BloqueosForm';

interface BloqueosMainViewProps {
  onClose: () => void;
}

const BloqueosMainView: React.FC<BloqueosMainViewProps> = ({ onClose }) => {
  const [activeView, setActiveView] = useState<string | null>(null);

  const handleViewChange = (view: string) => {
    setActiveView(view);
  };

  if (activeView === 'ingresar') {
    return (
      <BloqueosForm onClose={onClose} />
    );
  }

  return (
    <div className="bg-gradient-to-br from-red-50 to-orange-50 min-h-screen">
      <div className="max-w-6xl mx-auto p-4">
        {/* Header */}
        <Card className="bg-white/95 backdrop-blur-sm shadow-xl border-red-200 mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={onClose}
                className="text-red-600 hover:bg-red-100"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver al Menú Principal
              </Button>
              <div className="text-center flex-1">
                <img 
                  src="/lovable-uploads/9ad6adb6-f76a-4982-92e9-09618c309f7c.png" 
                  alt="Quinta alimentos logo" 
                  className="h-12 object-contain mx-auto mb-2"
                />
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                  Módulo de Bloqueos
                </CardTitle>
                <p className="text-gray-600 mt-2">
                  Sistema de Gestión de Bloqueos de Productos
                </p>
              </div>
              <div className="w-24"></div>
            </div>
          </CardHeader>
        </Card>

        {/* Menu Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card 
            className="cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-lg border-2 border-transparent hover:border-red-300 group"
            onClick={() => handleViewChange('ingresar')}
          >
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-red-500 to-orange-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Ingresar Bloqueo
              </h3>
              <p className="text-gray-600 text-sm">
                Registrar nuevo bloqueo de producto con evidencia fotográfica
              </p>
            </CardContent>
          </Card>

          <Card className="opacity-50">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-red-500 to-orange-600 rounded-full flex items-center justify-center">
                <List className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Gestión de Bloqueos
              </h3>
              <p className="text-gray-600 text-sm">
                Administrar y dar seguimiento a bloqueos existentes
              </p>
              <p className="text-xs text-red-500 mt-2">Próximamente</p>
            </CardContent>
          </Card>

          <Card className="opacity-50">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-red-500 to-orange-600 rounded-full flex items-center justify-center">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Reportes
              </h3>
              <p className="text-gray-600 text-sm">
                Generar reportes y estadísticas de bloqueos
              </p>
              <p className="text-xs text-red-500 mt-2">Próximamente</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BloqueosMainView;
