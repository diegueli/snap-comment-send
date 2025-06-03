
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
  const margin = 20;
  let yPosition = margin;

  // Título del documento
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('RESUMEN DE AUDITORÍA', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 20;

  // Información de la auditoría
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  
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
    yPosition += 8;
  });

  yPosition += 10;

  // Línea divisoria
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 15;

  // Sets de auditoría
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('SETS DE AUDITORÍA', margin, yPosition);
  yPosition += 15;

  for (let i = 0; i < sets.length; i++) {
    const set = sets[i];
    
    // Verificar si necesitamos una nueva página
    if (yPosition > 250) {
      pdf.addPage();
      yPosition = margin;
    }

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Set ${i + 1}: ${set.area}`, margin, yPosition);
    yPosition += 10;

    pdf.setFont('helvetica', 'normal');
    pdf.text(`Levantamiento: ${set.levantamiento || 'Sin levantamiento'}`, margin + 10, yPosition);
    yPosition += 8;

    pdf.text(`Responsable: ${set.responsable || 'Sin responsable'}`, margin + 10, yPosition);
    yPosition += 8;

    // Gestión de respuesta
    if (set.evidencia_foto_url) {
      pdf.text('Respuesta: Evidencia fotográfica proporcionada', margin + 10, yPosition);
      yPosition += 8;
    } else if (set.fecha_compromiso) {
      const fechaFormateada = format(new Date(set.fecha_compromiso), 'dd/MM/yyyy', { locale: es });
      pdf.text(`Respuesta: Fecha de compromiso - ${fechaFormateada}`, margin + 10, yPosition);
      yPosition += 8;
    } else {
      pdf.text('Respuesta: Pendiente', margin + 10, yPosition);
      yPosition += 8;
    }

    yPosition += 10;
  }

  // Pie de página
  const currentDate = format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es });
  pdf.setFontSize(8);
  pdf.text(`Generado el ${currentDate}`, margin, pdf.internal.pageSize.height - 10);

  // Descargar el PDF
  const fileName = `Resumen_Auditoria_${auditoriaInfo.codigo_auditoria}_${format(new Date(), 'ddMMyyyy')}.pdf`;
  pdf.save(fileName);
};
