'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectFieldProps {
  id?: string;
  name?: string;
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Reusable select / dropdown field built on the shadcn Select primitive.
 */
export function SelectField({
  id,
  name,
  options,
  value,
  defaultValue,
  onChange,
  placeholder,
  disabled,
  className,
}: SelectFieldProps) {
  return (
    <Select
      name={name}
      value={value}
      defaultValue={defaultValue}
      onValueChange={onChange}
      disabled={disabled}
    >
      <SelectTrigger id={id} className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
