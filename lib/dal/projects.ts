import { type Database } from '@/lib/types/database.types';

type ProjectTool = Database['public']['Tables']['tools']['Row'];
type ProjectMaterial = Database['public']['Tables']['materials']['Row'];
type OrgMember = Database['public']['Tables']['accounts']['Row'];

/**
 * Minimal project shape used by forms that only need project identity.
 */
export type ProjectOption = {
  id: string;
  name: string;
};

/**
 * Full project row returned by project list and detail reads.
 */
export type ProjectRow = Database['public']['Tables']['projects']['Row'];

/**
 * Project fields that can cross server/client boundaries for every org member.
 */
export type ProjectCrewRow = Pick<
  ProjectRow,
  | 'created_at'
  | 'end_date'
  | 'id'
  | 'org_id'
  | 'project_name'
  | 'start_date'
  | 'status'
>;

/**
 * Project fields that can cross server/client boundaries for project managers.
 */
export type ProjectManagerRow = ProjectCrewRow &
  Pick<ProjectRow, 'budget_amount'>;

/**
 * Project fields rendered by client project surfaces.
 */
export type ProjectClientRow = ProjectCrewRow | ProjectManagerRow;

/**
 * Checks whether a client project row includes manager-only budget fields.
 */
export function hasProjectBudget(
  project: ProjectClientRow,
): project is ProjectManagerRow {
  return 'budget_amount' in project;
}

/**
 * Tool fields rendered by the project detail tools section.
 */
export type ProjectDetailTool = Pick<
  ProjectTool,
  'condition' | 'id' | 'name' | 'status' | 'tag_number'
>;

/**
 * Material fields rendered by the project detail materials section.
 */
export type ProjectDetailMaterial = Pick<
  ProjectMaterial,
  'id' | 'low_stock_threshold' | 'name' | 'unit_cost' | 'unit_qty'
>;

/**
 * Member fields rendered by the project detail team section.
 */
export type ProjectTeamMember = Pick<OrgMember, 'id' | 'name' | 'role'>;
