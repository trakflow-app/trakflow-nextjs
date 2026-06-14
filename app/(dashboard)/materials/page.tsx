import { MaterialsClient } from '@/components/materials/materials-client';
import { requireOrgMember } from '@/lib/dal/auth';
import { getServerMaterials } from '@/lib/dal/materials';
import { getProjectsForOrg } from '@/lib/dal/projects-server';

/**
 * Materials management page with server-loaded inventory and project data.
 */
export default async function MaterialsPage() {
  const { account } = await requireOrgMember();
  const orgId = account.org_id as string;
  const [materials, projects] = await Promise.all([
    getServerMaterials(orgId),
    getProjectsForOrg(orgId),
  ]);

  return (
    <MaterialsClient
      initialMaterials={materials}
      orgProjects={projects}
      orgId={orgId}
    />
  );
}
