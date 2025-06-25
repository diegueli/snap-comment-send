import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { User, Mail, Briefcase, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const AuthForm = () => {
  const { signUp, signIn, loading } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    position: '',
    password: '',
    gerencia_id: undefined as number | undefined
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.email.trim() || !formData.password.trim()) {
      return;
    }

    if (isSignUp && (!formData.name.trim() || !formData.position.trim())) {
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      if (isSignUp) {
        await signUp(formData.email, formData.password, {
          name: formData.name,
          position: formData.position,
          gerencia_id: formData.gerencia_id
        });
      } else {
        await signIn(formData.email, formData.password);
      }
    } catch (error) {
      // Error handling is done in the auth context
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const handleGerenciaChange = (gerenciaId: number) => {
    setFormData(prev => ({
      ...prev,
      gerencia_id: gerenciaId
    }));
  };

  const toggleAuthMode = () => {
    setIsSignUp(!isSignUp);
    setFormData({ name: '', email: '', position: '', password: '', gerencia_id: undefined });
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-red-50 p-4 flex items-center justify-center">
      <div className="max-w-md w-full">
        {/* Header with Logo */}
        <Card className="mb-6 bg-white shadow-lg">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center items-center mb-4">
              <img 
                src="/lovable-uploads/9ad6adb6-f76a-4982-92e9-09618c309f7c.png" 
                alt="Quinta alimentos logo" 
                className="h-16 object-contain"
              />
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-yellow-500 to-red-600 bg-clip-text text-transparent mb-2">
              Quinta Alimentos
            </CardTitle>
            <p className="text-gray-600 text-center">
              Sistema de Auditoría
            </p>
          </CardHeader>
        </Card>

        {/* Authentication Form */}
        <Card className="bg-white shadow-lg">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl text-gray-800 mb-2">
              {isSignUp ? 'Crear Cuenta' : 'Iniciar Sesión'}
            </CardTitle>
            <p className="text-sm text-gray-600">
              {isSignUp 
                ? 'Crea tu cuenta para acceder al sistema'
                : 'Ingresa tus credenciales para acceder al sistema'
              }
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-700">
                    Nombre Completo
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Ingrese su nombre completo"
                      value={formData.name}
                      onChange={handleInputChange('name')}
                      className="pl-10 border-gray-200 focus:border-red-500"
                      required={isSignUp}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700">
                  Email Corporativo
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="nombre@quintaalimentos.com"
                    value={formData.email}
                    onChange={handleInputChange('email')}
                    className="pl-10 border-gray-200 focus:border-red-500"
                    required
                  />
                </div>
              </div>

              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="position" className="text-gray-700">
                    Cargo en la Empresa
                  </Label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="position"
                      type="text"
                      placeholder="Ej: Supervisor de Calidad"
                      value={formData.position}
                      onChange={handleInputChange('position')}
                      className="pl-10 border-gray-200 focus:border-red-500"
                      required={isSignUp}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700">
                  Contraseña
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={isSignUp ? "Mínimo 6 caracteres" : "Ingrese su contraseña"}
                    value={formData.password}
                    onChange={handleInputChange('password')}
                    className="pl-10 pr-10 border-gray-200 focus:border-red-500"
                    minLength={isSignUp ? 6 : undefined}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-yellow-500 to-red-600 hover:from-yellow-600 hover:to-red-700 text-white py-2 mt-6"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {isSignUp ? 'Creando cuenta...' : 'Iniciando sesión...'}
                  </div>
                ) : (
                  isSignUp ? 'Crear Cuenta' : 'Iniciar Sesión'
                )}
              </Button>

              <div className="text-center pt-4">
                <button
                  type="button"
                  onClick={toggleAuthMode}
                  className="text-sm text-red-600 hover:text-red-700 underline"
                >
                  {isSignUp 
                    ? '¿Ya tienes cuenta? Inicia sesión'
                    : '¿No tienes cuenta? Crear cuenta'
                  }
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthForm;
