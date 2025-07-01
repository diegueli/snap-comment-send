
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { User, Mail, Briefcase, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import GerenciaSelect from '@/components/auth/GerenciaSelect';
import { validatePassword, getPasswordStrengthColor, getPasswordStrengthText } from '@/utils/passwordValidator';
import { createUserFriendlyError } from '@/utils/errorHandler';

const AuthForm = () => {
  const { signUp, signIn, loading } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    position: '',
    password: '',
    gerencia: '',
    gerencia_id: undefined as number | undefined
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Validar email
    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'El formato del email no es válido';
      }
    }

    // Validar contraseña
    if (!formData.password.trim()) {
      newErrors.password = 'La contraseña es requerida';
    } else if (isSignUp) {
      const passwordValidation = validatePassword(formData.password);
      if (!passwordValidation.isValid) {
        newErrors.password = passwordValidation.errors[0];
      }
    }

    // Validaciones específicas para registro
    if (isSignUp) {
      if (!formData.name.trim()) {
        newErrors.name = 'El nombre es requerido';
      }
      if (!formData.position.trim()) {
        newErrors.position = 'El cargo es requerido';
      }
      if (!formData.gerencia.trim()) {
        newErrors.gerencia = 'La gerencia es requerida';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    
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
    } catch (error: any) {
      const friendlyError = createUserFriendlyError(error);
      
      // Map specific errors to form fields
      if (error.message?.includes('Invalid login credentials')) {
        setErrors({ general: friendlyError.message });
      } else if (error.message?.includes('User already registered')) {
        setErrors({ email: friendlyError.message });
      } else if (error.message?.includes('Password should be at least')) {
        setErrors({ password: friendlyError.message });
      } else if (error.message?.includes('Invalid email')) {
        setErrors({ email: friendlyError.message });
      } else {
        setErrors({ general: friendlyError.message });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleGerenciaChange = (gerenciaNombre: string, gerenciaId?: number) => {
    setFormData(prev => ({
      ...prev,
      gerencia: gerenciaNombre,
      gerencia_id: gerenciaId
    }));
    
    // Limpiar error de gerencia
    if (errors.gerencia) {
      setErrors(prev => ({ ...prev, gerencia: '' }));
    }
  };

  const toggleAuthMode = () => {
    setIsSignUp(!isSignUp);
    setFormData({ 
      name: '', 
      email: '', 
      position: '', 
      password: '', 
      gerencia: '', 
      gerencia_id: undefined 
    });
    setErrors({});
  };

  // Get password strength for display
  const passwordValidation = isSignUp && formData.password ? validatePassword(formData.password) : null;

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
              {/* Error general */}
              {errors.general && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-red-600 text-sm">{errors.general}</p>
                </div>
              )}

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
                      className={`pl-10 border-gray-200 focus:border-red-500 ${
                        errors.name ? 'border-red-500' : ''
                      }`}
                      required={isSignUp}
                    />
                  </div>
                  {errors.name && (
                    <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                  )}
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
                    className={`pl-10 border-gray-200 focus:border-red-500 ${
                      errors.email ? 'border-red-500' : ''
                    }`}
                    required
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
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
                      className={`pl-10 border-gray-200 focus:border-red-500 ${
                        errors.position ? 'border-red-500' : ''
                      }`}
                      required={isSignUp}
                    />
                  </div>
                  {errors.position && (
                    <p className="text-red-500 text-xs mt-1">{errors.position}</p>
                  )}
                </div>
              )}

              {isSignUp && (
                <div className="space-y-2">
                  <GerenciaSelect
                    value={formData.gerencia}
                    onValueChange={handleGerenciaChange}
                  />
                  {errors.gerencia && (
                    <p className="text-red-500 text-xs mt-1">{errors.gerencia}</p>
                  )}
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
                    placeholder={isSignUp ? "Mínimo 8 caracteres" : "Ingrese su contraseña"}
                    value={formData.password}
                    onChange={handleInputChange('password')}
                    className={`pl-10 pr-10 border-gray-200 focus:border-red-500 ${
                      errors.password ? 'border-red-500' : ''
                    }`}
                    minLength={isSignUp ? 8 : undefined}
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
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                )}
                {isSignUp && passwordValidation && formData.password && (
                  <div className="mt-2">
                    <p className={`text-xs ${getPasswordStrengthColor(passwordValidation.strength)}`}>
                      Fortaleza: {getPasswordStrengthText(passwordValidation.strength)}
                    </p>
                    {!passwordValidation.isValid && (
                      <ul className="text-xs text-gray-600 mt-1 ml-4">
                        {passwordValidation.errors.map((error, index) => (
                          <li key={index} className="list-disc">{error}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
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
