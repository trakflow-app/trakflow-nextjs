import { Users } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { PROJECT_DETAIL_MESSAGES } from '@/locales/app/(dashboard)/projects/[id]/page-locales';
import type { ProjectTeamMember } from '@/lib/dal/projects';
import type { Database } from '@/lib/types/database.types';

type UserRole = Database['public']['Enums']['user_role'];

const { team } = PROJECT_DETAIL_MESSAGES;

// ─── Style maps ───────────────────────────────────────────────────────────────

const ROLE_BADGE_CLASSES: Record<UserRole, string> = {
  OWNER: 'bg-primary/10 text-primary',
  FOREMAN: 'bg-warning/10 text-warning',
  CREW: 'bg-muted text-muted-foreground',
};

// ─── Component ────────────────────────────────────────────────────────────────

interface ProjectTeamSectionProps {
  members: ProjectTeamMember[];
}

/**
 * Lists all onboarded org members as the project team.
 * v1: shows all org members — no project-specific membership table exists yet.
 */
export function ProjectTeamSection({ members }: ProjectTeamSectionProps) {
  if (members.length === 0) {
    return (
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{team.heading}</h2>
        <EmptyState
          icon={Users}
          title={team.empty.title}
          description={team.empty.description}
        />
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">{team.heading}</h2>
      <div className="rounded-lg border divide-y">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between px-4 py-3"
          >
            <span className="text-sm font-medium">{member.name}</span>
            {member.role && (
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_BADGE_CLASSES[member.role]}`}
              >
                {team.roleLabels[member.role]}
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
