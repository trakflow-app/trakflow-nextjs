import { Package } from 'lucide-react';
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
import type { ProjectMaterial } from '@/lib/dal/projects';

const { materials } = PROJECT_DETAIL_MESSAGES;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// ─── Component ────────────────────────────────────────────────────────────────

interface ProjectMaterialsSectionProps {
  materials: ProjectMaterial[];
}

/**
 * Lists all materials assigned to the project in a table.
 * Flags materials at or below their low stock threshold.
 * Shows an empty state when no materials are assigned.
 */
export function ProjectMaterialsSection({
  materials: projectMaterials,
}: ProjectMaterialsSectionProps) {
  if (projectMaterials.length === 0) {
    return (
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{materials.heading}</h2>
        <EmptyState
          icon={Package}
          title={materials.empty.title}
          description={materials.empty.description}
        />
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">{materials.heading}</h2>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{materials.columns.name}</TableHead>
              <TableHead className="w-24">
                {materials.columns.quantity}
              </TableHead>
              <TableHead className="w-32">
                {materials.columns.unitCost}
              </TableHead>
              <TableHead className="w-28">{materials.columns.status}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projectMaterials.map((material) => {
              const isLowStock =
                material.unit_qty <= material.low_stock_threshold;
              return (
                <TableRow key={material.id}>
                  <TableCell className="font-medium">{material.name}</TableCell>
                  <TableCell>{material.unit_qty}</TableCell>
                  <TableCell>{formatCurrency(material.unit_cost)}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        isLowStock
                          ? 'bg-destructive/10 text-destructive'
                          : 'bg-success/10 text-success'
                      }`}
                    >
                      {isLowStock ? materials.lowStock : materials.inStock}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
