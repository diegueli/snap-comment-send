
import React from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';

interface FormHeaderProps {
  title: string;
  description: string;
  logoSrc?: string;
  logoAlt?: string;
}

const FormHeader: React.FC<FormHeaderProps> = ({ 
  title, 
  description, 
  logoSrc = "/lovable-uploads/9ad6adb6-f76a-4982-92e9-09618c309f7c.png",
  logoAlt = "Quinta alimentos logo"
}) => {
  return (
    <Card className="mb-6 bg-gradient-to-r from-red-50 to-orange-50 border-red-200">
      <CardHeader className="text-center pb-4">
        <div className="flex justify-center items-center mb-4">
          <img 
            src={logoSrc}
            alt={logoAlt}
            className="h-12 object-contain"
          />
        </div>
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent mb-2">
          {title}
        </CardTitle>
        <p className="text-gray-700 text-sm leading-relaxed max-w-2xl mx-auto">
          {description}
        </p>
      </CardHeader>
    </Card>
  );
};

export default FormHeader;
