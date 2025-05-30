
import React from 'react';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Control } from 'react-hook-form';

interface Option {
  id: number | string;
  nombre: string;
}

interface SelectFieldProps {
  control: Control<any>;
  name: string;
  label: string;
  placeholder: string;
  options: Option[];
  required?: boolean;
}

const SelectField: React.FC<SelectFieldProps> = ({
  control,
  name,
  label,
  placeholder,
  options,
  required = false
}) => {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-red-800">
            {label} {required && '*'}
          </FormLabel>
          <Select onValueChange={field.onChange} value={field.value}>
            <FormControl>
              <SelectTrigger className="border-red-200 focus:border-red-400">
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
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

export default SelectField;
