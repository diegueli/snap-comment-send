
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { CapturedPhoto, PhotoSet, AuditoriaFormData, UserData, AuditoriaData } from '@/types/auditoria';

export const uploadPhotoToStorage = async (photo: CapturedPhoto, area: string, codigoAuditoria: string): Promise<string | null> => {
  if (!photo.file || !codigoAuditoria) {
    console.error('Missing photo file or codigo auditoria for upload');
    return null;
  }

  try {
    console.log(`Uploading photo for area: ${area}, codigo: ${codigoAuditoria}`);
    
    // Limpiar el nombre del área para usarlo en el nombre del archivo
    const cleanAreaName = area.replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `${codigoAuditoria}/${cleanAreaName}_${Date.now()}_${photo.id}.jpg`;
    
    const { data, error } = await supabase.storage
      .from('bucket_auditorias')
      .upload(fileName, photo.file, {
        contentType: 'image/jpeg',
      });

    if (error) {
      console.error('Storage upload error:', error);
      throw error;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('bucket_auditorias')
      .getPublicUrl(fileName);

    console.log('Photo uploaded successfully:', publicUrl);
    return publicUrl;
  } catch (error) {
    console.error('Error uploading photo:', error);
    return null;
  }
};

export const closeAuditoria = async (
  auditoriaData: AuditoriaData,
  userData: UserData,
  photoSets: PhotoSet[]
): Promise<boolean> => {
  console.log('Starting closeAuditoria process...');
  console.log('Auditoria data:', auditoriaData);
  console.log('Photo sets count:', photoSets.length);

  if (!auditoriaData || !userData || photoSets.length === 0) {
    console.error('Missing required data for closing auditoria');
    toast({
      title: "No se puede cerrar la auditoría",
      description: "Debe tener al menos un conjunto de fotos guardado.",
      variant: "destructive",
    });
    return false;
  }

  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      console.error('User not authenticated');
      throw new Error('Usuario no autenticado');
    }

    console.log('User authenticated:', user.user.id);

    const [day, month, year] = auditoriaData.fecha.split('/');
    const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

    console.log('Inserting auditoria with codigo:', auditoriaData.codigoAuditoria);

    // Insertar auditoría usando codigo_auditoria como PK
    const { error: auditoriaError } = await supabase
      .from('auditorias')
      .insert({
        codigo_auditoria: auditoriaData.codigoAuditoria,
        user_id: user.user.id,
        titulo_documento: auditoriaData.tituloDocumento,
        fecha: isoDate,
        auditor: auditoriaData.auditor,
        planta_id: auditoriaData.plantaId,
        status: 'Activo'
      });

    if (auditoriaError) {
      console.error('Error inserting auditoria:', auditoriaError);
      throw auditoriaError;
    }

    console.log('Auditoria inserted successfully');

    // Procesar cada conjunto de fotos
    for (const [index, set] of photoSets.entries()) {
      console.log(`Processing photo set ${index + 1}/${photoSets.length}:`, set.area);
      const photoUrls: string[] = [];
      
      // Upload photos and collect URLs, using codigo_auditoria for naming
      for (const [photoIndex, photo] of set.photos.entries()) {
        console.log(`Uploading photo ${photoIndex + 1}/${set.photos.length} for set: ${set.area}`);
        const url = await uploadPhotoToStorage(photo, set.area, auditoriaData.codigoAuditoria);
        if (url) {
          photoUrls.push(url);
        } else {
          console.warn(`Failed to upload photo ${photoIndex + 1} for set: ${set.area}`);
        }
      }

      console.log(`Inserting photo set with ${photoUrls.length} photos`);

      const { error: setError } = await supabase
        .from('auditoria_sets')
        .insert({
          auditoria_codigo: auditoriaData.codigoAuditoria,
          area: set.area,
          levantamiento: set.levantamiento || null,
          responsable: set.responsable || null,
          gerencia_resp_id: set.gerencia_resp_id || null,
          foto_urls: photoUrls
        });

      if (setError) {
        console.error('Error inserting photo set:', setError);
        throw setError;
      }

      console.log(`Photo set inserted successfully: ${set.area}`);
    }

    console.log('All photo sets processed successfully');

    toast({
      title: "Auditoría cerrada exitosamente",
      description: "Todos los datos han sido guardados en la base de datos.",
    });

    return true;
  } catch (error) {
    console.error('Error saving auditoria:', error);
    toast({
      title: "Error al cerrar auditoría",
      description: `No se pudo guardar en la base de datos: ${error.message || 'Error desconocido'}`,
      variant: "destructive",
    });
    return false;
  }
};
