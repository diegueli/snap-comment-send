
import React from 'react';
import { Control } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { BloqueosFormData } from '../BloqueosForm';

interface BloqueosInputFieldProps {
  control: Control<BloqueosFormData>;
  name: keyof BloqueosFormData;
  label: string;
  placeholder?: string;
  type?: string;
  readOnly?: boolean;
  onFocus?: () => void;
}

const BloqueosInputField: React.FC<BloqueosInputFieldProps> = ({
  control,
  name,
  label,
  placeholder,
  type = "text",
  readOnly = false,
  onFocus,
}) => {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-gray-700 font-semibold">{label}</FormLabel>
          <FormControl>
            <Input
              type={type}
              placeholder={placeholder}
              className={readOnly 
                ? "bg-gray-100 border-gray-300 text-gray-600 cursor-not-allowed"
                : "border-red-200 focus:border-red-500 focus:ring-red-500"
              }
              readOnly={readOnly}
              {...field}
              onFocus={onFocus}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default BloqueosInputField;
