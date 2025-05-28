import React from 'react';
import { Control } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface BloqueosFormData {
  planta_id: string;
  area_planta_id: string;
  producto_id: string;
  cantidad: string;
  lote: string;
  turno_id: string;
  motivo: string;
  fecha: string;
  quien_bloqueo: string;
}

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
        <FormField
          control={control}
          name="planta_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-700 font-semibold">Planta</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="border-blue-200 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue placeholder="Selecciona una planta" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-white border-blue-200">
                  {plantas.map((planta) => (
                    <SelectItem key={planta.id} value={planta.id.toString()}>
                      {planta.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="area_planta_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-700 font-semibold">Área de Planta</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="border-blue-200 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue placeholder="Selecciona un área" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-white border-blue-200">
                  {areas.map((area) => (
                    <SelectItem key={area.id} value={area.id.toString()}>
                      {area.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="producto_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-700 font-semibold">Producto</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="border-blue-200 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue placeholder="Selecciona un producto" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-white border-blue-200">
                  {productos.map((producto) => (
                    <SelectItem key={producto.id} value={producto.id.toString()}>
                      {producto.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="turno_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-700 font-semibold">Turno</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="border-blue-200 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue placeholder="Selecciona un turno" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-white border-blue-200">
                  {turnos.map((turno) => (
                    <SelectItem key={turno.id} value={turno.id.toString()}>
                      {turno.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="cantidad"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-700 font-semibold">Cantidad</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  placeholder="Ingresa la cantidad"
                  className="border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                  {...field}
                  onFocus={() => onInputFocus('cantidad')}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="lote"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-700 font-semibold">Lote</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  placeholder="Ingresa el número de lote"
                  className="border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                  {...field}
                  onFocus={() => onInputFocus('lote')}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="fecha"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-700 font-semibold">Fecha</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  readOnly 
                  className="bg-gray-100 border-gray-300 text-gray-600 cursor-not-allowed"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="quien_bloqueo"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-700 font-semibold">Usuario</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  readOnly 
                  className="bg-gray-100 border-gray-300 text-gray-600 cursor-not-allowed"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
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
                className="resize-none border-blue-200 focus:border-blue-500 focus:ring-blue-500 min-h-[100px]"
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
