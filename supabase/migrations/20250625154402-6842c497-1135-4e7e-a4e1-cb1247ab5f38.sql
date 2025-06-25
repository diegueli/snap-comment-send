
-- Eliminar la política actual restrictiva si existe
DROP POLICY IF EXISTS "Users can view auditorias based on permissions" ON public.auditorias;

-- Crear nueva política que permite ver auditorías propias O todas si tiene permiso
CREATE POLICY "Users can view auditorias based on permissions" 
ON public.auditorias
FOR SELECT 
USING (
  auth.uid() = user_id OR public.can_user_view_all_auditorias()
);

-- También actualizar política para auditoria_sets si no existe
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

-- Habilitar RLS en las tablas si no está habilitado
ALTER TABLE public.auditorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditoria_sets ENABLE ROW LEVEL SECURITY;
