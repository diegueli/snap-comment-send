
import React from 'react';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Control } from 'react-hook-form';

interface InputFieldProps {
  control: Control<any>;
  name: string;
  label: string;
  placeholder: string;
  type?: string;
  readOnly?: boolean;
  required?: boolean;
  onChange?: (value: any) => void;
}

const InputField: React.FC<InputFieldProps> = ({
  control,
  name,
  label,
  placeholder,
  type = "text",
  readOnly = false,
  required = false,
  onChange
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
          <FormControl>
            <Input
              type={type}
              placeholder={placeholder}
              className={`border-red-200 focus:border-red-400 ${readOnly ? 'bg-gray-50' : ''}`}
              readOnly={readOnly}
              {...field}
              onChange={(e) => {
                const value = type === 'number' ? parseInt(e.target.value) || undefined : e.target.value;
                field.onChange(value);
                if (onChange) onChange(value);
              }}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default InputField;
