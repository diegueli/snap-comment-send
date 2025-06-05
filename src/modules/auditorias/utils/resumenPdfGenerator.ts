
import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { AuditoriaInfo, AuditoriaSet } from '../types';

export const generateResumenPDF = async (auditoriaInfo: AuditoriaInfo, auditoriaSets: AuditoriaSet[]) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;
  let yPosition = margin;

  // Título principal
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('RESUMEN DE AUDITORÍA', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 20;

  // Información de la auditoría
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  
  doc.text(`Código: ${auditoriaInfo.codigo_auditoria}`, margin, yPosition);
  yPosition += 8;
  doc.text(`Título: ${auditoriaInfo.titulo_documento}`, margin, yPosition);
  yPosition += 8;
  doc.text(`Auditor: ${auditoriaInfo.auditor}`, margin, yPosition);
  yPosition += 8;
  doc.text(`Planta: ${auditoriaInfo.planta_nombre}`, margin, yPosition);
  yPosition += 8;
  doc.text(`Fecha: ${format(new Date(auditoriaInfo.fecha), 'dd/MM/yyyy', { locale: es })}`, margin, yPosition);
  yPosition += 20;

  // Estadísticas
  const totalSets = auditoriaSets.length;
  const setsConEvidencia = auditoriaSets.filter(set => set.evidencia_foto_url).length;
  const setsConCompromiso = auditoriaSets.filter(set => set.fecha_compromiso).length;
  const setsPendientes = totalSets - setsConEvidencia - setsConCompromiso;

  doc.setFont('helvetica', 'bold');
  doc.text('ESTADÍSTICAS:', margin, yPosition);
  yPosition += 10;
  
  doc.setFont('helvetica', 'normal');
  doc.text(`Total de observaciones: ${totalSets}`, margin, yPosition);
  yPosition += 8;
  doc.text(`Con evidencia fotográfica: ${setsConEvidencia}`, margin, yPosition);
  yPosition += 8;
  doc.text(`Con fecha de compromiso: ${setsConCompromiso}`, margin, yPosition);
  yPosition += 8;
  doc.text(`Pendientes: ${setsPendientes}`, margin, yPosition);
  yPosition += 20;

  // Detalle de sets
  doc.setFont('helvetica', 'bold');
  doc.text('DETALLE DE OBSERVACIONES:', margin, yPosition);
  yPosition += 15;

  auditoriaSets.forEach((set, index) => {
    // Verificar si necesitamos una nueva página
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = margin;
    }

    doc.setFont('helvetica', 'bold');
    doc.text(`${index + 1}. Área: ${set.area}`, margin, yPosition);
    yPosition += 8;

    doc.setFont('helvetica', 'normal');
    doc.text(`Levantamiento: ${set.levantamiento || 'Sin especificar'}`, margin + 10, yPosition);
    yPosition += 6;
    doc.text(`Responsable: ${set.responsable || 'Sin asignar'}`, margin + 10, yPosition);
    yPosition += 6;

    // Estado de la observación
    let estado = 'Pendiente';
    if (set.evidencia_foto_url) {
      estado = 'Completado con evidencia fotográfica';
    } else if (set.fecha_compromiso) {
      estado = `Compromiso para: ${format(new Date(set.fecha_compromiso), 'dd/MM/yyyy', { locale: es })}`;
    }
    
    doc.text(`Estado: ${estado}`, margin + 10, yPosition);
    yPosition += 15;
  });

  // Pie de página
  const currentDate = format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es });
  doc.setFontSize(10);
  doc.text(`Generado el ${currentDate}`, pageWidth / 2, pageHeight - 10, { align: 'center' });

  // Guardar el PDF
  doc.save(`Resumen_Auditoria_${auditoriaInfo.codigo_auditoria}.pdf`);
};
