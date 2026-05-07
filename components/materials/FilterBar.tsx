import React from 'react';
import { SelectField } from '@/components/ui/select-field';
import { Input } from '@/components/ui/input';

type Props = {
  projects: string[];
  projectFilter: string | null;
  onProjectChange: (val: string | null) => void;
  searchTerm: string;
  onSearchChange: (val: string) => void;
};

export default function FilterBar({
  projects,
  projectFilter,
  onProjectChange,
  searchTerm,
  onSearchChange,
}: Props) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full">
      <div className="w-full sm:w-60">
        <SelectField
          options={[
            { label: 'All Projects', value: 'ALL' },
            ...projects.map((p) => ({ label: p, value: p })),
          ]}
          value={projectFilter ?? ''}
          onChange={(v) => onProjectChange(v || null)}
          placeholder="Filter by Project"
        />
      </div>

      <div className="flex-1">
        <Input
          placeholder="Search materials..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
    </div>
  );
}
