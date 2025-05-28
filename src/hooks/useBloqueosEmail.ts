
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

interface BloqueosEmailData {
  planta: string;
  area: string;
  producto: string;
  cantidad: string;
  lote: string;
  turno: string;
  motivo: string;
  fecha: string;
  quien_bloqueo: string;
}

export const useBloqueosEmail = () => {
  const [loading, setLoading] = useState(false);

  const generateEmailBody = (data: BloqueosEmailData) => {
    return `
REPORTE DE BLOQUEO - QUINTA ALIMENTOS

Planta: ${data.planta}
Area de Planta: ${data.area}
Producto: ${data.producto}
Cantidad: ${data.cantidad}
Lote: ${data.lote}
Turno: ${data.turno}
Fecha: ${data.fecha}
Usuario que bloqueo: ${data.quien_bloqueo}

Motivo del Bloqueo:
${data.motivo}

Este reporte fue generado automaticamente por el Sistema de Auditoria de Quinta Alimentos.
    `.trim();
  };

  const sendEmail = async (data: BloqueosEmailData) => {
    setLoading(true);
    try {
      const subject = `Reporte de Bloqueo - ${data.producto} - ${data.fecha}`;
      const body = generateEmailBody(data);
      
      const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      
      window.open(mailtoLink, '_blank');
      
      toast({
        title: "Correo generado",
        description: "Se ha abierto tu cliente de correo con la información del bloqueo",
      });
    } catch (error: any) {
      console.error('Error generating email:', error);
      toast({
        title: "Error",
        description: "No se pudo generar el correo",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    sendEmail,
    loading,
  };
};
