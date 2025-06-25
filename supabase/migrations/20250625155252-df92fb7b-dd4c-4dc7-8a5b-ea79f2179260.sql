
-- Actualizar la función que maneja nuevos usuarios para incluir gerencia_id
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_gerencia_id INTEGER;
BEGIN
  -- Obtener ID de gerencia basado en el nombre o ID enviado en metadata
  IF NEW.raw_user_meta_data ->> 'gerencia_id' IS NOT NULL THEN
    -- Si se envía el ID directamente
    v_gerencia_id := (NEW.raw_user_meta_data ->> 'gerencia_id')::INTEGER;
  ELSIF NEW.raw_user_meta_data ->> 'gerencia' IS NOT NULL THEN
    -- Si se envía el nombre de la gerencia
    SELECT id INTO v_gerencia_id 
    FROM public.gerencias 
    WHERE nombre = NEW.raw_user_meta_data ->> 'gerencia';
  END IF;

  INSERT INTO public.profiles (id, name, position, gerencia_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'position', ''),
    v_gerencia_id
  );
  RETURN NEW;
END;
$function$
