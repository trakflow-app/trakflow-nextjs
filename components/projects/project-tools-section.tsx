import { Wrench } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PROJECT_DETAIL_MESSAGES } from '@/locales/app/(dashboard)/projects/[id]/page-locales';
import type { ProjectTool } from '@/lib/dal/projects';
import type { Database } from '@/lib/types/database.types';

type ToolStatus = Database['public']['Enums']['tool_status'];
type ToolCondition = Database['public']['Enums']['tool_condition'];

const { tools } = PROJECT_DETAIL_MESSAGES;

// ─── Style maps ───────────────────────────────────────────────────────────────

const TOOL_STATUS_CLASSES: Record<ToolStatus, string> = {
  AVAILABLE: 'bg-success/10 text-success',
  CHECKEDOUT: 'bg-warning/10 text-warning',
  OUT_OF_SERVICE: 'bg-destructive/10 text-destructive',
  ARCHIVED: 'bg-muted text-muted-foreground',
};

const TOOL_CONDITION_CLASSES: Record<ToolCondition, string> = {
  GOOD: 'bg-success/10 text-success',
  FAIR: 'bg-warning/10 text-warning',
  DAMAGED: 'bg-destructive/10 text-destructive',
  OUT_OF_SERVICE: 'bg-muted text-muted-foreground',
};

// ─── Component ────────────────────────────────────────────────────────────────

interface ProjectToolsSectionProps {
  tools: ProjectTool[];
}

/**
 * Lists all tools assigned to the project in a table.
 * Shows an empty state when no tools are assigned.
 */
export function ProjectToolsSection({
  tools: projectTools,
}: ProjectToolsSectionProps) {
  if (projectTools.length === 0) {
    return (
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{tools.heading}</h2>
        <EmptyState
          icon={Wrench}
          title={tools.empty.title}
          description={tools.empty.description}
        />
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">{tools.heading}</h2>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">{tools.columns.tag}</TableHead>
              <TableHead>{tools.columns.name}</TableHead>
              <TableHead>{tools.columns.status}</TableHead>
              <TableHead>{tools.columns.condition}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projectTools.map((tool) => (
              <TableRow key={tool.id}>
                <TableCell className="font-mono text-sm">
                  #{tool.tag_number}
                </TableCell>
                <TableCell className="font-medium">{tool.name}</TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TOOL_STATUS_CLASSES[tool.status]}`}
                  >
                    {tools.statusLabels[tool.status]}
                  </span>
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TOOL_CONDITION_CLASSES[tool.condition]}`}
                  >
                    {tools.conditionLabels[tool.condition]}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
