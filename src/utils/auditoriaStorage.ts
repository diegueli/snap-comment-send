
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { CapturedPhoto, PhotoSet, AuditoriaFormData, UserData } from '@/types/auditoria';

export const uploadPhotoToStorage = async (photo: CapturedPhoto, area: string, auditoriaId: string): Promise<string | null> => {
  if (!photo.file || !auditoriaId) return null;

  try {
    // Limpiar el nombre del área para usarlo en el nombre del archivo
    const cleanAreaName = area.replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `${auditoriaId}/${cleanAreaName}_${Date.now()}_${photo.id}.jpg`;
    
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
  auditoriaData: AuditoriaFormData,
  userData: UserData,
  photoSets: PhotoSet[],
  setAuditoriaId: (id: string) => void
): Promise<boolean> => {
  if (!auditoriaData || !userData || photoSets.length === 0) {
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
      throw new Error('Usuario no autenticado');
    }

    const [day, month, year] = auditoriaData.fecha.split('/');
    const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

    const { data: auditoria, error: auditoriaError } = await supabase
      .from('auditorias')
      .insert({
        user_id: user.user.id,
        titulo_documento: auditoriaData.tituloDocumento,
        fecha: isoDate,
        auditor: auditoriaData.auditor,
        planta_id: auditoriaData.plantaId,
        status: 'Activo'
      })
      .select()
      .single();

    if (auditoriaError) throw auditoriaError;

    setAuditoriaId(auditoria.id);

    for (const set of photoSets) {
      const photoUrls: string[] = [];
      
      // Upload photos and collect URLs, now including area in filename
      for (const photo of set.photos) {
        const url = await uploadPhotoToStorage(photo, set.area, auditoria.id);
        if (url) {
          photoUrls.push(url);
        }
      }

      const { error: setError } = await supabase
        .from('auditoria_sets')
        .insert({
          auditoria_id: auditoria.id,
          area: set.area,
          levantamiento: set.levantamiento || null,
          responsable: set.responsable || null,
          foto_urls: photoUrls
        });

      if (setError) throw setError;
    }

    toast({
      title: "Auditoría cerrada exitosamente",
      description: "Todos los datos han sido guardados en la base de datos.",
    });

    return true;
  } catch (error) {
    console.error('Error saving auditoria:', error);
    toast({
      title: "Error al cerrar auditoría",
      description: "No se pudo guardar en la base de datos.",
      variant: "destructive",
    });
    return false;
  }
};
