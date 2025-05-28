
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

  const generateBloqueoEmail = async (formData: BloqueoFormData, photos: CapturedPhoto[]) => {
    setIsGeneratingEmail(true);
    
    try {
      const subject = `BLOQUEO REPORTADO - ${formData.planta_nombre} | ${formData.area_nombre} | ${formData.producto_nombre} - ${formData.fecha}`;
      
      // Preparar el cuerpo del correo con las fotos embebidas
      let emailBody = `REPORTE DE BLOQUEO - QUINTA ALIMENTOS

INFORMACIÓN DEL BLOQUEO:
Planta: ${formData.planta_nombre}
Área: ${formData.area_nombre}  
Producto: ${formData.producto_nombre}
Cantidad: ${formData.cantidad}
Lote: ${formData.lote}
Turno: ${formData.turno_nombre}
Fecha: ${formData.fecha}
Usuario: ${formData.quien_bloqueo}

MOTIVO DEL BLOQUEO:
${formData.motivo}

`;

      // Agregar información sobre las fotos
      if (photos.length > 0) {
        emailBody += `EVIDENCIA FOTOGRÁFICA:
Se incluyen ${photos.length} fotografía(s) como evidencia del bloqueo.

`;
        
        // Agregar cada foto con su timestamp
        photos.forEach((photo, index) => {
          emailBody += `Foto ${index + 1}: Capturada el ${new Date(photo.timestamp).toLocaleString('es-ES')}
`;
        });
        emailBody += '\n';
      } else {
        emailBody += `EVIDENCIA FOTOGRÁFICA:
No se adjuntaron fotografías a este reporte de bloqueo.

`;
      }

      emailBody += `---
Generado automáticamente por el Sistema de Calidad de Quinta Alimentos
Fecha: ${new Date().toLocaleString('es-ES')}`;
      
      // Crear el enlace mailto con las fotos como attachments si el cliente de correo lo soporta
      const mailtoLink = `mailto:aherrera@quintasa.cl?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
      
      // Mostrar mensaje informativo
      toast({
        title: "Abriendo cliente de correo",
        description: `Se abrirá tu cliente de correo con toda la información${photos.length > 0 ? ` y ${photos.length} foto(s) para adjuntar manualmente` : ''}.`,
      });
      
      // Abrir cliente de correo
      window.open(mailtoLink);
      
      // Si hay fotos, crear archivos individuales para descarga
      if (photos.length > 0) {
        photos.forEach((photo, index) => {
          // Convertir dataURL a blob
          const arr = photo.dataUrl.split(',');
          const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
          const bstr = atob(arr[1]);
          let n = bstr.length;
          const u8arr = new Uint8Array(n);
          while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
          }
          const blob = new Blob([u8arr], { type: mime });
          
          // Crear enlace de descarga
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `Bloqueo_Evidencia_${index + 1}_${formData.planta_nombre}_${new Date().toISOString().split('T')[0]}.jpg`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        });
        
        toast({
          title: "Fotos descargadas",
          description: `Se descargaron ${photos.length} fotografía(s). Adjúntalas manualmente al correo que se abrió.`,
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
