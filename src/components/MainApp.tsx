
import React, { useState } from 'react';
import { Camera, Shield, FileSearch, ClipboardList, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import CameraApp from './CameraApp';
import BloqueosForm from './BloqueosForm';
import GestionAuditoriaForm from './GestionAuditoriaForm';
import ResumenAuditoriasForm from './resumen/ResumenAuditoriasForm';
import AuthForm from './AuthForm';
import { useAuth } from '@/contexts/AuthContext';

const MainApp = () => {
  const { user, profile, signOut, loading } = useAuth();
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isBloqueosOpen, setIsBloqueosOpen] = useState(false);
  const [isGestionOpen, setIsGestionOpen] = useState(false);
  const [isResumenOpen, setIsResumenOpen] = useState(false);
  const [isAuditoriasMenuOpen, setIsAuditoriasMenuOpen] = useState(false);

  // Show loading state while auth is initializing
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-red-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // Show auth form if user is not authenticated
  if (!user || !profile) {
    return <AuthForm />;
  }

  const handleLogout = async () => {
    await signOut();
    setIsCameraOpen(false);
    setIsBloqueosOpen(false);
    setIsGestionOpen(false);
    setIsResumenOpen(false);
    setIsAuditoriasMenuOpen(false);
  };

  // Convert profile to userData format for compatibility with CameraApp
  const userData = {
    name: profile.name,
    email: user.email || '',
    position: profile.position,
  };

  const handleAuditoriasMenuOpen = (open: boolean) => {
    setIsAuditoriasMenuOpen(open);
    if (!open) {
      setIsCameraOpen(false);
      setIsGestionOpen(false);
      setIsResumenOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-red-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header with Logo */}
        <Card className="mb-6 bg-white shadow-lg">
          <CardHeader className="text-center">
            <div className="flex justify-center items-center mb-4">
              <img 
                src="/lovable-uploads/9ad6adb6-f76a-4982-92e9-09618c309f7c.png" 
                alt="Quinta alimentos logo" 
                className="h-16 object-contain"
              />
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-yellow-500 to-red-600 bg-clip-text text-transparent">
              Quinta Alimentos
            </CardTitle>
            <p className="text-gray-600">
              Sistema de Auditoría
            </p>
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>Usuario:</strong> {profile.name}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Email:</strong> {user.email}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Cargo:</strong> {profile.position}
              </p>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="mt-2"
              >
                Cerrar Sesión
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Module Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {/* Auditorías Menu Button */}
          <Dialog open={isAuditoriasMenuOpen} onOpenChange={handleAuditoriasMenuOpen}>
            <DialogTrigger asChild>
              <Button 
                className="bg-gradient-to-r from-yellow-500 to-red-600 hover:from-yellow-600 hover:to-red-700 text-white px-8 py-4 text-lg font-semibold shadow-lg"
                size="lg"
              >
                <ClipboardList className="w-6 h-6 mr-3" />
                Auditorías
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md mx-auto p-6">
              <DialogHeader>
                <DialogTitle className="text-center text-xl mb-4">Módulos de Auditoría</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                {/* Ingresar Auditoría */}
                <Button
                  onClick={() => {
                    setIsAuditoriasMenuOpen(false);
                    setIsCameraOpen(true);
                  }}
                  className="w-full bg-gradient-to-r from-yellow-500 to-red-600 hover:from-yellow-600 hover:to-red-700 text-white py-3"
                >
                  <Camera className="w-5 h-5 mr-2" />
                  Ingresar Auditoría
                </Button>

                {/* Gestión Auditoría */}
                <Button
                  onClick={() => {
                    setIsAuditoriasMenuOpen(false);
                    setIsGestionOpen(true);
                  }}
                  className="w-full bg-gradient-to-r from-yellow-500 to-red-600 hover:from-yellow-600 hover:to-red-700 text-white py-3"
                >
                  <FileSearch className="w-5 h-5 mr-2" />
                  Gestión Auditoría
                </Button>

                {/* Resumen Auditorías */}
                <Button
                  onClick={() => {
                    setIsAuditoriasMenuOpen(false);
                    setIsResumenOpen(true);
                  }}
                  className="w-full bg-gradient-to-r from-yellow-500 to-red-600 hover:from-yellow-600 hover:to-red-700 text-white py-3"
                >
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Resumen Auditorías
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Bloqueos Button */}
          <Dialog open={isBloqueosOpen} onOpenChange={setIsBloqueosOpen}>
            <DialogTrigger asChild>
              <Button 
                className="bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white px-8 py-4 text-lg font-semibold shadow-lg"
                size="lg"
              >
                <Shield className="w-6 h-6 mr-3" />
                Bloqueos
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl mx-auto max-h-[90vh] overflow-hidden p-0">
              <div className="overflow-y-auto max-h-[90vh] p-6">
                <BloqueosForm onClose={() => setIsBloqueosOpen(false)} />
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Dialogs for Auditorías modules */}
        {/* Ingresar Auditoría Dialog */}
        <Dialog open={isCameraOpen} onOpenChange={setIsCameraOpen}>
          <DialogContent className="max-w-md mx-auto max-h-[90vh] overflow-y-auto p-0">
            <DialogHeader className="p-6 pb-0">
              <DialogTitle className="text-center">Ingresar Auditoría</DialogTitle>
            </DialogHeader>
            <div className="p-0">
              <CameraApp onClose={() => setIsCameraOpen(false)} userData={userData} />
            </div>
          </DialogContent>
        </Dialog>

        {/* Gestión Auditoría Dialog */}
        <Dialog open={isGestionOpen} onOpenChange={setIsGestionOpen}>
          <DialogContent className="max-w-6xl mx-auto max-h-[90vh] overflow-hidden p-0">
            <div className="overflow-y-auto max-h-[90vh]">
              <GestionAuditoriaForm onClose={() => setIsGestionOpen(false)} />
            </div>
          </DialogContent>
        </Dialog>

        {/* Resumen Auditorías Dialog */}
        <Dialog open={isResumenOpen} onOpenChange={setIsResumenOpen}>
          <DialogContent className="max-w-6xl mx-auto max-h-[90vh] overflow-hidden p-0">
            <div className="overflow-y-auto max-h-[90vh]">
              <ResumenAuditoriasForm onClose={() => setIsResumenOpen(false)} />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default MainApp;
