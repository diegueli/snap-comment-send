
-- Actualizar la política de auditoria_sets para filtrar por gerencia
DROP POLICY IF EXISTS "Users can view auditoria_sets based on permissions" ON public.auditoria_sets;

CREATE POLICY "Users can view auditoria_sets based on permissions"
ON public.auditoria_sets
FOR SELECT
USING (
  -- El usuario puede ver si:
  -- 1. Tiene permisos para ver todas las auditorías, O
  -- 2. La auditoría pertenece a su gerencia (si gerencia_resp_id coincide con su gerencia), O  
  -- 3. No hay gerencia asignada (gerencia_resp_id es NULL)
  public.can_user_view_all_auditorias() OR 
  gerencia_resp_id IN (
    SELECT gerencia_id FROM public.profiles WHERE id = auth.uid()
  ) OR
  gerencia_resp_id IS NULL
);

-- Habilitar RLS en auditoria_sets si no está habilitado
ALTER TABLE public.auditoria_sets ENABLE ROW LEVEL SECURITY;

-- Crear función para verificar si el usuario pertenece a la gerencia de Calidad
CREATE OR REPLACE FUNCTION public.is_user_calidad_gerencia()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS(
    SELECT 1 
    FROM public.profiles p
    JOIN public.gerencias g ON p.gerencia_id = g.id
    WHERE p.id = auth.uid() 
    AND LOWER(g.nombre) LIKE '%calidad%'
  );
$$;

-- Actualizar la política de auditorias para el módulo Resumen
-- Solo usuarios con can_view_all_auditorias=TRUE O usuarios de gerencia Calidad pueden ver todas
DROP POLICY IF EXISTS "Users can view auditorias based on permissions" ON public.auditorias;

CREATE POLICY "Users can view auditorias based on permissions" 
ON public.auditorias
FOR SELECT 
USING (
  -- El usuario puede ver si:
  -- 1. Es su propia auditoría, O
  -- 2. Tiene permisos para ver todas las auditorías, O
  -- 3. Pertenece a la gerencia de Calidad
  auth.uid() = user_id OR 
  public.can_user_view_all_auditorias() OR
  public.is_user_calidad_gerencia()
);
