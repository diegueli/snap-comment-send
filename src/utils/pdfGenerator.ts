import jsPDF from 'jspdf';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { PhotoSet, AuditoriaData, UserData, Planta } from '@/types/auditoria';

interface GeneratePDFParams {
  photoSets: PhotoSet[];
  auditoriaData: AuditoriaData | null;
  userData: UserData | null;
  selectedPlanta: Planta | null;
  auditoriaId: string | null;
  codigoAuditoria?: string | null;
}

export const generatePDF = async ({
  photoSets,
  auditoriaData,
  userData,
  selectedPlanta,
  auditoriaId,
  codigoAuditoria
}: GeneratePDFParams) => {
  if (photoSets.length === 0) {
    toast({
      title: "No hay conjuntos de fotos para exportar",
      description: "Por favor crea al menos un conjunto de fotos primero.",
      variant: "destructive",
    });
    return;
  }

  let pdf: jsPDF;
  let pdfBlob: Blob;

  try {
    console.log('🔄 Iniciando generación de PDF...');
    pdf = new jsPDF();
    const pageHeight = pdf.internal.pageSize.height;
    const pageWidth = pdf.internal.pageSize.width;
    let yPosition = 20;

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
        pdf.addImage(logoBase64, 'PNG', 20, yPosition, 40, 20);
        yPosition += 25;
      } else {
        console.log('No se pudo cargar el logo, continuando sin él');
      }
    } catch (error) {
      console.log('Error al cargar el logo, continuando sin él:', error);
    }

    // Título del documento
    pdf.setFontSize(20);
    pdf.setTextColor(196, 47, 47);
    pdf.text('QUINTA ALIMENTOS', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    pdf.setFontSize(16);
    pdf.setTextColor(0, 0, 0);
    const title = auditoriaData?.tituloDocumento || 'Reporte de Auditoría';
    pdf.text(title, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    pdf.setFontSize(12);
    pdf.text(`Generado el: ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 20;

    // Información de la auditoría
    if (auditoriaData && userData && selectedPlanta) {
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text('INFORMACIÓN DE LA AUDITORÍA:', 20, yPosition);
      yPosition += 8;
      pdf.text(`Planta: ${selectedPlanta.nombre}`, 20, yPosition);
      yPosition += 6;
      pdf.text(`Auditor: ${auditoriaData.auditor}`, 20, yPosition);
      yPosition += 6;
      pdf.text(`Cargo: ${userData.position}`, 20, yPosition);
      yPosition += 6;
      pdf.text(`Email: ${userData.email}`, 20, yPosition);
      yPosition += 6;
      pdf.text(`Fecha: ${auditoriaData.fecha}`, 20, yPosition);
      yPosition += 6;
      if (codigoAuditoria) {
        pdf.text(`Código: ${codigoAuditoria}`, 20, yPosition);
        yPosition += 6;
      }
      yPosition += 10;
    }

    // Procesar conjuntos de fotos
    for (let i = 0; i < photoSets.length; i++) {
      const set = photoSets[i];
      
      if (yPosition > pageHeight - 100) {
        pdf.addPage();
        yPosition = 20;
      }

      pdf.setFontSize(16);
      pdf.setTextColor(196, 47, 47);
      pdf.text(`ÁREA: ${set.area}`, 20, yPosition);
      yPosition += 15;

      for (let j = 0; j < set.photos.length; j++) {
        const photo = set.photos[j];
        
        if (yPosition > pageHeight - 80) {
          pdf.addPage();
          yPosition = 20;
        }

        try {
          const imgWidth = 60;
          const imgHeight = 60;
          const imgSrc = photo.url || URL.createObjectURL(photo.file!);
          pdf.addImage(imgSrc, 'JPEG', 20 + (j * 65), yPosition, imgWidth, imgHeight);
        } catch (error) {
          console.error('Error agregando imagen al PDF:', error);
        }
      }
      
      yPosition += 70;

      if (set.levantamiento) {
        pdf.setFontSize(12);
        pdf.setTextColor(0, 0, 0);
        pdf.text('Levantamiento:', 20, yPosition);
        yPosition += 10;
        
        const splitLevantamiento = pdf.splitTextToSize(set.levantamiento, pageWidth - 40);
        pdf.text(splitLevantamiento, 20, yPosition);
        yPosition += splitLevantamiento.length * 5 + 10;
      }

      if (set.responsable) {
        pdf.setFontSize(12);
        pdf.setTextColor(0, 0, 0);
        pdf.text(`Responsable: ${set.responsable}`, 20, yPosition);
        yPosition += 10;
      }

      yPosition += 10;
    }

    // Centralizar la firma del auditor
    if (auditoriaData && userData) {
      if (yPosition > pageHeight - 80) {
        pdf.addPage();
        yPosition = 20;
      }

      yPosition += 30;
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      
      // Centrar la firma
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
      pdf.text(`${auditoriaData.auditor}`, signatureX, yPosition, { align: 'center' });
      yPosition += 5;
      pdf.text(`${userData.position}`, signatureX, yPosition, { align: 'center' });
      yPosition += 5;
      pdf.text(`Fecha: ${auditoriaData.fecha}`, signatureX, yPosition, { align: 'center' });
    }

    // Generar el blob del PDF
    pdfBlob = pdf.output('blob');
    console.log('✅ PDF generado exitosamente, tamaño:', pdfBlob.size, 'bytes');
    
  } catch (error) {
    console.error('💥 Error generando PDF:', error);
    toast({
      title: "Error al generar PDF",
      description: "No se pudo generar el PDF. Verifique los datos e intente nuevamente.",
      variant: "destructive",
    });
    return;
  }
  
  // Crear nombre del archivo usando el código de auditoría
  const baseFileName = codigoAuditoria || `${auditoriaData?.tituloDocumento || 'Auditoria'}_${selectedPlanta?.nombre || 'Planta'}`;
  const fileName = `${baseFileName}_${auditoriaData?.fecha.replace(/\//g, '-') || new Date().toISOString().split('T')[0]}.pdf`;
  
  // Solo intentar subir si el PDF se generó correctamente
  if (pdfBlob && pdfBlob.size > 0) {
    try {
      console.log('🔄 Intentando subir PDF a Supabase Storage...');
      
      // Crear un File object en lugar de usar blob directamente
      const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });
      
      // Subir PDF a Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('bucket_auditorias')
        .upload(`pdfs/${auditoriaId || Date.now()}/${fileName}`, pdfFile, {
          contentType: 'application/pdf',
          upsert: true
        });

      if (uploadError) {
        console.error('❌ Error uploading PDF to Supabase:', uploadError);
        toast({
          title: "Error al guardar PDF",
          description: "No se pudo guardar el PDF en el servidor, pero se descargará localmente.",
          variant: "destructive",
        });
      } else {
        console.log('✅ PDF uploaded successfully:', uploadData);
        toast({
          title: "PDF guardado",
          description: "PDF guardado en el servidor y descargado localmente.",
        });
      }
    } catch (error) {
      console.error('💥 Error during PDF upload:', error);
      toast({
        title: "Error al guardar PDF",
        description: "Error durante la subida del PDF al servidor.",
        variant: "destructive",
      });
    }

    // Descargar PDF localmente
    try {
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
      
      console.log('✅ PDF descargado localmente');
    } catch (error) {
      console.error('❌ Error downloading PDF locally:', error);
      toast({
        title: "Error al descargar PDF",
        description: "No se pudo descargar el PDF localmente.",
        variant: "destructive",
      });
    }
  } else {
    console.error('💥 PDF blob is empty or invalid');
    toast({
      title: "Error al generar PDF",
      description: "El PDF generado está vacío o es inválido.",
      variant: "destructive",
    });
  }
};
