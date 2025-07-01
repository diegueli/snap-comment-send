
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

const loadImageAsBase64 = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      try {
        const dataURL = canvas.toDataURL('image/jpeg', 0.7);
        resolve(dataURL);
      } catch (error) {
        reject(error);
      }
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = url;
  });
};

const addHeader = async (doc: jsPDF, auditoriaInfo: AuditoriaInfo) => {
  const pageWidth = doc.internal.pageSize.width;
  let yPosition = 20;

  // Intentar cargar el logo
  try {
    const logoUrl = '/lovable-uploads/9ad6adb6-f76a-4982-92e9-09618c309f7c.png';
    const logoBase64 = await loadImageAsBase64(logoUrl);
    doc.addImage(logoBase64, 'PNG', 20, yPosition, 40, 20);
    yPosition += 25;
  } catch (error) {
    console.warn('No se pudo cargar el logo:', error);
  }

  // Título del documento - similar al PDF de auditoría
  doc.setFontSize(20);
  doc.setTextColor(196, 47, 47);
  doc.text('QUINTA ALIMENTOS', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 10;

  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('RESUMEN DE AUDITORÍA', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  doc.setFontSize(12);
  doc.text(`Generado el: ${format(new Date(), 'dd/MM/yyyy')} a las ${format(new Date(), 'HH:mm')}`, pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 20;

  // Información de la auditoría - similar al estilo del PDF de auditoría
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text('INFORMACIÓN DE LA AUDITORÍA:', 20, yPosition);
  yPosition += 8;
  doc.text(`Planta: ${auditoriaInfo.planta_nombre}`, 20, yPosition);
  yPosition += 6;
  doc.text(`Auditor: ${auditoriaInfo.auditor}`, 20, yPosition);
  yPosition += 6;
  doc.text(`Fecha: ${format(new Date(auditoriaInfo.fecha), 'dd/MM/yyyy', { locale: es })}`, 20, yPosition);
  yPosition += 6;
  doc.text(`Código: ${auditoriaInfo.codigo_auditoria}`, 20, yPosition);
  yPosition += 6;
  doc.text(`Título: ${auditoriaInfo.titulo_documento}`, 20, yPosition);
  yPosition += 10;

  return yPosition;
};

const addSetContent = async (doc: jsPDF, set: AuditoriaSet, setNumber: number, yPosition: number) => {
  const pageHeight = doc.internal.pageSize.height;
  const pageWidth = doc.internal.pageSize.width;
  let currentY = yPosition;
  
  // Verificar si necesitamos una nueva página
  if (currentY > pageHeight - 100) {
    doc.addPage();
    currentY = 20;
  }

  // Título del área - similar al estilo del PDF de auditoría
  doc.setFontSize(16);
  doc.setTextColor(196, 47, 47);
  doc.text(`ÁREA: ${set.area}`, 20, currentY);
  currentY += 15;

  // Procesar fotografías del levantamiento - similar al PDF de auditoría
  if (set.foto_urls && set.foto_urls.length > 0) {
    for (let j = 0; j < set.foto_urls.length; j++) {
      // Verificar si necesitamos una nueva página para las fotos
      if (currentY > pageHeight - 80) {
        doc.addPage();
        currentY = 20;
      }

      try {
        const imgWidth = 60;
        const imgHeight = 60;
        const imgSrc = set.foto_urls[j];
        const imageBase64 = await loadImageAsBase64(imgSrc);
        doc.addImage(imageBase64, 'JPEG', 20 + (j * 65), currentY, imgWidth, imgHeight);
      } catch (error) {
        console.error('Error agregando imagen al PDF:', error);
        // Dibujar rectángulo placeholder si la imagen no se puede cargar
        doc.setDrawColor(200, 200, 200);
        doc.rect(20 + (j * 65), currentY, 60, 60);
        doc.setFontSize(8);
        doc.text('Imagen no disponible', 25 + (j * 65), currentY + 30);
        doc.setFontSize(12);
      }
    }
    
    currentY += 70;
  }

  // Información del levantamiento - similar al estilo del PDF de auditoría
  if (set.levantamiento) {
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('Observación:', 20, currentY);
    currentY += 10;
    
    const splitLevantamiento = doc.splitTextToSize(set.levantamiento, pageWidth - 40);
    doc.text(splitLevantamiento, 20, currentY);
    currentY += splitLevantamiento.length * 5 + 10;
  }

  if (set.responsable) {
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Responsable: ${set.responsable}`, 20, currentY);
    currentY += 10;
  }

  // Estado de la gestión
  doc.setFont('helvetica', 'bold');
  doc.text('Estado:', 20, currentY);
  doc.setFont('helvetica', 'normal');
  
  let estado = '';
  if (set.evidencia_foto_url) {
    estado = 'Completado - Evidencia fotográfica proporcionada';
    doc.setTextColor(0, 128, 0); // Verde
  } else if (set.fecha_compromiso) {
    estado = `Pendiente - Fecha compromiso: ${format(new Date(set.fecha_compromiso), 'dd/MM/yyyy', { locale: es })}`;
    doc.setTextColor(255, 165, 0); // Naranja
  } else {
    estado = 'Pendiente de respuesta';
    doc.setTextColor(255, 0, 0); // Rojo
  }
  
  doc.text(estado, 50, currentY);
  doc.setTextColor(0, 0, 0); // Volver a negro
  currentY += 15;

  // Evidencia fotográfica (si existe)
  if (set.evidencia_foto_url) {
    doc.setFont('helvetica', 'bold');
    doc.text('Evidencia de corrección:', 20, currentY);
    currentY += 8;
    
    const evidenceWidth = 60;
    const evidenceHeight = 45;
    
    // Verificar si necesitamos una nueva página
    if (currentY + evidenceHeight > pageHeight - 20) {
      doc.addPage();
      currentY = 20;
    }
    
    try {
      const evidenceBase64 = await loadImageAsBase64(set.evidencia_foto_url);
      doc.addImage(evidenceBase64, 'JPEG', 20, currentY, evidenceWidth, evidenceHeight);
    } catch (error) {
      console.warn('No se pudo cargar la evidencia:', error);
      doc.setDrawColor(200, 200, 200);
      doc.rect(20, currentY, evidenceWidth, evidenceHeight);
      doc.setFontSize(8);
      doc.text('Evidencia no disponible', 25, currentY + evidenceHeight/2);
      doc.setFontSize(12);
    }
    
    currentY += evidenceHeight + 10;
  }

  currentY += 20;
  return currentY;
};

export const generateResumenPDF = async (auditoriaInfo: AuditoriaInfo, sets: AuditoriaSet[]) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  
  let currentY = await addHeader(doc, auditoriaInfo);
  
  for (let i = 0; i < sets.length; i++) {
    const set = sets[i];
    currentY = await addSetContent(doc, set, i + 1, currentY);
  }
  
  // Centralizar la firma del auditor - igual que en el PDF de auditoría
  const pageHeight = doc.internal.pageSize.height;
  if (currentY > pageHeight - 80) {
    doc.addPage();
    currentY = 20;
  }

  currentY += 30;
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  
  // Centrar la firma
  const signatureX = pageWidth / 2;
  doc.text('FIRMA DEL AUDITOR:', signatureX, currentY, { align: 'center' });
  currentY += 20;

  // Línea centrada para la firma
  const lineWidth = 80;
  const lineStartX = signatureX - (lineWidth / 2);
  const lineEndX = signatureX + (lineWidth / 2);
  doc.line(lineStartX, currentY, lineEndX, currentY);
  currentY += 15;

  // Información del auditor centrada
  doc.setFontSize(10);
  doc.text(`${auditoriaInfo.auditor}`, signatureX, currentY, { align: 'center' });
  currentY += 5;
  doc.text(`Fecha: ${format(new Date(auditoriaInfo.fecha), 'dd/MM/yyyy', { locale: es })}`, signatureX, currentY, { align: 'center' });

  // Pie de página
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Página ${i} de ${pageCount}`, 15, 290);
    doc.text(`Generado el ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}`, 140, 290);
  }
  
  const fileName = `Resumen_Auditoria_${auditoriaInfo.codigo_auditoria}_${format(new Date(), 'ddMMyyyy_HHmm')}.pdf`;
  doc.save(fileName);
};
