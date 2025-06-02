
import { supabase } from '@/integrations/supabase/client';

interface Photo {
  id: string;
  url: string;
  file: File;
}

export const uploadBloqueosPhotos = async (
  photos: Photo[],
  codigoBloqueo: string
): Promise<string[]> => {
  const uploadedUrls: string[] = [];

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    const fileName = `${codigoBloqueo}/foto_${i + 1}_${Date.now()}.jpg`;
    
    try {
      const { data, error } = await supabase.storage
        .from('bucket_bloqueos')
        .upload(fileName, photo.file, {
          contentType: 'image/jpeg',
          upsert: false
        });

      if (error) {
        console.error(`Error uploading photo ${i + 1}:`, error);
        throw error;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('bucket_bloqueos')
        .getPublicUrl(fileName);

      uploadedUrls.push(urlData.publicUrl);
    } catch (error) {
      console.error(`Failed to upload photo ${i + 1}:`, error);
      throw new Error(`Error al subir la foto ${i + 1}`);
    }
  }

  return uploadedUrls;
};

export const sendBloqueoEmail = async (
  bloqueoData: any,
  photoUrls: string[]
): Promise<void> => {
  try {
    // Crear el contenido del correo incluyendo las URLs de las fotos
    const photoLinks = photoUrls.map((url, index) => 
      `<p><a href="${url}" target="_blank">Ver Foto ${index + 1}</a></p>`
    ).join('');

    const emailBody = `
      <h2>Nuevo Bloqueo Registrado</h2>
      <p><strong>Código de Bloqueo:</strong> ${bloqueoData.codigo_bloqueo}</p>
      <p><strong>Fecha:</strong> ${bloqueoData.fecha}</p>
      <p><strong>Producto:</strong> ${bloqueoData.producto}</p>
      <p><strong>Cantidad:</strong> ${bloqueoData.cantidad}</p>
      <p><strong>Lote:</strong> ${bloqueoData.lote}</p>
      <p><strong>Motivo:</strong> ${bloqueoData.motivo}</p>
      <p><strong>Quien Bloqueó:</strong> ${bloqueoData.quien_bloqueo}</p>
      <p><strong>Área:</strong> ${bloqueoData.area}</p>
      <p><strong>Turno:</strong> ${bloqueoData.turno}</p>
      
      <h3>Evidencia Fotográfica:</h3>
      ${photoLinks}
      
      <p><em>Este es un correo automático del sistema de bloqueos.</em></p>
    `;

    const { data, error } = await supabase.functions.invoke('send-bloqueo-email', {
      body: {
        to: 'calidad@empresa.com', // Configurar el email de destino según necesidades
        subject: `Nuevo Bloqueo: ${bloqueoData.codigo_bloqueo}`,
        html: emailBody,
        bloqueoData,
        photoUrls
      }
    });

    if (error) {
      console.error('Error sending email:', error);
      throw error;
    }

    console.log('Email sent successfully:', data);
  } catch (error) {
    console.error('Failed to send bloqueo email:', error);
    throw new Error('Error al enviar el correo de notificación');
  }
};
