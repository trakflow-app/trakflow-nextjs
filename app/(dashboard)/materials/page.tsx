'use client';

import React, { useEffect, useMemo, useState } from 'react';
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

export default function MaterialsPage() {
  const [projectFilter, setProjectFilter] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [materials, setMaterials] = useState<MaterialUI[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMaterials = async () => {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data: account } = await supabase
        .from('accounts')
        .select('org_id')
        .eq('id', user.id)
        .single();

      if (!account?.org_id) {
        setLoading(false);
        return;
      }

      const data = await fetchMaterials(account.org_id, projectFilter);
      setMaterials(data);
      setLoading(false);
    };

    void loadMaterials();
  }, [projectFilter]);

  const projects = useMemo(
    () => Array.from(new Set(materials.map((m) => m.projectName))),
    [materials],
  );

  /**
   * TODO: Create the function for this and use modal
   */
  const handleLogUsage = (id: string) => {
    // placeholder — open modal or log usage flow
    console.log('Log usage', id);
  };

  /**
   * TODO: Create the function for this and use modal
   */
  const handleEdit = (id: string) => {
    // placeholder — open edit form
    console.log('Edit', id);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Materials Management</h1>
          <p className="text-sm text-muted-foreground">
            Track construction materials across sites
          </p>
        </div>

        <div>
          <Button>
            {/** TODO: Create the function for this one */}
            <Plus className="mr-2 h-4 w-4" /> Add Material
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
