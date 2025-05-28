
import React from 'react';
import { Control } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BloqueosFormData } from '../BloqueosForm';

interface BloqueosSelectFieldProps {
  control: Control<BloqueosFormData>;
  name: keyof BloqueosFormData;
  label: string;
  placeholder: string;
  options: Array<{ id: number; nombre: string }>;
}

const BloqueosSelectField: React.FC<BloqueosSelectFieldProps> = ({
  control,
  name,
  label,
  placeholder,
  options,
}) => {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-gray-700 font-semibold">{label}</FormLabel>
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <FormControl>
              <SelectTrigger className="border-red-200 focus:border-red-500 focus:ring-red-500">
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent className="bg-white border-red-200">
              {options.map((option) => (
                <SelectItem key={option.id} value={option.id.toString()}>
                  {option.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default BloqueosSelectField;
