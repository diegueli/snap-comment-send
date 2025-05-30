
import React, { useState } from 'react';
import { Camera, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import CameraApp from './CameraApp';
import BloqueosForm from './BloqueosForm';
import AuthForm from './AuthForm';
import { useAuth } from '@/contexts/AuthContext';

const MainApp = () => {
  const { user, profile, signOut, loading } = useAuth();
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isBloqueosOpen, setIsBloqueosOpen] = useState(false);

  // Show loading state while auth is initializing
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-red-50 flex items-center justify-center p-4">
        <div className="text-center animate-fade-in">
          <div className="w-16 h-16 gradient-bg rounded-full flex items-center justify-center mb-4 mx-auto animate-pulse">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-600 font-medium">Cargando...</p>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-red-50">
      {/* Header Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 gradient-bg rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-red-500 rounded-full opacity-10 blur-3xl"></div>
      </div>
      
      <div className="relative z-10 max-w-4xl mx-auto p-6">
        {/* Header with Logo */}
        <Card className="mb-8 card-instagram animate-fade-in">
          <CardHeader className="text-center py-8">
            <div className="flex justify-center items-center mb-6">
              <div className="relative">
                <img 
                  src="/lovable-uploads/9ad6adb6-f76a-4982-92e9-09618c309f7c.png" 
                  alt="Quinta alimentos logo" 
                  className="h-20 object-contain drop-shadow-lg"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20 rounded"></div>
              </div>
            </div>
            <CardTitle className="text-4xl font-bold gradient-bg bg-clip-text text-transparent mb-2">
              Quinta Alimentos
            </CardTitle>
            <p className="text-gray-600 text-lg font-medium">
              Sistema de Auditoría
            </p>
            
            {/* User Info Card */}
            <div className="mt-6 mx-auto max-w-md">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6 shadow-inner">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Usuario:</span>
                    <span className="text-sm font-semibold text-gray-800">{profile.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Email:</span>
                    <span className="text-sm font-semibold text-gray-800">{user.email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Cargo:</span>
                    <span className="text-sm font-semibold text-gray-800">{profile.position}</span>
                  </div>
                  <div className="pt-2 border-t border-gray-200">
                    <Button
                      onClick={handleLogout}
                      variant="outline"
                      size="sm"
                      className="w-full text-gray-600 border-gray-300 hover:bg-gray-100 rounded-xl"
                    >
                      Cerrar Sesión
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Module Buttons */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center animate-slide-up">
          {/* Auditoria Button */}
          <Dialog open={isCameraOpen} onOpenChange={setIsCameraOpen}>
            <DialogTrigger asChild>
              <div className="group cursor-pointer">
                <div className="relative overflow-hidden rounded-2xl shadow-instagram hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                  <div className="gradient-bg p-8 text-white relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                    <div className="relative z-10 text-center">
                      <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                        <Camera className="w-8 h-8" />
                      </div>
                      <h3 className="text-xl font-bold mb-2">Auditoría</h3>
                      <p className="text-white/90 text-sm">Sistema de captura fotográfica</p>
                    </div>
                  </div>
                </div>
              </div>
            </DialogTrigger>
            <DialogContent className="max-w-md mx-auto max-h-[90vh] overflow-y-auto p-0 border-0 shadow-2xl">
              <DialogHeader className="p-6 pb-0">
                <DialogTitle className="text-center text-xl font-bold">Auditoría</DialogTitle>
              </DialogHeader>
              <div className="p-0">
                <CameraApp onClose={() => setIsCameraOpen(false)} userData={userData} />
              </div>
            </DialogContent>
          </Dialog>

          {/* Bloqueos Button */}
          <Dialog open={isBloqueosOpen} onOpenChange={setIsBloqueosOpen}>
            <DialogTrigger asChild>
              <div className="group cursor-pointer">
                <div className="relative overflow-hidden rounded-2xl shadow-instagram hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                  <div className="bg-gradient-to-br from-red-500 to-orange-600 p-8 text-white relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                    <div className="relative z-10 text-center">
                      <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                        <Shield className="w-8 h-8" />
                      </div>
                      <h3 className="text-xl font-bold mb-2">Bloqueos</h3>
                      <p className="text-white/90 text-sm">Sistema de control de bloqueos</p>
                    </div>
                  </div>
                </div>
              </div>
            </DialogTrigger>
            <DialogContent className="max-w-6xl mx-auto max-h-[90vh] overflow-hidden p-0 border-0 shadow-2xl">
              <div className="overflow-y-auto max-h-[90vh] p-6">
                <BloqueosForm onClose={() => setIsBloqueosOpen(false)} />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default MainApp;
