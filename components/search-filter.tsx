'use client';

import type { ChangeEvent } from 'react';

import { SelectField, type SelectOption } from '@/components/select-field';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const DEFAULT_SEARCH_PLACEHOLDER = 'Search tools, materials, or projects';
const DEFAULT_FILTER_PLACEHOLDER = 'Filter by type';

/**
 * Props for the reusable SearchFilter component.
 */
export interface SearchFilterProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filterOptions?: SelectOption[];
  filterValue?: string;
  onFilterChange?: (value: string) => void;
  filterPlaceholder?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Reusable search input with an optional dropdown filter for list pages.
 */
export function SearchFilter({
  searchValue,
  onSearchChange,
  searchPlaceholder = DEFAULT_SEARCH_PLACEHOLDER,
  filterOptions,
  filterValue,
  onFilterChange,
  filterPlaceholder = DEFAULT_FILTER_PLACEHOLDER,
  disabled,
  className,
}: SearchFilterProps) {
  function handleSearchChange(event: ChangeEvent<HTMLInputElement>) {
    onSearchChange(event.target.value);
  }

  return (
    <div
      className={cn(
        'flex flex-col gap-2 sm:flex-row sm:items-center',
        className,
      )}
    >
      <Input
        className="flex-1"
        type="search"
        value={searchValue}
        onChange={handleSearchChange}
        placeholder={searchPlaceholder}
        disabled={disabled}
      />

      {filterOptions && filterOptions.length > 0 ? (
        <SelectField
          options={filterOptions}
          value={filterValue}
          onChange={onFilterChange}
          placeholder={filterPlaceholder}
          disabled={disabled}
        />
      ) : null}
    </div>
  );
}
