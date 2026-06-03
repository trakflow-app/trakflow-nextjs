'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StatsGrid from '@/components/materials/StatsGrid';
import FilterBar from '@/components/materials/FilterBar';
import MaterialsTable from '@/components/materials/MaterialsTable';
import { fetchMaterials, type MaterialUI } from '@/lib/dal/materials';
import { fetchProjectsForOrg, type ProjectOption } from '@/lib/dal/projects';
import { createClient } from '@/lib/supabase/client';
import { materialsPage } from '@/locales/app/(dashboard)/materials/materials-page-locales';
import { MaterialUsageModal } from '@/components/materials/MaterialsUsageModal';
import { MaterialEditModal } from '@/components/materials/MaterialsEditModal';
import { MaterialsAddModal } from '@/components/materials/MaterialsAddModal';

/**
 * MaterialsPage Component
 * Manages the fetching, filtering, usage-material and editing materials.
 */
export default function MaterialsPage() {
  /**
   * State management
   */
  const [projectFilter, setProjectFilter] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [materials, setMaterials] = useState<MaterialUI[]>([]);
  const [orgProjects, setOrgProjects] = useState<ProjectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState<string | null>(null);

  // Modal state for material usage logging
  const [usageModalOpen, setUsageModalOpen] = useState(false);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(
    null,
  );

  // Modal state for adding new material
  const [addModalOpen, setAddModalOpen] = useState(false);

  // Modal state for editing an existing material
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedEditMaterialId, setSelectedEditMaterialId] = useState<
    string | null
  >(null);

  /**
   * Data fetching
   */
  const loadMaterials = useCallback(async () => {
    const supabase = createClient();

    // Retrieve the authenticated user session
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    // Fetch the organization ID linked to the user's account
    const { data: account } = await supabase
      .from('accounts')
      .select('org_id')
      .eq('id', user.id)
      .single();

    if (!account?.org_id) {
      setLoading(false);
      return;
    }

    // API call to retrieve materials and projects for the specific organization
    const [data, projectsData] = await Promise.all([
      fetchMaterials(account.org_id),
      fetchProjectsForOrg(account.org_id),
    ]);
    setMaterials(data);
    setOrgProjects(projectsData);
    setLoading(false);
    setOrgId(account.org_id);
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void loadMaterials();
    });
  }, [loadMaterials]);

  /**
   * Extracts unique project names from the materials list for the FilterBar.
   * Memoized to prevent recalculation on every re-render.
   */
  const projects = useMemo(
    () => orgProjects.map((project) => project.name),
    [orgProjects],
  );

  /**
   * Gets the material currently selected for editing.
   */
  const selectedEditMaterial = useMemo(
    () =>
      selectedEditMaterialId
        ? materials.find((material) => material.id === selectedEditMaterialId)
        : null,
    [materials, selectedEditMaterialId],
  );

  /**
   * Opens the interface to record material consumption.
   * @param id - The unique identifier of the material.
   */
  const handleLogUsage = (id: string) => {
    setSelectedMaterialId(id);
    setUsageModalOpen(true);
  };

  /**
   * Closes the material usage logging modal.
   */
  const handleCloseUsageModal = () => {
    setUsageModalOpen(false);
    setSelectedMaterialId(null);
  };

  /**
   * Callback when material usage is successfully logged.
   * Updates the local state to reflect the deduction immediately.
   */
  const handleUsageSubmitSuccess = (data: {
    materialId: string;
    projectId: string;
    quantityUsed: number;
    notes?: string | null | undefined;
  }) => {
    if (!selectedMaterialId) return;

    console.log('Deducting from ID:', data.materialId);
    console.log(
      'Current Materials IDs:',
      materials.map((m) => m.id),
    );

    setMaterials((prevMaterials) =>
      prevMaterials.map((material) => {
        if (material.id === data.materialId) {
          const newQuantity = Math.max(
            0,
            material.quantity - data.quantityUsed,
          );
          return {
            ...material,
            quantity: newQuantity,
            // Recalculate total value so stats grid stays accurate
            totalValue: newQuantity * material.unitCost,
          };
        }
        return material;
      }),
    );
  };

  /**
   * Opens the material editor.
   * @param id - The unique identifier of the material.
   */
  const handleEdit = (id: string) => {
    setSelectedEditMaterialId(id);
    setEditModalOpen(true);
  };

  /**
   * Closes the material editor.
   */
  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setSelectedEditMaterialId(null);
  };

  /**
   * Callback when material details are successfully updated.
   */
  const handleEditSubmitSuccess = (updatedMaterial: MaterialUI) => {
    setMaterials((prevMaterials) =>
      prevMaterials.map((material) =>
        material.id === updatedMaterial.id ? updatedMaterial : material,
      ),
    );
  };

  /**
   * Opens the add material modal.
   */
  const handleAddMaterial = () => {
    setAddModalOpen(true);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold">
            {materialsPage.materialsManagementTitle}
          </h1>
          <p className="text-sm text-muted-foreground">
            {materialsPage.materialsManagementSubtitle}
          </p>
        </div>

        <div>
          <Button onClick={handleAddMaterial}>
            <Plus className="mr-2 h-4 w-4" /> {materialsPage.addMaterialButton}
          </Button>
        </div>
      </div>

      <div className="space-y-6">
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

        {!loading && (
          <MaterialsTable
            materials={materials}
            projectFilter={projectFilter}
            searchTerm={searchTerm}
            onLogUsage={handleLogUsage}
            onEdit={handleEdit}
          />
        )}
      </div>

      {/* Material Usage Logging Modal */}
      <MaterialUsageModal
        isOpen={usageModalOpen}
        onClose={handleCloseUsageModal}
        materialId={selectedMaterialId}
        materials={materials}
        onSubmitSuccess={handleUsageSubmitSuccess}
      />
      {/* Material Add Modal */}
      <MaterialsAddModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        orgId={orgId}
        projects={orgProjects}
        onSubmitSuccess={loadMaterials}
      />
      {/* Material Edit Modal */}
      <MaterialEditModal
        isOpen={editModalOpen}
        onClose={handleCloseEditModal}
        material={selectedEditMaterial ?? null}
        onSubmitSuccess={handleEditSubmitSuccess}
      />
    </div>
  );
}
