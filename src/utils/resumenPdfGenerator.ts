
import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface AuditoriaInfo {
  codigo_auditoria: string;
  titulo_documento: string;
  fecha: string;
  auditor: string;
  planta_nombre: string;
  status: string;
}

interface AuditoriaSet {
  id: string;
  area: string;
  levantamiento: string;
  responsable: string;
  foto_urls: string[];
  evidencia_foto_url?: string;
  fecha_compromiso?: string;
}

export const generateResumenPDF = async (auditoriaInfo: AuditoriaInfo, sets: AuditoriaSet[]) => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.width;
  const pageHeight = pdf.internal.pageSize.height;
  const margin = 20;
  let yPosition = margin;

  // Intentar cargar el logo
  try {
    const logoResponse = await fetch('/lovable-uploads/9ad6adb6-f76a-4982-92e9-09618c309f7c.png');
    if (logoResponse.ok) {
      const logoBlob = await logoResponse.blob();
      const logoBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(logoBlob);
      });
      pdf.addImage(logoBase64, 'PNG', margin, yPosition, 40, 20);
      yPosition += 25;
    } else {
      console.log('No se pudo cargar el logo, continuando sin él');
    }
  } catch (error) {
    console.log('Error al cargar el logo, continuando sin él:', error);
  }

  // Título principal
  pdf.setFontSize(20);
  pdf.setTextColor(196, 47, 47); // Color rojo del logo
  pdf.text('QUINTA ALIMENTOS', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 10;

  pdf.setFontSize(16);
  pdf.setTextColor(0, 0, 0);
  pdf.text('RESUMEN DE AUDITORÍA CON GESTIÓN', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  pdf.setFontSize(12);
  pdf.text(`Generado el: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}`, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 20;

  // Información de la auditoría
  pdf.setFontSize(12);
  pdf.setTextColor(0, 0, 0);
  pdf.text('INFORMACIÓN DE LA AUDITORÍA:', margin, yPosition);
  yPosition += 8;

  const infoLines = [
    `Código de Auditoría: ${auditoriaInfo.codigo_auditoria}`,
    `Título: ${auditoriaInfo.titulo_documento}`,
    `Planta: ${auditoriaInfo.planta_nombre}`,
    `Auditor: ${auditoriaInfo.auditor}`,
    `Fecha: ${format(new Date(auditoriaInfo.fecha), 'dd/MM/yyyy', { locale: es })}`,
    `Status: ${auditoriaInfo.status}`
  ];

  infoLines.forEach(line => {
    pdf.text(line, margin, yPosition);
    yPosition += 6;
  });

  yPosition += 15;

  // Línea divisoria
  pdf.setDrawColor(196, 47, 47); // Color rojo del logo
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 15;

  // Sets de auditoría con fotografías y gestión
  pdf.setFontSize(14);
  pdf.setTextColor(196, 47, 47);
  pdf.text('SETS DE AUDITORÍA', margin, yPosition);
  yPosition += 15;

  for (let i = 0; i < sets.length; i++) {
    const set = sets[i];
    
    // Verificar si necesitamos una nueva página
    if (yPosition > pageHeight - 150) {
      pdf.addPage();
      yPosition = margin;
    }

    pdf.setFontSize(12);
    pdf.setTextColor(196, 47, 47);
    pdf.text(`SET ${i + 1}: ${set.area}`, margin, yPosition);
    yPosition += 12;

    // Información del set
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    pdf.text(`Levantamiento: ${set.levantamiento || 'Sin levantamiento'}`, margin + 5, yPosition);
    yPosition += 6;

    pdf.text(`Responsable: ${set.responsable || 'Sin responsable'}`, margin + 5, yPosition);
    yPosition += 10;

    // Fotografías originales del levantamiento
    if (set.foto_urls && set.foto_urls.length > 0) {
      pdf.setFontSize(10);
      pdf.setTextColor(196, 47, 47);
      pdf.text('Fotografías del Levantamiento:', margin + 5, yPosition);
      yPosition += 8;

      try {
        const maxPhotosPerRow = 3;
        const photoWidth = 40;
        const photoHeight = 30;
        let currentRow = 0;
        let currentCol = 0;

        for (let j = 0; j < Math.min(set.foto_urls.length, 6); j++) {
          if (currentCol >= maxPhotosPerRow) {
            currentCol = 0;
            currentRow++;
          }

          const xPos = margin + 10 + (currentCol * (photoWidth + 5));
          const yPos = yPosition + (currentRow * (photoHeight + 5));

          try {
            pdf.addImage(set.foto_urls[j], 'JPEG', xPos, yPos, photoWidth, photoHeight);
          } catch (error) {
            console.error('Error agregando imagen del levantamiento:', error);
          }

          currentCol++;
        }

        yPosition += (currentRow + 1) * (photoHeight + 5) + 10;
      } catch (error) {
        console.error('Error procesando fotografías del levantamiento:', error);
        yPosition += 10;
      }
    }

    // Gestión de respuesta
    pdf.setFontSize(10);
    pdf.setTextColor(196, 47, 47);
    pdf.text('GESTIÓN DE RESPUESTA:', margin + 5, yPosition);
    yPosition += 8;

    pdf.setTextColor(0, 0, 0);
    
    if (set.evidencia_foto_url) {
      pdf.text('Tipo de Respuesta: Evidencia Fotográfica', margin + 10, yPosition);
      yPosition += 6;

      try {
        // Agregar la evidencia fotográfica
        pdf.text('Evidencia Proporcionada:', margin + 10, yPosition);
        yPosition += 8;
        
        pdf.addImage(set.evidencia_foto_url, 'JPEG', margin + 15, yPosition, 40, 30);
        yPosition += 35;
      } catch (error) {
        console.error('Error agregando evidencia fotográfica:', error);
        pdf.text('Error al cargar evidencia fotográfica', margin + 10, yPosition);
        yPosition += 8;
      }
    } else if (set.fecha_compromiso) {
      const fechaFormateada = format(new Date(set.fecha_compromiso), 'dd/MM/yyyy', { locale: es });
      pdf.text('Tipo de Respuesta: Fecha de Compromiso', margin + 10, yPosition);
      yPosition += 6;
      pdf.text(`Fecha de Compromiso: ${fechaFormateada}`, margin + 10, yPosition);
      yPosition += 8;
    } else {
      pdf.setTextColor(255, 140, 0); // Color naranja para pendiente
      pdf.text('Estado: PENDIENTE DE RESPUESTA', margin + 10, yPosition);
      yPosition += 8;
      pdf.setTextColor(0, 0, 0);
    }

    yPosition += 15;

    // Línea separadora entre sets
    pdf.setDrawColor(220, 220, 220);
    pdf.line(margin + 5, yPosition, pageWidth - margin - 5, yPosition);
    yPosition += 15;
  }

  // Firma del auditor
  yPosition += 20;
  if (yPosition > pageHeight - 60) {
    pdf.addPage();
    yPosition = margin;
  }

  pdf.setFontSize(12);
  pdf.setTextColor(0, 0, 0);
  
  const signatureX = pageWidth / 2;
  pdf.text('FIRMA DEL AUDITOR:', signatureX, yPosition, { align: 'center' });
  yPosition += 20;

  // Línea centrada para la firma
  const lineWidth = 80;
  const lineStartX = signatureX - (lineWidth / 2);
  const lineEndX = signatureX + (lineWidth / 2);
  pdf.line(lineStartX, yPosition, lineEndX, yPosition);
  yPosition += 15;

  // Información del auditor centrada
  pdf.setFontSize(10);
  pdf.text(auditoriaInfo.auditor, signatureX, yPosition, { align: 'center' });
  yPosition += 5;
  pdf.text(`Fecha: ${format(new Date(), 'dd/MM/yyyy', { locale: es })}`, signatureX, yPosition, { align: 'center' });

  // Pie de página
  pdf.setFontSize(8);
  pdf.setTextColor(128, 128, 128);
  pdf.text(`Documento generado automáticamente - ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}`, 
           pageWidth / 2, pageHeight - 10, { align: 'center' });

  // Descargar el PDF
  const fileName = `Resumen_Gestion_Auditoria_${auditoriaInfo.codigo_auditoria}_${format(new Date(), 'ddMMyyyy')}.pdf`;
  pdf.save(fileName);
};
