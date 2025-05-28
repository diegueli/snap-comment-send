
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

interface CapturedPhoto {
  id: string;
  dataUrl: string;
  timestamp: Date;
}

interface BloqueoFormData {
  planta_nombre: string;
  area_nombre: string;
  producto_nombre: string;
  cantidad: string;
  lote: string;
  turno_nombre: string;
  motivo: string;
  fecha: string;
  quien_bloqueo: string;
}

export const useBloqueoEmail = () => {
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);

  const dataUrlToBlob = (dataUrl: string): Blob => {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  const generateEmailContent = (formData: BloqueoFormData, photos: CapturedPhoto[]): string => {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
        <div style="background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; font-weight: bold;">🛡️ REPORTE DE BLOQUEO</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Quinta Alimentos - Sistema de Calidad</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="background: linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%); padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #f59e0b;">
            <h2 style="margin: 0 0 15px 0; color: #92400e; font-size: 18px;">📋 INFORMACIÓN DEL BLOQUEO</h2>
            <div style="display: grid; gap: 12px;">
              <div><strong style="color: #92400e;">Planta:</strong> <span style="color: #451a03;">${formData.planta_nombre}</span></div>
              <div><strong style="color: #92400e;">Área:</strong> <span style="color: #451a03;">${formData.area_nombre}</span></div>
              <div><strong style="color: #92400e;">Producto:</strong> <span style="color: #451a03;">${formData.producto_nombre}</span></div>
              <div><strong style="color: #92400e;">Cantidad:</strong> <span style="color: #451a03;">${formData.cantidad}</span></div>
              <div><strong style="color: #92400e;">Lote:</strong> <span style="color: #451a03;">${formData.lote}</span></div>
              <div><strong style="color: #92400e;">Turno:</strong> <span style="color: #451a03;">${formData.turno_nombre}</span></div>
              <div><strong style="color: #92400e;">Fecha:</strong> <span style="color: #451a03;">${formData.fecha}</span></div>
              <div><strong style="color: #92400e;">Usuario:</strong> <span style="color: #451a03;">${formData.quien_bloqueo}</span></div>
            </div>
          </div>
          
          <div style="background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #ef4444;">
            <h3 style="margin: 0 0 10px 0; color: #dc2626; font-size: 16px;">🚨 MOTIVO DEL BLOQUEO</h3>
            <p style="margin: 0; color: #7f1d1d; line-height: 1.6; background: white; padding: 15px; border-radius: 6px; border: 1px solid #fca5a5;">${formData.motivo}</p>
          </div>
          
          ${photos.length > 0 ? `
          <div style="background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%); padding: 20px; border-radius: 8px; border-left: 4px solid #0ea5e9;">
            <h3 style="margin: 0 0 15px 0; color: #0c4a6e; font-size: 16px;">📸 EVIDENCIA FOTOGRÁFICA</h3>
            <p style="margin: 0; color: #164e63;">Se han adjuntado ${photos.length} foto(s) como evidencia del bloqueo.</p>
          </div>
          ` : ''}
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px;">
            <p style="margin: 0;">Este correo fue generado automáticamente por el Sistema de Calidad de Quinta Alimentos</p>
            <p style="margin: 5px 0 0 0;">Fecha de generación: ${new Date().toLocaleString('es-ES')}</p>
          </div>
        </div>
      </div>
    `;
  };

  const generateBloqueoEmail = async (formData: BloqueoFormData, photos: CapturedPhoto[]) => {
    setIsGeneratingEmail(true);
    
    try {
      const subject = `Bloqueo ${formData.planta_nombre} ${formData.area_nombre} ${formData.producto_nombre}`;
      const emailContent = generateEmailContent(formData, photos);
      
      // Crear el enlace mailto
      const mailtoLink = `mailto:aherrera@quintasa.cl?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent('Ver contenido HTML adjunto')}`;
      
      // Si hay fotos, mostrar mensaje sobre adjuntos
      if (photos.length > 0) {
        toast({
          title: "Correo preparado",
          description: `Se abrirá tu cliente de correo. Las ${photos.length} foto(s) deben adjuntarse manualmente.`,
        });
      }
      
      // Abrir cliente de correo
      window.open(mailtoLink);
      
      // Crear y descargar el contenido HTML del correo
      const blob = new Blob([emailContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Bloqueo_${formData.planta_nombre}_${formData.area_nombre}_${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      // Si hay fotos, también descargarlas
      if (photos.length > 0) {
        photos.forEach((photo, index) => {
          const blob = dataUrlToBlob(photo.dataUrl);
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `Evidencia_Bloqueo_${index + 1}_${new Date().toISOString().split('T')[0]}.jpg`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        });
        
        toast({
          title: "Archivos descargados",
          description: `Se descargaron el contenido HTML y ${photos.length} foto(s). Adjúntalos manualmente al correo.`,
        });
      }
      
    } catch (error) {
      console.error('Error generating email:', error);
      toast({
        title: "Error",
        description: "No se pudo generar el correo electrónico",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingEmail(false);
    }
  };

  return {
    generateBloqueoEmail,
    isGeneratingEmail,
  };
};
