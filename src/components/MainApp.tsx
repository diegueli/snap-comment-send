
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import AuditoriaMainView from '@/modules/auditorias/components/AuditoriaMainView';
import BloqueosMainView from '@/modules/bloqueos/components/BloqueosMainView';
import { FileText, Settings, LogOut } from 'lucide-react';

const MainApp: React.FC = () => {
  const { profile, signOut } = useAuth();
  const [activeModule, setActiveModule] = useState<string | null>(null);

  const handleSignOut = async () => {
    await signOut();
  };

  const handleModuleClick = (module: string) => {
    setActiveModule(module);
  };

  const handleCloseModule = () => {
    setActiveModule(null);
  };

  if (activeModule === 'auditorias') {
    return (
      <AuditoriaMainView 
        onClose={handleCloseModule}
        userProfile={profile}
      />
    );
  }

  if (activeModule === 'bloqueos') {
    return <BloqueosMainView onClose={handleCloseModule} />;
  }

  return (
    <div className="bg-gradient-to-br from-yellow-400 via-red-500 to-orange-600 min-h-screen flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="bg-white/95 backdrop-blur-sm shadow-2xl">
          <CardHeader>
            <div className="text-center mb-6">
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-red-600 bg-clip-text text-transparent mb-2">
                Quinta Alimentos
              </CardTitle>
              <p className="text-gray-600 text-lg">
                Sistema de Gestión de Calidad
              </p>
            </div>
            
            <div className="flex justify-center mb-6">
              <Button
                onClick={handleSignOut}
                variant="outline"
                size="sm"
                className="border-red-200 text-red-600 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar Sesión
              </Button>
            </div>
            
            {profile && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Usuario</label>
                    <p className="text-gray-800">{profile.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Cargo</label>
                    <p className="text-gray-800">{profile.position}</p>
                  </div>
                </div>
              </div>
            )}
          </CardHeader>
          
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card 
                className="cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-lg border-2 border-transparent hover:border-yellow-300 group"
                onClick={() => handleModuleClick('auditorias')}
              >
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-yellow-500 to-red-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                    <FileText className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    Auditorías
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Gestión completa de auditorías: ingresar, gestionar y generar reportes
                  </p>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-lg border-2 border-transparent hover:border-yellow-300 group"
                onClick={() => handleModuleClick('bloqueos')}
              >
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-yellow-500 to-red-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                    <Settings className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    Bloqueos
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Registro y seguimiento de bloqueos de productos
                  </p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MainApp;
