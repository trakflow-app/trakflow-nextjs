import { notFound } from 'next/navigation';
import { requireOrgMember } from '@/lib/dal/auth';
import {
  getProjectById,
  getProjectTools,
  getProjectMaterials,
  getOrgMembers,
} from '@/lib/dal/projects';
import { ProjectHeader } from '@/components/projects/project-header';
import { ProjectToolsSection } from '@/components/projects/project-tools-section';
import { ProjectMaterialsSection } from '@/components/projects/project-materials-section';
import { ProjectTeamSection } from '@/components/projects/project-team-section';

// ─── Page ─────────────────────────────────────────────────────────────────────

interface ProjectDetailPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Project detail page — displays overview, assigned tools, materials, and team.
 * Accessible by OWNER, FOREMAN, and CREW.
 * Renders 404 if the project does not exist or does not belong to the caller's org.
 */
export default async function ProjectDetailPage({
  params,
}: ProjectDetailPageProps) {
  const { id } = await params;
  const { account } = await requireOrgMember();

  const orgId = account.org_id as string;

  const [project, tools, materials, members] = await Promise.all([
    getProjectById(id, orgId),
    getProjectTools(id, orgId),
    getProjectMaterials(id, orgId),
    getOrgMembers(orgId),
  ]);

  if (!project) notFound();

  return (
    <div className="min-h-screen bg-background px-6 py-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <ProjectHeader project={project} />
        <ProjectToolsSection tools={tools} />
        <ProjectMaterialsSection materials={materials} />
        <ProjectTeamSection members={members} />
      </div>
    </div>
  );
}
