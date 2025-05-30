
import React from 'react';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Control } from 'react-hook-form';

interface TextareaFieldProps {
  control: Control<any>;
  name: string;
  label: string;
  placeholder: string;
  maxLength?: number;
  showCharCount?: boolean;
  required?: boolean;
}

const TextareaField: React.FC<TextareaFieldProps> = ({
  control,
  name,
  label,
  placeholder,
  maxLength,
  showCharCount = false,
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
          <FormControl>
            <Textarea
              placeholder={placeholder}
              className="resize-none border-red-200 focus:border-red-400"
              maxLength={maxLength}
              {...field}
            />
          </FormControl>
          {showCharCount && maxLength && (
            <div className="text-sm text-gray-500 text-right">
              {field.value?.length || 0}/{maxLength}
            </div>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default TextareaField;
