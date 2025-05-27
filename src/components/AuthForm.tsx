
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { User, Mail, Briefcase } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface AuthData {
  name: string;
  email: string;
  position: string;
}

interface AuthFormProps {
  onAuthenticate: (userData: AuthData) => void;
}

const AuthForm = ({ onAuthenticate }: AuthFormProps) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    position: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name.trim() || !formData.email.trim() || !formData.position.trim()) {
      toast({
        title: "Campos incompletos",
        description: "Por favor complete todos los campos.",
        variant: "destructive",
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Email inválido",
        description: "Por favor ingrese un email válido.",
        variant: "destructive",
      });
      return;
    }

    onAuthenticate(formData);
    toast({
      title: "Autenticación exitosa",
      description: `Bienvenido ${formData.name}!`,
    });
  };

  const handleInputChange = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-red-50 p-4 flex items-center justify-center">
      <div className="max-w-md w-full">
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
          </CardHeader>
        </Card>

        {/* Authentication Form */}
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl text-center text-gray-800">
              Iniciar Sesión
            </CardTitle>
            <p className="text-sm text-gray-600 text-center">
              Por favor ingrese sus datos para acceder al sistema
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                  />
                </div>
              </div>

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
                  />
                </div>
              </div>

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
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-yellow-500 to-red-600 hover:from-yellow-600 hover:to-red-700 text-white py-2 mt-6"
              >
                Acceder al Sistema
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthForm;
