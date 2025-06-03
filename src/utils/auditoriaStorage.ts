
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { CapturedPhoto, PhotoSet, AuditoriaData, UserData } from '@/types/auditoria';

export const uploadPhotoToStorage = async (photo: CapturedPhoto, area: string, codigoAuditoria: string): Promise<string | null> => {
  if (!photo.file || !codigoAuditoria) return null;

  try {
    // Limpiar el nombre del área para usarlo en el nombre del archivo
    const cleanAreaName = area.replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `${codigoAuditoria}/${cleanAreaName}_${Date.now()}_${photo.id}.jpg`;
    
    const { data, error } = await supabase.storage
      .from('bucket_auditorias')
      .upload(fileName, photo.file, {
        contentType: 'image/jpeg',
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('bucket_auditorias')
      .getPublicUrl(fileName);

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
): Promise<{ success: boolean; codigoAuditoria?: string }> => {
  if (!auditoriaData || !userData || photoSets.length === 0) {
    toast({
      title: "No se puede cerrar la auditoría",
      description: "Debe tener al menos un conjunto de fotos guardado.",
      variant: "destructive",
    });
    return { success: false };
  }

  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('Usuario no autenticado');
    }

    console.log('Cerrando auditoría con datos:', {
      auditoriaData,
      photoSets: photoSets.length,
      codigoAuditoria: auditoriaData.codigoAuditoria
    });

    // Convertir fecha de DD/MM/YYYY a YYYY-MM-DD
    const [day, month, year] = auditoriaData.fecha.split('/');
    const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

    // Insertar auditoría
    const { data: auditoria, error: auditoriaError } = await supabase
      .from('auditorias')
      .insert({
        user_id: user.user.id,
        titulo_documento: auditoriaData.tituloDocumento,
        fecha: isoDate,
        auditor: auditoriaData.auditor,
        planta_id: auditoriaData.plantaId,
        codigo_auditoria: auditoriaData.codigoAuditoria,
        status: 'Activo'
      })
      .select()
      .single();

    if (auditoriaError) {
      console.error('Error insertando auditoría:', auditoriaError);
      throw auditoriaError;
    }

    console.log('Auditoría insertada:', auditoria);

    // Procesar cada conjunto de fotos
    for (const set of photoSets) {
      const photoUrls: string[] = [];
      
      console.log('Procesando conjunto:', set.area, 'con', set.photos.length, 'fotos');
      
      // Subir fotos y recopilar URLs
      for (const photo of set.photos) {
        const url = await uploadPhotoToStorage(photo, set.area, auditoriaData.codigoAuditoria);
        if (url) {
          photoUrls.push(url);
        }
      }

      console.log('URLs de fotos generadas:', photoUrls);

      // Insertar conjunto usando auditoria_codigo
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
        console.error('Error insertando conjunto:', setError);
        throw setError;
      }

      console.log('Conjunto insertado correctamente:', set.area);
    }

    toast({
      title: "Auditoría cerrada exitosamente",
      description: "Todos los datos han sido guardados en la base de datos.",
    });

    return { success: true, codigoAuditoria: auditoriaData.codigoAuditoria };
  } catch (error) {
    console.error('Error saving auditoria:', error);
    toast({
      title: "Error al cerrar auditoría",
      description: "No se pudo guardar en la base de datos.",
      variant: "destructive",
    });
    return { success: false };
  }
};
