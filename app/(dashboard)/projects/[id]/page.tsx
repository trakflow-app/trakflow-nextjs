import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { requireOrgMember } from '@/lib/dal/auth';
import {
  getServerProjectById,
  getServerProjectTools,
  getServerProjectMaterials,
  getServerOrgMembers,
} from '@/lib/dal/projects-server';
import { ProjectHeader } from '@/components/projects/project-header';
import { ProjectToolsSection } from '@/components/projects/project-tools-section';
import { ProjectMaterialsSection } from '@/components/projects/project-materials-section';
import { ProjectTeamSection } from '@/components/projects/project-team-section';
import { Skeleton } from '@/components/ui/skeleton';
import { PROJECTS_MANAGEMENT } from '@/constants/components/projects/projects-constants';

interface ProjectDetailPageProps {
  params: Promise<{ id: string }>;
}

type ProjectSectionProps = {
  orgId: string;
  projectId: string;
};

const PROJECT_DETAIL_SKELETON_ROWS = 3;

function ProjectSectionFallback() {
  return (
    <section className="space-y-3">
      <Skeleton className="h-6 w-40" />
      <div className="rounded-lg border p-4">
        <div className="space-y-3">
          {Array.from({ length: PROJECT_DETAIL_SKELETON_ROWS }).map(
            (_, index) => (
              <Skeleton key={index} className="h-9 w-full" />
            ),
          )}
        </div>
      </div>
    </section>
  );
}

async function ProjectToolsLoader({ orgId, projectId }: ProjectSectionProps) {
  const tools = await getServerProjectTools(projectId, orgId);

  return <ProjectToolsSection tools={tools} />;
}

async function ProjectMaterialsLoader({
  orgId,
  projectId,
}: ProjectSectionProps) {
  const materials = await getServerProjectMaterials(projectId, orgId);

  return <ProjectMaterialsSection materials={materials} />;
}

async function ProjectTeamLoader({ orgId }: ProjectSectionProps) {
  const members = await getServerOrgMembers(orgId);

  return <ProjectTeamSection members={members} />;
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
  const canManageProjects = PROJECTS_MANAGEMENT.MANAGER_ROLES.includes(
    account.role as (typeof PROJECTS_MANAGEMENT.MANAGER_ROLES)[number],
  );
  const project = await getServerProjectById(id, orgId);

  if (!project) notFound();

  return (
    <div className="min-h-screen bg-background px-6 py-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <ProjectHeader
          canManageProjects={canManageProjects}
          project={project}
        />
        <Suspense fallback={<ProjectSectionFallback />}>
          <ProjectToolsLoader projectId={id} orgId={orgId} />
        </Suspense>
        <Suspense fallback={<ProjectSectionFallback />}>
          <ProjectMaterialsLoader projectId={id} orgId={orgId} />
        </Suspense>
        <Suspense fallback={<ProjectSectionFallback />}>
          <ProjectTeamLoader projectId={id} orgId={orgId} />
        </Suspense>
      </div>
    </div>
  );
}
