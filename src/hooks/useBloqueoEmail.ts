
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
    const photosHtml = photos.map((photo, index) => `
      <div style="margin-bottom: 20px; text-align: center;">
        <h4 style="margin: 0 0 10px 0; color: #dc2626;">Evidencia ${index + 1}</h4>
        <img src="${photo.dataUrl}" alt="Evidencia ${index + 1}" style="max-width: 100%; height: auto; border: 2px solid #dc2626; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);" />
        <p style="margin: 5px 0 0 0; font-size: 12px; color: #6b7280;">Capturada: ${new Date(photo.timestamp).toLocaleString('es-ES')}</p>
      </div>
    `).join('');

    return `
      <div style="font-family: Arial, sans-serif; max-width: 100%; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
        <div style="background: linear-gradient(135deg, #dc2626 0%, #ea580c 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 32px; font-weight: bold;">REPORTE DE BLOQUEO</h1>
          <p style="margin: 15px 0 0 0; font-size: 18px; opacity: 0.95;">Quinta Alimentos - Sistema de Calidad</p>
          <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.8;">Fecha de generación: ${new Date().toLocaleString('es-ES')}</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Información General del Bloqueo -->
          <div style="background: linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%); padding: 25px; border-radius: 12px; margin-bottom: 30px; border-left: 6px solid #f59e0b;">
            <h2 style="margin: 0 0 20px 0; color: #92400e; font-size: 22px; display: flex; align-items: center;">
              INFORMACIÓN DEL BLOQUEO
            </h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">
              <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #f3f4f6;">
                <strong style="color: #92400e; display: block; margin-bottom: 5px;">Planta:</strong> 
                <span style="color: #451a03; font-size: 16px;">${formData.planta_nombre}</span>
              </div>
              <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #f3f4f6;">
                <strong style="color: #92400e; display: block; margin-bottom: 5px;">Área:</strong> 
                <span style="color: #451a03; font-size: 16px;">${formData.area_nombre}</span>
              </div>
              <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #f3f4f6;">
                <strong style="color: #92400e; display: block; margin-bottom: 5px;">Producto:</strong> 
                <span style="color: #451a03; font-size: 16px;">${formData.producto_nombre}</span>
              </div>
              <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #f3f4f6;">
                <strong style="color: #92400e; display: block; margin-bottom: 5px;">Cantidad:</strong> 
                <span style="color: #451a03; font-size: 16px;">${formData.cantidad}</span>
              </div>
              <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #f3f4f6;">
                <strong style="color: #92400e; display: block; margin-bottom: 5px;">Lote:</strong> 
                <span style="color: #451a03; font-size: 16px;">${formData.lote}</span>
              </div>
              <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #f3f4f6;">
                <strong style="color: #92400e; display: block; margin-bottom: 5px;">Turno:</strong> 
                <span style="color: #451a03; font-size: 16px;">${formData.turno_nombre}</span>
              </div>
              <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #f3f4f6;">
                <strong style="color: #92400e; display: block; margin-bottom: 5px;">Fecha:</strong> 
                <span style="color: #451a03; font-size: 16px;">${formData.fecha}</span>
              </div>
              <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #f3f4f6;">
                <strong style="color: #92400e; display: block; margin-bottom: 5px;">Usuario:</strong> 
                <span style="color: #451a03; font-size: 16px;">${formData.quien_bloqueo}</span>
              </div>
            </div>
          </div>
          
          <!-- Motivo del Bloqueo -->
          <div style="background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); padding: 25px; border-radius: 12px; margin-bottom: 30px; border-left: 6px solid #ef4444;">
            <h3 style="margin: 0 0 15px 0; color: #dc2626; font-size: 20px;">MOTIVO DEL BLOQUEO</h3>
            <div style="background: white; padding: 20px; border-radius: 8px; border: 2px solid #fca5a5;">
              <p style="margin: 0; color: #7f1d1d; line-height: 1.6; font-size: 16px; white-space: pre-wrap;">${formData.motivo}</p>
            </div>
          </div>
          
          <!-- Evidencia Fotográfica -->
          ${photos.length > 0 ? `
          <div style="background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%); padding: 25px; border-radius: 12px; border-left: 6px solid #0ea5e9; margin-bottom: 30px;">
            <h3 style="margin: 0 0 20px 0; color: #0c4a6e; font-size: 20px;">EVIDENCIA FOTOGRÁFICA</h3>
            <p style="margin: 0 0 15px 0; color: #164e63; font-size: 16px;">
              Se han capturado <strong>${photos.length} fotografía(s)</strong> como evidencia del bloqueo.
            </p>
            ${photosHtml}
          </div>
          ` : `
          <div style="background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); padding: 25px; border-radius: 12px; border-left: 6px solid #6b7280; margin-bottom: 30px;">
            <h3 style="margin: 0 0 15px 0; color: #374151; font-size: 20px;">EVIDENCIA FOTOGRÁFICA</h3>
            <p style="margin: 0; color: #6b7280; font-size: 16px;">No se adjuntaron fotografías a este reporte de bloqueo.</p>
          </div>
          `}
          
          <!-- Información Adicional -->
          <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); padding: 20px; border-radius: 12px; border-left: 6px solid #0284c7;">
            <h4 style="margin: 0 0 15px 0; color: #0c4a6e; font-size: 16px;">INFORMACIÓN ADICIONAL</h4>
            <div style="color: #164e63; font-size: 14px; line-height: 1.5;">
              <p style="margin: 0 0 8px 0;">• Este bloqueo requiere seguimiento inmediato según los protocolos de calidad.</p>
              <p style="margin: 0 0 8px 0;">• Contactar al responsable del área para acciones correctivas.</p>
              <p style="margin: 0;">• Documentar todas las acciones tomadas en el sistema de gestión de calidad.</p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="margin-top: 40px; padding-top: 25px; border-top: 3px solid #e5e7eb; text-align: center; background: #f9fafb; border-radius: 8px; padding: 25px;">
            <div style="color: #6b7280; font-size: 14px; line-height: 1.6;">
              <p style="margin: 0 0 8px 0; font-weight: bold;">Quinta Alimentos - Sistema de Gestión de Calidad</p>
              <p style="margin: 0 0 8px 0;">Este correo fue generado automáticamente por el sistema de auditoría</p>
              <p style="margin: 0; font-style: italic;">Para consultas contactar al departamento de calidad</p>
            </div>
          </div>
        </div>
      </div>
    `;
  };

  const generateBloqueoEmail = async (formData: BloqueoFormData, photos: CapturedPhoto[]) => {
    setIsGeneratingEmail(true);
    
    try {
      const subject = `BLOQUEO REPORTADO - ${formData.planta_nombre} | ${formData.area_nombre} | ${formData.producto_nombre} - ${formData.fecha}`;
      const emailContent = generateEmailContent(formData, photos);
      
      // Preparar el cuerpo del correo con información completa
      const emailBodyText = `
REPORTE DE BLOQUEO - QUINTA ALIMENTOS

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

${photos.length > 0 ? `EVIDENCIA FOTOGRÁFICA: ${photos.length} foto(s) incluida(s) en el correo HTML` : 'No se adjuntaron fotografías'}

---
Este correo incluye un archivo HTML con el formato completo del reporte y las fotografías embebidas.
Generado automáticamente por el Sistema de Calidad de Quinta Alimentos
Fecha: ${new Date().toLocaleString('es-ES')}
      `;
      
      // Crear el enlace mailto con el cuerpo completo
      const mailtoLink = `mailto:aherrera@quintasa.cl?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBodyText)}`;
      
      // Mostrar mensaje informativo
      toast({
        title: "Generando correo electrónico",
        description: `Se abrirá tu cliente de correo con toda la información${photos.length > 0 ? ` y ${photos.length} foto(s) incluidas` : ''}.`,
      });
      
      // Abrir cliente de correo
      window.open(mailtoLink);
      
      // Crear y descargar el contenido HTML del correo
      const htmlBlob = new Blob([emailContent], { type: 'text/html;charset=utf-8' });
      const htmlUrl = URL.createObjectURL(htmlBlob);
      const htmlLink = document.createElement('a');
      htmlLink.href = htmlUrl;
      htmlLink.download = `Bloqueo_${formData.planta_nombre}_${formData.area_nombre}_${formData.producto_nombre}_${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(htmlLink);
      htmlLink.click();
      document.body.removeChild(htmlLink);
      URL.revokeObjectURL(htmlUrl);
      
      toast({
        title: "Reporte generado correctamente",
        description: `Se descargó el reporte HTML${photos.length > 0 ? ` con ${photos.length} fotografía(s) embebidas` : ''}. Adjúntalo al correo que se abrió.`,
      });
      
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
