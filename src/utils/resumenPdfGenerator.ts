
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

const addLogo = async (doc: jsPDF) => {
  try {
    const logoUrl = '/lovable-uploads/9ad6adb6-f76a-4982-92e9-09618c309f7c.png';
    const logoBase64 = await loadImageAsBase64(logoUrl);
    doc.addImage(logoBase64, 'PNG', margin, yPosition, 40, 20);
  } catch (error) {
    console.warn('No se pudo cargar el logo:', error);
  }
};

const addHeader = async (doc: jsPDF, auditoriaInfo: AuditoriaInfo) => {
  await addLogo(doc);
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('QUINTA ALIMENTOS', 50, 20);
  
  doc.setFontSize(14);
  doc.text('RESUMEN DE AUDITORÍA', 50, 28);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Código: ${auditoriaInfo.codigo_auditoria}`, 15, 45);
  doc.text(`Planta: ${auditoriaInfo.planta_nombre}`, 15, 52);
  doc.text(`Auditor: ${auditoriaInfo.auditor}`, 15, 59);
  doc.text(`Fecha: ${format(new Date(auditoriaInfo.fecha), 'dd/MM/yyyy', { locale: es })}`, 15, 66);
  
  doc.setDrawColor(200, 200, 200);
  doc.line(15, 75, 195, 75);
};

const addSetContent = async (doc: jsPDF, set: AuditoriaSet, setNumber: number, yPosition: number) => {
  let currentY = yPosition;
  
  // Título del Set
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`${setNumber}. ${set.area}`, 15, currentY);
  currentY += 10;
  
  // Información del levantamiento
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Observación:', 15, currentY);
  doc.setFont('helvetica', 'normal');
  
  const levantamientoText = set.levantamiento || 'Sin observación registrada';
  const levantamientoLines = doc.splitTextToSize(levantamientoText, 170);
  doc.text(levantamientoLines, 15, currentY + 5);
  currentY += 5 + (levantamientoLines.length * 4) + 5;
  
  // Responsable
  doc.setFont('helvetica', 'bold');
  doc.text('Responsable:', 15, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(set.responsable || 'Sin responsable asignado', 45, currentY);
  currentY += 8;
  
  // Estado de la gestión
  doc.setFont('helvetica', 'bold');
  doc.text('Estado:', 15, currentY);
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
  
  doc.text(estado, 35, currentY);
  doc.setTextColor(0, 0, 0); // Volver a negro
  currentY += 10;
  
  // Fotografías del levantamiento
  if (set.foto_urls && set.foto_urls.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.text('Fotografías del levantamiento:', 15, currentY);
    currentY += 8;
    
    const photosPerRow = 3;
    const photoWidth = 50;
    const photoHeight = 35;
    const photoSpacing = 5;
    
    for (let i = 0; i < set.foto_urls.length; i++) {
      const row = Math.floor(i / photosPerRow);
      const col = i % photosPerRow;
      const x = 15 + col * (photoWidth + photoSpacing);
      const y = currentY + row * (photoHeight + photoSpacing);
      
      // Verificar si necesitamos una nueva página
      if (y + photoHeight > 280) {
        doc.addPage();
        currentY = 20;
        const newY = currentY + row * (photoHeight + photoSpacing);
        
        try {
          const imageBase64 = await loadImageAsBase64(set.foto_urls[i]);
          doc.addImage(imageBase64, 'JPEG', x, newY, photoWidth, photoHeight);
        } catch (error) {
          console.warn(`No se pudo cargar la imagen ${i + 1}:`, error);
          doc.setDrawColor(200, 200, 200);
          doc.rect(x, newY, photoWidth, photoHeight);
          doc.setFontSize(8);
          doc.text('Imagen no disponible', x + 5, newY + photoHeight/2);
          doc.setFontSize(10);
        }
      } else {
        try {
          const imageBase64 = await loadImageAsBase64(set.foto_urls[i]);
          doc.addImage(imageBase64, 'JPEG', x, y, photoWidth, photoHeight);
        } catch (error) {
          console.warn(`No se pudo cargar la imagen ${i + 1}:`, error);
          doc.setDrawColor(200, 200, 200);
          doc.rect(x, y, photoWidth, photoHeight);
          doc.setFontSize(8);
          doc.text('Imagen no disponible', x + 5, y + photoHeight/2);
          doc.setFontSize(10);
        }
      }
    }
    
    const totalRows = Math.ceil(set.foto_urls.length / photosPerRow);
    currentY += totalRows * (photoHeight + photoSpacing) + 5;
  }
  
  // Evidencia fotográfica (si existe)
  if (set.evidencia_foto_url) {
    doc.setFont('helvetica', 'bold');
    doc.text('Evidencia de corrección:', 15, currentY);
    currentY += 8;
    
    const evidenceWidth = 60;
    const evidenceHeight = 45;
    
    // Verificar si necesitamos una nueva página
    if (currentY + evidenceHeight > 280) {
      doc.addPage();
      currentY = 20;
    }
    
    try {
      const evidenceBase64 = await loadImageAsBase64(set.evidencia_foto_url);
      doc.addImage(evidenceBase64, 'JPEG', 15, currentY, evidenceWidth, evidenceHeight);
    } catch (error) {
      console.warn('No se pudo cargar la evidencia:', error);
      doc.setDrawColor(200, 200, 200);
      doc.rect(15, currentY, evidenceWidth, evidenceHeight);
      doc.setFontSize(8);
      doc.text('Evidencia no disponible', 20, currentY + evidenceHeight/2);
      doc.setFontSize(10);
    }
    
    currentY += evidenceHeight + 10;
  }
  
  // Línea separadora
  doc.setDrawColor(200, 200, 200);
  doc.line(15, currentY, 195, currentY);
  currentY += 10;
  
  return currentY;
};

export const generateResumenPDF = async (auditoriaInfo: AuditoriaInfo, sets: AuditoriaSet[]) => {
  const doc = new jsPDF();
  
  await addHeader(doc, auditoriaInfo);
  
  let currentY = 85;
  
  for (let i = 0; i < sets.length; i++) {
    const set = sets[i];
    
    // Verificar si necesitamos una nueva página antes de agregar el set
    if (currentY > 250) {
      doc.addPage();
      currentY = 20;
    }
    
    currentY = await addSetContent(doc, set, i + 1, currentY);
  }
  
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
