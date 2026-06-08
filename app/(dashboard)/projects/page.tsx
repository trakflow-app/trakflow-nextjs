import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProjectsList } from '@/components/projects/projects-list';
import { requireOrgMember } from '@/lib/dal/auth';
import { getServerProjects } from '@/lib/dal/projects-server';

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_TITLE = 'Projects';
const PAGE_DESCRIPTION = 'Manage your construction projects';
const NEW_PROJECT_BUTTON = 'New Project';

// ─── Page ─────────────────────────────────────────────────────────────────────

/**
 * Projects list page — fetches all org projects server-side and passes them
 * to the ProjectsList client component for search, filter, and navigation.
 */
export default async function ProjectsPage() {
  const { account } = await requireOrgMember();
  const projects = await getServerProjects(account.org_id as string);

  return (
    <div className="min-h-screen bg-background px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{PAGE_TITLE}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {PAGE_DESCRIPTION}
            </p>
          </div>
          <Button>
            <Plus />
            {NEW_PROJECT_BUTTON}
          </Button>
        </div>

        <ProjectsList projects={projects} />
      </div>
    </div>
  );
}
