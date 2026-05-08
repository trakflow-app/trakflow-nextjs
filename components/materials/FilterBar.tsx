import { SelectField } from '@/components/ui/select-field';
import { Input } from '@/components/ui/input';
import { filterBar } from '@/locales/components/materials/filter-bar-locales';

type Props = {
  projects: string[];
  projectFilter: string | null;
  onProjectChange: (value: string | null) => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
};

export default function FilterBar({
  projects,
  projectFilter,
  onProjectChange,
  searchTerm,
  onSearchChange,
}: Props) {
  return (
    <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center">
      <div className="w-full sm:w-60">
        <SelectField
          options={[
            { label: filterBar.allProjects, value: '__all__' },
            ...projects.map((project) => ({ label: project, value: project })),
          ]}
          value={projectFilter ?? '__all__'}
          onChange={(value) =>
            onProjectChange(value === '__all__' ? null : value)
          }
          placeholder="Filter by Project"
        />
      </div>

      <div className="flex-1">
        <Input
          type="search"
          placeholder={filterBar.placeHolderSearch}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
    </div>
  );
}
