'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { ProjectInventoryImportDialog } from '@/components/import/project-inventory-import-dialog';
import { Button } from '@/components/ui/button';
import { SelectField, type SelectOption } from '@/components/ui/select-field';
import StatsGrid from '@/components/materials/StatsGrid';
import FilterBar from '@/components/materials/FilterBar';
import MaterialsTable from '@/components/materials/MaterialsTable';
import { MaterialUsageModal } from '@/components/materials/MaterialsUsageModal';
import { MaterialEditModal } from '@/components/materials/MaterialsEditModal';
import { MaterialsAddModal } from '@/components/materials/MaterialsAddModal';
import { MATERIALS_MANAGEMENT } from '@/constants/components/materials/materials-constants';
import { materialsPage } from '@/locales/app/(dashboard)/materials/materials-page-locales';
import type { ProjectOption } from '@/lib/dal/projects';
import type { MaterialListFilters, MaterialStats } from '@/lib/dal/materials';
import type {
  MaterialUI,
  MaterialUsageSubmitData,
} from '@/lib/types/materials-types';
import { useDebouncedSearch } from '@/hooks/use-debounced-search';

type MaterialsClientProps = {
  filters: MaterialListFilters;
  initialMaterials: MaterialUI[];
  materialStats: MaterialStats;
  orgProjects: ProjectOption[];
  orgId: string;
  totalPages: number;
};

/**
 * Optimistic row updates keyed by material id.
 */
type MaterialOverrides = Record<string, MaterialUI>;

/**
 * Optimistic values tied to the server snapshot they extend.
 */
type MaterialOptimisticState = {
  overrides: MaterialOverrides;
  serverMaterials: MaterialUI[];
};

/**
 * Client-side materials workspace for filters, modals, and optimistic updates.
 */
