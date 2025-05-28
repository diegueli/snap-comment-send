
import React from 'react';
import { Control } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { BloqueosFormData } from './BloqueosForm';
import BloqueosSelectField from './bloqueos/BloqueosSelectField';
import BloqueosInputField from './bloqueos/BloqueosInputField';

interface BloqueosFormFieldsProps {
  control: Control<BloqueosFormData>;
  plantas: Array<{ id: number; nombre: string }>;
  areas: Array<{ id: number; nombre: string }>;
  productos: Array<{ id: number; nombre: string }>;
  turnos: Array<{ id: number; nombre: string }>;
  onInputFocus: (fieldName: 'cantidad' | 'lote') => void;
}

const BloqueosFormFields: React.FC<BloqueosFormFieldsProps> = ({
  control,
  plantas,
  areas,
  productos,
  turnos,
  onInputFocus,
}) => {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <BloqueosSelectField
          control={control}
          name="planta_id"
          label="Planta"
          placeholder="Selecciona una planta"
          options={plantas}
        />

        <BloqueosSelectField
          control={control}
          name="area_planta_id"
          label="Área de Planta"
          placeholder="Selecciona un área"
          options={areas}
        />

        <BloqueosSelectField
          control={control}
          name="producto_id"
          label="Producto"
          placeholder="Selecciona un producto"
          options={productos}
        />

        <BloqueosSelectField
          control={control}
          name="turno_id"
          label="Turno"
          placeholder="Selecciona un turno"
          options={turnos}
        />

        <BloqueosInputField
          control={control}
          name="cantidad"
          label="Cantidad"
          placeholder="Ingresa la cantidad"
          onFocus={() => onInputFocus('cantidad')}
        />

        <BloqueosInputField
          control={control}
          name="lote"
          label="Lote"
          placeholder="Ingresa el número de lote"
          onFocus={() => onInputFocus('lote')}
        />

        <BloqueosInputField
          control={control}
          name="fecha"
          label="Fecha"
          readOnly
        />

        <BloqueosInputField
          control={control}
          name="quien_bloqueo"
          label="Usuario"
          readOnly
        />
      </div>

      <FormField
        control={control}
        name="motivo"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-gray-700 font-semibold">Motivo del Bloqueo</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Describe el motivo del bloqueo (máximo 150 caracteres)"
                className="resize-none border-red-200 focus:border-red-500 focus:ring-red-500 min-h-[100px]"
                maxLength={150}
                {...field}
              />
            </FormControl>
            <div className="flex justify-between items-center mt-1">
              <div className="text-sm text-gray-500">
                {field.value?.length || 0}/150 caracteres
              </div>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
};

export default BloqueosFormFields;
