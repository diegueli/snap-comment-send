
import React, { useState } from 'react';
import { Camera, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import CameraApp from './CameraApp';
import BloqueosForm from './BloqueosForm';
import AuthForm from './AuthForm';
import { useAuth } from '@/contexts/AuthContext';

const MainApp = () => {
  const { user, profile, signOut, loading } = useAuth();
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isBloqueosOpen, setIsBloqueosOpen] = useState(false);

  // Check if we're on mobile
  const isMobile = window.innerWidth < 768;

  // Show loading state while auth is initializing
  if (loading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-yellow-50 to-red-50 p-4 flex items-center justify-center">
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
  };

  // Convert profile to userData format for compatibility with CameraApp
  const userData = {
    name: profile.name,
    email: user.email || '',
    position: profile.position,
  };

  const DialogOrDrawer = isMobile ? Drawer : Dialog;
  const ContentComponent = isMobile ? DrawerContent : DialogContent;

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-yellow-50 to-red-50 p-2 sm:p-4">
      <div className="w-full max-w-full mx-auto px-2 sm:px-4">
        {/* Header with Logo */}
        <Card className="mb-4 sm:mb-6 bg-white shadow-lg w-full">
          <CardHeader className="text-center p-4 sm:p-6">
            <div className="flex justify-center items-center mb-4">
              <img 
                src="/lovable-uploads/9ad6adb6-f76a-4982-92e9-09618c309f7c.png" 
                alt="Quinta alimentos logo" 
                className="h-12 sm:h-16 object-contain"
              />
            </div>
            <CardTitle className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-yellow-500 to-red-600 bg-clip-text text-transparent">
              Quinta Alimentos
            </CardTitle>
            <p className="text-gray-600 text-sm sm:text-base">
              Sistema de Auditoría
            </p>
            <div className="mt-4 p-3 bg-gray-50 rounded-lg text-left w-full">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs sm:text-sm">
                <div>
                  <strong className="text-gray-700">Usuario:</strong>
                  <p className="text-gray-600 truncate">{profile.name}</p>
                </div>
                <div>
                  <strong className="text-gray-700">Email:</strong>
                  <p className="text-gray-600 truncate">{user.email}</p>
                </div>
                <div>
                  <strong className="text-gray-700">Cargo:</strong>
                  <p className="text-gray-600 truncate">{profile.position}</p>
                </div>
              </div>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="mt-3 w-full sm:w-auto"
              >
                Cerrar Sesión
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Module Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center w-full">
          {/* Auditoria Button */}
          <DialogOrDrawer open={isCameraOpen} onOpenChange={setIsCameraOpen}>
            <Button 
              onClick={() => setIsCameraOpen(true)}
              className="bg-gradient-to-r from-yellow-500 to-red-600 hover:from-yellow-600 hover:to-red-700 text-white px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold shadow-lg w-full sm:w-auto"
              size="lg"
            >
              <Camera className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
              Auditoría
            </Button>
            <ContentComponent className={isMobile ? "h-[90vh] w-full" : "max-w-md mx-auto max-h-[90vh] overflow-y-auto p-0 w-full"}>
              <div className="p-0 h-full w-full">
                <CameraApp onClose={() => setIsCameraOpen(false)} userData={userData} />
              </div>
            </ContentComponent>
          </DialogOrDrawer>

          {/* Bloqueos Button */}
          <DialogOrDrawer open={isBloqueosOpen} onOpenChange={setIsBloqueosOpen}>
            <Button 
              onClick={() => setIsBloqueosOpen(true)}
              className="bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold shadow-lg w-full sm:w-auto"
              size="lg"
            >
              <Shield className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
              Bloqueos
            </Button>
            <ContentComponent className={isMobile ? "h-[95vh] p-0 w-full" : "max-w-full mx-auto max-h-[95vh] overflow-hidden p-0 w-[90vw]"}>
              <div className="h-full w-full">
                <BloqueosForm onClose={() => setIsBloqueosOpen(false)} />
              </div>
            </ContentComponent>
          </DialogOrDrawer>
        </div>
      </div>
    </div>
  );
};

export default MainApp;