export function MaterialsClient({
  filters,
  initialMaterials,
  materialStats,
  orgProjects,
  orgId,
  totalPages,
}: MaterialsClientProps) {
  const router = useRouter();
  const [optimisticState, setOptimisticState] =
    useState<MaterialOptimisticState>({
      overrides: {},
      serverMaterials: initialMaterials,
    });

  const [usageModalOpen, setUsageModalOpen] = useState(false);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(
    null,
  );
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedEditMaterialId, setSelectedEditMaterialId] = useState<
    string | null
  >(null);
  const pageSizeOptions = useMemo<SelectOption[]>(
    () =>
      Object.values(MATERIALS_MANAGEMENT.PAGE_SIZES).map((pageSize) => ({
        label: String(pageSize),
        value: String(pageSize),
      })),
    [],
  );

  /**
   * Applies local edits and usage changes over the current server page.
   */
  const materials = useMemo(() => {
    const materialOverrides =
      optimisticState.serverMaterials === initialMaterials
        ? optimisticState.overrides
        : {};

    return initialMaterials.map(
      (material) => materialOverrides[material.id] ?? material,
    );
  }, [initialMaterials, optimisticState]);

  const selectedEditMaterial = useMemo(
    () =>
      selectedEditMaterialId
        ? materials.find((material) => material.id === selectedEditMaterialId)
        : null,
    [materials, selectedEditMaterialId],
  );

  const normalizedCurrentPage = Math.min(filters.page, totalPages);
  const pageSummary = materialsPage.pagination.summary
    .replace(
      MATERIALS_MANAGEMENT.PAGE_SUMMARY_TOKENS.CURRENT_PAGE,
      String(normalizedCurrentPage),
    )
    .replace(
      MATERIALS_MANAGEMENT.PAGE_SUMMARY_TOKENS.TOTAL_PAGES,
      String(totalPages),
    );

  /**
   * Updates URL search params so the server returns the matching materials page.
   */
  const updateMaterialQueryParams = useCallback(
    (
      nextParams: Partial<MaterialListFilters>,
      navigation: 'push' | 'replace' = 'push',
    ) => {
      // Build a complete query from the current filters and requested changes.
      const params = new URLSearchParams();
      const mergedFilters = {
        ...filters,
        ...nextParams,
      };

      // Include search only when it has a value.
      if (mergedFilters.search) {
        params.set(
          MATERIALS_MANAGEMENT.QUERY_PARAMS.search,
          mergedFilters.search,
        );
      }

      // Include project only when it differs from the default.
      if (mergedFilters.project !== MATERIALS_MANAGEMENT.FILTERS.ALL_PROJECTS) {
        params.set(
          MATERIALS_MANAGEMENT.QUERY_PARAMS.project,
          mergedFilters.project,
        );
      }

      // Include page only when it is not the first page.
      if (mergedFilters.page !== MATERIALS_MANAGEMENT.DEFAULTS.FIRST_PAGE) {
        params.set(
          MATERIALS_MANAGEMENT.QUERY_PARAMS.page,
          String(mergedFilters.page),
        );
      }

      // Include page size only when it differs from the default.
      if (mergedFilters.pageSize !== MATERIALS_MANAGEMENT.DEFAULTS.PAGE_SIZE) {
        params.set(
          MATERIALS_MANAGEMENT.QUERY_PARAMS.pageSize,
          String(mergedFilters.pageSize),
        );
      }

      // Build the destination from the validated query parameters.
      const queryString = params.toString();
      const path = queryString
        ? `${MATERIALS_MANAGEMENT.ROUTES.MATERIALS_PATH}?${queryString}`
        : MATERIALS_MANAGEMENT.ROUTES.MATERIALS_PATH;

      router[navigation](path);
    },
    [filters, router],
  );

  // Keep typing local and update the URL only after the debounce delay.
  const { inputValue: searchInput, setInputValue: setSearchInput } =
    useDebouncedSearch({
      serverValue: filters.search,
      debounceMs: MATERIALS_MANAGEMENT.SEARCH_DEBOUNCE_MS,
      onDebouncedChange: (value) => {
        updateMaterialQueryParams(
          {
            page: MATERIALS_MANAGEMENT.DEFAULTS.FIRST_PAGE,
            search: value,
          },
          'replace',
        );
      },
    });

  function handleProjectFilterChange(value: string) {
    updateMaterialQueryParams({
      page: MATERIALS_MANAGEMENT.DEFAULTS.FIRST_PAGE,
      project: value,
    });
  }

  function handlePageSizeChange(value: string) {
    updateMaterialQueryParams({
      page: MATERIALS_MANAGEMENT.DEFAULTS.FIRST_PAGE,
      pageSize: Number(value),
    });
  }

  function handleLogUsage(id: string) {
    setSelectedMaterialId(id);
    setUsageModalOpen(true);
  }

  function handleCloseUsageModal() {
    setUsageModalOpen(false);
    setSelectedMaterialId(null);
  }

  function handleUsageSubmitSuccess(data: MaterialUsageSubmitData) {
    // Stop when no material is selected.
    if (!selectedMaterialId) return;

    // Usage can only update a material that exists on the current server page.
    const currentMaterial = materials.find(
      (material) => material.id === data.materialId,
    );

    // Stop when the updated material is not on the current page.
    if (!currentMaterial) return;

    // Calculate the optimistic quantity shown before the server refresh finishes.
    const newQuantity = Math.max(
      0,
      currentMaterial.quantity - data.quantityUsed,
    );

    setOptimisticState((currentState) => ({
      serverMaterials: initialMaterials,
      overrides: {
        ...(currentState.serverMaterials === initialMaterials
          ? currentState.overrides
          : {}),
        [data.materialId]: {
          ...currentMaterial,
          quantity: newQuantity,
          totalValue: newQuantity * currentMaterial.unitCost,
        },
      },
    }));
    router.refresh();
  }

  function handleEdit(id: string) {
    setSelectedEditMaterialId(id);
    setEditModalOpen(true);
  }

  function handleCloseEditModal() {
    setEditModalOpen(false);
    setSelectedEditMaterialId(null);
  }

  function handleEditSubmitSuccess(updatedMaterial: MaterialUI) {
    // Keep the edited row visible immediately while the server refresh catches up.
    setOptimisticState((currentState) => ({
      serverMaterials: initialMaterials,
      overrides: {
        ...(currentState.serverMaterials === initialMaterials
          ? currentState.overrides
          : {}),
        [updatedMaterial.id]: updatedMaterial,
      },
    }));
    router.refresh();
  }

  function handleAddMaterialSuccess() {
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-background px-6 py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">
              {materialsPage.materialsManagementTitle}
            </h1>
            <p className="text-sm text-muted-foreground">
              {materialsPage.materialsManagementSubtitle}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <ProjectInventoryImportDialog projects={orgProjects} />
            <Button onClick={() => setAddModalOpen(true)}>
              <Plus data-icon="inline-start" />
              {materialsPage.addMaterialButton}
            </Button>
          </div>
        </div>

        <StatsGrid stats={materialStats} />

        <div className="flex items-center justify-between">
          <FilterBar
            projects={orgProjects}
            projectFilter={filters.project}
            onProjectChange={handleProjectFilterChange}
            searchTerm={searchInput}
            onSearchChange={setSearchInput}
          />
        </div>

        <MaterialsTable
          materials={materials}
          onLogUsage={handleLogUsage}
          onEdit={handleEdit}
        />

        <div className="flex flex-col gap-3 rounded-lg border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {materialsPage.pagination.pageSizeLabel}
            </span>
            <SelectField
              options={pageSizeOptions}
              value={String(filters.pageSize)}
              onChange={handlePageSizeChange}
              placeholder={materialsPage.pagination.pageSizeLabel}
              className="w-20"
            />
          </div>
          <div className="flex items-center justify-between gap-3 sm:justify-end">
            <span className="text-sm text-muted-foreground">{pageSummary}</span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={
                  normalizedCurrentPage ===
                  MATERIALS_MANAGEMENT.DEFAULTS.FIRST_PAGE
                }
                onClick={() =>
                  updateMaterialQueryParams({
                    page: Math.max(
                      MATERIALS_MANAGEMENT.DEFAULTS.FIRST_PAGE,
                      normalizedCurrentPage - 1,
                    ),
                  })
                }
              >
                <ChevronLeft data-icon="inline-start" />
                {materialsPage.pagination.previousButton}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={normalizedCurrentPage === totalPages}
                onClick={() =>
                  updateMaterialQueryParams({
                    page: Math.min(totalPages, normalizedCurrentPage + 1),
                  })
                }
              >
                {materialsPage.pagination.nextButton}
                <ChevronRight data-icon="inline-end" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <MaterialUsageModal
        isOpen={usageModalOpen}
        onClose={handleCloseUsageModal}
        materialId={selectedMaterialId}
        materials={materials}
        projects={orgProjects}
        onSubmitSuccess={handleUsageSubmitSuccess}
      />
      <MaterialsAddModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        orgId={orgId}
        projects={orgProjects}
        onSubmitSuccess={handleAddMaterialSuccess}
      />
      <MaterialEditModal
        isOpen={editModalOpen}
        onClose={handleCloseEditModal}
        material={selectedEditMaterial ?? null}
        onSubmitSuccess={handleEditSubmitSuccess}
      />
    </div>
  );
}
