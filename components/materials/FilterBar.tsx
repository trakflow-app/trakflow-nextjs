import { SelectField } from '@/components/ui/select-field';
import { Input } from '@/components/ui/input';
import { MATERIALS_MANAGEMENT } from '@/constants/components/materials/materials-constants';
import type { ProjectOption } from '@/lib/dal/projects';
import { filterBar } from '@/locales/components/materials/filter-bar-locales';

type Props = {
  projects: ProjectOption[];
  projectFilter: string;
  onProjectChange: (value: string) => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
};

/**
 * Renders the project and search controls for the materials list.
 */
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
            {
              label: filterBar.allProjects,
              value: MATERIALS_MANAGEMENT.FILTERS.ALL_PROJECTS,
            },
            ...projects.map((project) => ({
              label: project.name,
              value: project.id,
            })),
          ]}
          value={projectFilter}
          onChange={onProjectChange}
          placeholder={filterBar.projectPlaceholder}
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
