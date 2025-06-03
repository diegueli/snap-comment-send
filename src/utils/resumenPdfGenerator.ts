
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
    }
  } catch (error) {
    console.log('Error al cargar el logo, continuando sin él:', error);
  }

  // Título principal
  pdf.setFontSize(20);
  pdf.setTextColor(196, 47, 47);
  pdf.text('QUINTA ALIMENTOS', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 10;

  pdf.setFontSize(16);
  pdf.setTextColor(0, 0, 0);
  pdf.text('RESUMEN DE AUDITORÍA CON GESTIÓN', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 10;

  pdf.setFontSize(12);
  pdf.text(`Generado el: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}`, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  // Información básica de la auditoría (sin título "INFORMACIÓN DE LA AUDITORÍA" y sin status)
  pdf.setFontSize(12);
  pdf.setTextColor(0, 0, 0);
  
  const infoLines = [
    `Código de Auditoría: ${auditoriaInfo.codigo_auditoria}`,
    `Título: ${auditoriaInfo.titulo_documento}`,
    `Planta: ${auditoriaInfo.planta_nombre}`,
    `Auditor: ${auditoriaInfo.auditor}`,
    `Fecha: ${format(new Date(auditoriaInfo.fecha), 'dd/MM/yyyy', { locale: es })}`
  ];

  infoLines.forEach(line => {
    pdf.text(line, margin, yPosition);
    yPosition += 5;
  });

  yPosition += 10;

  // Línea divisoria
  pdf.setDrawColor(196, 47, 47);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 12;

  // Sets de auditoría
  pdf.setFontSize(14);
  pdf.setTextColor(196, 47, 47);
  pdf.text('SETS DE AUDITORÍA', margin, yPosition);
  yPosition += 12;

  for (let i = 0; i < sets.length; i++) {
    const set = sets[i];
    
    // Verificar espacio disponible
    if (yPosition > pageHeight - 160) {
      pdf.addPage();
      yPosition = margin;
    }

    // Header del set
    pdf.setFontSize(13);
    pdf.setTextColor(196, 47, 47);
    pdf.text(`SET ${i + 1}`, margin, yPosition);
    yPosition += 6;

    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    pdf.text(`Área: ${set.area}`, margin + 5, yPosition);
    yPosition += 6;

    // Información del set
    pdf.setFontSize(10);
    pdf.text(`Levantamiento: ${set.levantamiento || 'Sin levantamiento'}`, margin + 5, yPosition);
    yPosition += 4;
    pdf.text(`Responsable: ${set.responsable || 'Sin responsable'}`, margin + 5, yPosition);
    yPosition += 8;

    // Fotografías del levantamiento
    if (set.foto_urls && set.foto_urls.length > 0) {
      pdf.setFontSize(10);
      pdf.setTextColor(196, 47, 47);
      pdf.text('Fotografías del Levantamiento:', margin + 5, yPosition);
      yPosition += 6;

      try {
        const photoWidth = 32;
        const photoHeight = 24;
        const photosPerRow = 4;
        const photoSpacing = 4;
        let currentRow = 0;
        let currentCol = 0;

        for (let j = 0; j < Math.min(set.foto_urls.length, 8); j++) {
          if (currentCol >= photosPerRow) {
            currentCol = 0;
            currentRow++;
          }

          const xPos = margin + 8 + (currentCol * (photoWidth + photoSpacing));
          const yPos = yPosition + (currentRow * (photoHeight + photoSpacing));

          try {
            pdf.addImage(set.foto_urls[j], 'JPEG', xPos, yPos, photoWidth, photoHeight);
            
            // Numeración de fotos
            pdf.setFontSize(7);
            pdf.setTextColor(255, 255, 255);
            pdf.text(`${j + 1}`, xPos + 2, yPos + 6);
            pdf.setTextColor(0, 0, 0);
          } catch (error) {
            console.error('Error agregando imagen:', error);
          }

          currentCol++;
        }

        yPosition += (currentRow + 1) * (photoHeight + photoSpacing) + 6;
      } catch (error) {
        console.error('Error procesando fotografías:', error);
        yPosition += 6;
      }
    }

    // Gestión de respuesta
    pdf.setFontSize(11);
    pdf.setTextColor(196, 47, 47);
    pdf.text('GESTIÓN DE RESPUESTA:', margin + 5, yPosition);
    yPosition += 8;

    // Caja para la gestión
    pdf.setDrawColor(200, 200, 200);
    pdf.rect(margin + 8, yPosition - 2, pageWidth - 2 * margin - 16, 28);

    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    
    if (set.evidencia_foto_url) {
      pdf.setTextColor(0, 150, 0);
      pdf.text('✓ EVIDENCIA FOTOGRÁFICA', margin + 12, yPosition + 4);
      pdf.setTextColor(0, 0, 0);
      
      try {
        pdf.addImage(set.evidencia_foto_url, 'JPEG', margin + 12, yPosition + 6, 25, 18);
        pdf.text('Evidencia de resolución', margin + 42, yPosition + 12);
      } catch (error) {
        console.error('Error agregando evidencia:', error);
        pdf.text('Error al cargar evidencia', margin + 12, yPosition + 12);
      }
    } else if (set.fecha_compromiso) {
      const fechaFormateada = format(new Date(set.fecha_compromiso), 'dd/MM/yyyy', { locale: es });
      pdf.setTextColor(0, 100, 200);
      pdf.text('📅 FECHA DE COMPROMISO', margin + 12, yPosition + 4);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Fecha: ${fechaFormateada}`, margin + 12, yPosition + 12);
      pdf.text('Pendiente de evidencia', margin + 12, yPosition + 20);
    } else {
      pdf.setTextColor(255, 140, 0);
      pdf.text('⏳ PENDIENTE DE RESPUESTA', margin + 12, yPosition + 4);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Sin evidencia ni fecha de compromiso', margin + 12, yPosition + 12);
    }

    yPosition += 32;

    // Separador entre sets (más compacto)
    if (i < sets.length - 1) {
      pdf.setDrawColor(220, 220, 220);
      pdf.line(margin + 5, yPosition, pageWidth - margin - 5, yPosition);
      yPosition += 10;
    }
  }

  // Firma del auditor
  yPosition += 20;
  if (yPosition > pageHeight - 60) {
    pdf.addPage();
    yPosition = margin + 15;
  }

  pdf.setFontSize(12);
  pdf.setTextColor(0, 0, 0);
  
  const signatureX = pageWidth / 2;
  pdf.text('FIRMA DEL AUDITOR:', signatureX, yPosition, { align: 'center' });
  yPosition += 15;

  // Línea para firma
  const lineWidth = 70;
  const lineStartX = signatureX - (lineWidth / 2);
  const lineEndX = signatureX + (lineWidth / 2);
  pdf.line(lineStartX, yPosition, lineEndX, yPosition);
  yPosition += 12;

  // Información del auditor
  pdf.setFontSize(10);
  pdf.text(auditoriaInfo.auditor, signatureX, yPosition, { align: 'center' });
  yPosition += 4;
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
