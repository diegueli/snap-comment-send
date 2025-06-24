
-- Eliminar la restricción CHECK existente si existe
ALTER TABLE public.auditorias DROP CONSTRAINT IF EXISTS auditorias_status_check;

-- Crear una nueva restricción CHECK que permita los valores correctos
ALTER TABLE public.auditorias ADD CONSTRAINT auditorias_status_check 
CHECK (status IN ('Activo', 'Cerrado'));
