'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StatsGrid from '@/components/materials/StatsGrid';
import FilterBar from '@/components/materials/FilterBar';
import MaterialsTable from '@/components/materials/MaterialsTable';
import {
  fetchMaterials,
  type MaterialUI,
} from '@/app/services/materials-services';
import { createClient } from '@/lib/supabase/client';
import { materialsPage } from '@/locales/app/(dashboard)/materials/materials-page-locales';

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
  const [loading, setLoading] = useState(true);

  /**
   * Data fetching
   */
  useEffect(() => {
    const loadMaterials = async () => {
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

      // API call to retrieve materials or the specific organizations
      const data = await fetchMaterials(account.org_id);
      setMaterials(data);
      setLoading(false);
    };

    void loadMaterials();
  });

  /**
   * Extracts unique project names from the materials list for the FilterBar.
   * Memoized to prevent recalculation on every re-render.
   */
  const projects = useMemo(
    () => Array.from(new Set(materials.map((m) => m.projectName))),
    [materials],
  );

  /**
   * Opens the interface to record material consumption.
   * @param id - The unique identifier of the material.
   */
  const handleLogUsage = (id: string) => {
    // TODO: Create the function for this and use modal
    console.log('Log usage', id);
  };

  /**
   * Opens the material editor.
   * @param id - The unique identifier of the material.
   */
  const handleEdit = (id: string) => {
    // TODO: Create the function for this and use modal
    console.log('Edit', id);
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
          <Button>
            {/** TODO: Create the function for this one */}
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
    </div>
  );
}
