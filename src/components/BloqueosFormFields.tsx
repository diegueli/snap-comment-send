
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface DropdownOption {
  id: number;
  nombre: string;
}

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
  form: UseFormReturn<BloqueosFormData>;
  plantas: DropdownOption[];
  areas: DropdownOption[];
  productos: DropdownOption[];
  turnos: DropdownOption[];
}

const BloqueosFormFields: React.FC<BloqueosFormFieldsProps> = ({
  form,
  plantas,
  areas,
  productos,
  turnos,
}) => {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <FormField
          control={form.control}
          name="planta_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-gray-700">Planta</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="h-10 border-gray-300 focus:border-red-500 focus:ring-red-500">
                    <SelectValue placeholder="Selecciona una planta" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-white border-gray-200 z-50">
                  {plantas.map((planta) => (
                    <SelectItem key={planta.id} value={planta.id.toString()}>
                      {planta.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="area_planta_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-gray-700">Área de Planta</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="h-10 border-gray-300 focus:border-red-500 focus:ring-red-500">
                    <SelectValue placeholder="Selecciona un área" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-white border-gray-200 z-50">
                  {areas.map((area) => (
                    <SelectItem key={area.id} value={area.id.toString()}>
                      {area.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="producto_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-gray-700">Producto</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="h-10 border-gray-300 focus:border-red-500 focus:ring-red-500">
                    <SelectValue placeholder="Selecciona un producto" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-white border-gray-200 z-50">
                  {productos.map((producto) => (
                    <SelectItem key={producto.id} value={producto.id.toString()}>
                      {producto.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="turno_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-gray-700">Turno</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="h-10 border-gray-300 focus:border-red-500 focus:ring-red-500">
                    <SelectValue placeholder="Selecciona un turno" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-white border-gray-200 z-50">
                  {turnos.map((turno) => (
                    <SelectItem key={turno.id} value={turno.id.toString()}>
                      {turno.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="cantidad"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-gray-700">Cantidad</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  placeholder="Ingresa la cantidad"
                  className="h-10 border-gray-300 focus:border-red-500 focus:ring-red-500"
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="lote"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-gray-700">Lote</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  placeholder="Ingresa el número de lote"
                  className="h-10 border-gray-300 focus:border-red-500 focus:ring-red-500"
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="fecha"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-gray-700">Fecha</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  readOnly
                  className="h-10 border-gray-300 bg-gray-50 cursor-not-allowed"
                />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="quien_bloqueo"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-gray-700">Usuario</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  readOnly
                  className="h-10 border-gray-300 bg-gray-50 cursor-not-allowed"
                />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="motivo"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium text-gray-700">Motivo del Bloqueo</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Describe el motivo del bloqueo (máximo 150 caracteres)"
                className="resize-none border-gray-300 focus:border-red-500 focus:ring-red-500 min-h-[80px]"
                maxLength={150}
                {...field}
              />
            </FormControl>
            <div className="flex justify-between items-center mt-1">
              <div className="text-xs text-gray-500">
                {field.value?.length || 0}/150 caracteres
              </div>
            </div>
            <FormMessage className="text-xs" />
          </FormItem>
        )}
      />
    </>
  );
};

export default BloqueosFormFields;
