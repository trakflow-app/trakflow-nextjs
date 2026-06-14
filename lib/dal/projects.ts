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
