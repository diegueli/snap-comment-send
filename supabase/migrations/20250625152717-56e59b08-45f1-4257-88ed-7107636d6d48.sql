
-- Agregar campo para permitir ver todas las auditorías a ciertos usuarios
ALTER TABLE public.profiles 
ADD COLUMN can_view_all_auditorias BOOLEAN DEFAULT FALSE;

-- Crear función de seguridad para verificar permisos
CREATE OR REPLACE FUNCTION public.can_user_view_all_auditorias()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT can_view_all_auditorias FROM public.profiles WHERE id = auth.uid()),
    FALSE
  );
$$;

-- Eliminar política restrictiva actual si existe
DROP POLICY IF EXISTS "Users can view their own auditorias" ON public.auditorias;

-- Crear nueva política que permite ver auditorías propias O todas si tiene permiso
CREATE POLICY "Users can view auditorias based on permissions" 
ON public.auditorias
FOR SELECT 
USING (
  auth.uid() = user_id OR public.can_user_view_all_auditorias()
);

-- Comentario: Los usuarios normales solo verán sus auditorías
-- Los usuarios con can_view_all_auditorias = TRUE verán todas las auditorías
