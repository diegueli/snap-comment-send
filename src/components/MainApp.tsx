
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import AuditoriaForm from './AuditoriaForm';
import BloqueosForm from './BloqueosForm';
import GestionAuditoriaForm from './GestionAuditoriaForm';
import ResumenAuditoriasForm from './resumen/ResumenAuditoriasForm';
import { Camera, FileText, ClipboardCheck, BarChart3, Settings, LogOut } from 'lucide-react';

const MainApp: React.FC = () => {
  const { user, profile, signOut } = useAuth();
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [showAuditoriaMenu, setShowAuditoriaMenu] = useState(false);

  const handleSignOut = async () => {
    await signOut();
  };

  const handleModuleClick = (module: string) => {
    if (module === 'auditorias') {
      setShowAuditoriaMenu(true);
      setActiveModule(null);
    } else {
      setActiveModule(module);
      setShowAuditoriaMenu(false);
    }
  };

  const handleAuditoriaSubmodule = (submodule: string) => {
    setActiveModule(submodule);
    setShowAuditoriaMenu(false);
  };

  const handleCloseModule = () => {
    setActiveModule(null);
    setShowAuditoriaMenu(false);
  };

  if (activeModule === 'ingresar-auditoria') {
    return <AuditoriaForm onClose={handleCloseModule} />;
  }

  if (activeModule === 'gestion-auditoria') {
    return <GestionAuditoriaForm onClose={handleCloseModule} />;
  }

  if (activeModule === 'resumen-auditorias') {
    return <ResumenAuditoriasForm onClose={handleCloseModule} />;
  }

  if (activeModule === 'bloqueos') {
    return <BloqueosForm onClose={handleCloseModule} />;
  }

  if (showAuditoriaMenu) {
    return (
      <div className="bg-gradient-to-br from-yellow-400 via-red-500 to-orange-600 min-h-screen flex items-center justify-center p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-white/95 backdrop-blur-sm shadow-2xl">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-red-600 bg-clip-text text-transparent">
                Módulos de Auditorías
              </CardTitle>
              <p className="text-gray-600 mt-2">
                Seleccione el módulo de auditorías que desea utilizar
              </p>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card 
                  className="cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-lg border-2 border-transparent hover:border-yellow-300"
                  onClick={() => handleAuditoriaSubmodule('ingresar-auditoria')}
                >
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-yellow-500 to-red-600 rounded-full flex items-center justify-center">
                      <Camera className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                      Ingresar Auditoría
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Capturar fotografías y documentar levantamientos de auditoría
                    </p>
                  </CardContent>
                </Card>

                <Card 
                  className="cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-lg border-2 border-transparent hover:border-yellow-300"
                  onClick={() => handleAuditoriaSubmodule('gestion-auditoria')}
                >
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-yellow-500 to-red-600 rounded-full flex items-center justify-center">
                      <ClipboardCheck className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                      Gestión Auditoría
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Responder y gestionar observaciones de auditorías
                    </p>
                  </CardContent>
                </Card>

                <Card 
                  className="cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-lg border-2 border-transparent hover:border-yellow-300"
                  onClick={() => handleAuditoriaSubmodule('resumen-auditorias')}
                >
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-yellow-500 to-red-600 rounded-full flex items-center justify-center">
                      <BarChart3 className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                      Resumen Auditorías
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Visualizar y generar reportes de auditorías completadas
                    </p>
                    <div className="mt-2">
                      <span className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                        Solo Calidad
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-center mt-8">
                <Button
                  onClick={handleCloseModule}
                  variant="outline"
                  className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                >
                  Volver al Menú Principal
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-yellow-400 via-red-500 to-orange-600 min-h-screen flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="bg-white/95 backdrop-blur-sm shadow-2xl">
          <CardHeader className="text-center">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-red-600 bg-clip-text text-transparent">
                  Quinta Alimentos
                </CardTitle>
                <p className="text-gray-600 mt-2">
                  Sistema de Gestión de Calidad
                </p>
              </div>
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
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
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
                className="cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-lg border-2 border-transparent hover:border-yellow-300"
                onClick={() => handleModuleClick('auditorias')}
              >
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-yellow-500 to-red-600 rounded-full flex items-center justify-center">
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
                className="cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-lg border-2 border-transparent hover:border-yellow-300"
                onClick={() => handleModuleClick('bloqueos')}
              >
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-yellow-500 to-red-600 rounded-full flex items-center justify-center">
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
