'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StatsGrid from '@/components/materials/StatsGrid';
import FilterBar from '@/components/materials/FilterBar';
import MaterialsTable from '@/components/materials/MaterialsTable';
import { MaterialUsageModal } from '@/components/materials/MaterialsUsageModal';
import { MaterialEditModal } from '@/components/materials/MaterialsEditModal';
import { MaterialsAddModal } from '@/components/materials/MaterialsAddModal';
import { materialsPage } from '@/locales/app/(dashboard)/materials/materials-page-locales';
import type { ProjectOption } from '@/lib/dal/projects';
import type {
  MaterialUI,
  MaterialUsageSubmitData,
} from '@/lib/types/materials-types';

type MaterialsClientProps = {
  initialMaterials: MaterialUI[];
  orgProjects: ProjectOption[];
  orgId: string;
};

/**
 * Client-side materials workspace for filters, modals, and optimistic updates.
 */
export function MaterialsClient({
  initialMaterials,
  orgProjects,
  orgId,
}: MaterialsClientProps) {
  const router = useRouter();
  const [projectFilter, setProjectFilter] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [materials, setMaterials] = useState<MaterialUI[]>(initialMaterials);

  const [usageModalOpen, setUsageModalOpen] = useState(false);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(
    null,
  );
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedEditMaterialId, setSelectedEditMaterialId] = useState<
    string | null
  >(null);

  const projects = useMemo(
    () => orgProjects.map((project) => project.name),
    [orgProjects],
  );

  const selectedEditMaterial = useMemo(
    () =>
      selectedEditMaterialId
        ? materials.find((material) => material.id === selectedEditMaterialId)
        : null,
    [materials, selectedEditMaterialId],
  );

  function handleLogUsage(id: string) {
    setSelectedMaterialId(id);
    setUsageModalOpen(true);
  }

  function handleCloseUsageModal() {
    setUsageModalOpen(false);
    setSelectedMaterialId(null);
  }

  function handleUsageSubmitSuccess(data: MaterialUsageSubmitData) {
    if (!selectedMaterialId) return;

    setMaterials((prevMaterials) =>
      prevMaterials.map((material) => {
        if (material.id !== data.materialId) return material;

        const newQuantity = Math.max(
          0,
          material.quantity - data.quantityUsed,
        );

        return {
          ...material,
          quantity: newQuantity,
          totalValue: newQuantity * material.unitCost,
        };
      }),
    );
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
    setMaterials((prevMaterials) =>
      prevMaterials.map((material) =>
        material.id === updatedMaterial.id ? updatedMaterial : material,
      ),
    );
  }

  function handleAddMaterialSuccess() {
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">
            {materialsPage.materialsManagementTitle}
          </h1>
          <p className="text-sm text-muted-foreground">
            {materialsPage.materialsManagementSubtitle}
          </p>
        </div>

        <Button onClick={() => setAddModalOpen(true)}>
          <Plus />
          {materialsPage.addMaterialButton}
        </Button>
      </div>

      <div className="flex flex-col gap-6">
        <StatsGrid materials={materials} />

        <div className="flex items-center justify-between">
          <FilterBar
            projects={projects}
            projectFilter={projectFilter}
            onProjectChange={setProjectFilter}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />
        </div>

        <MaterialsTable
          materials={materials}
          projectFilter={projectFilter}
          searchTerm={searchTerm}
          onLogUsage={handleLogUsage}
          onEdit={handleEdit}
        />
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
