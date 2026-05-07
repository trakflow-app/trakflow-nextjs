import React from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/numeric-formatting';
import { Material } from './mockData';
import { Box, History, Edit2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { MaterialUI } from '@/app/services/materials-services';

type Props = {
  materials: MaterialUI[];
  projectFilter: string | null;
  searchTerm: string;
  onLogUsage: (id: string) => void;
  onEdit: (id: string) => void;
};

const getStatusLabel = (isLow: boolean) => (isLow ? 'Low Stock' : 'In Stock');

export default function MaterialsTable({
  materials,
  projectFilter,
  searchTerm,
  onLogUsage,
  onEdit,
}: Props) {
  const rows = materials.filter((material) => {
    if (projectFilter && material.projectName !== projectFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        material.name.toLowerCase().includes(q) ||
        material.projectName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const computeMaterialRow = (material: MaterialUI) => {
    const totalValue = material.unitCost * material.quantity;
    const isLow = material.quantity <= material.minQuantity;
    const statusLabel = getStatusLabel(isLow);
    return { totalValue, isLow, statusLabel };
  };

  return (
    <div className="w-full">
      {/* MOBILE VIEW: Hidden on large screens (md:hidden) */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {rows.map((material) => {
          const { totalValue, isLow, statusLabel } =
            computeMaterialRow(material);
          return (
            <div
              key={material.id}
              className="space-y-4 rounded-xl border bg-white p-4 shadow-sm"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <Box className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {material.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {material.projectName}
                    </p>
                  </div>
                </div>
                <Badge
                  className={
                    isLow
                      ? 'border-none bg-destructive/10 text-destructive'
                      : 'border-none bg-success/10 text-success'
                  }
                >
                  {statusLabel}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 border-y border-border py-2">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Quantity
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    {material.quantity} {material.unit}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Total Value
                  </p>
                  <p className="text-sm font-semibold text-primary">
                    {formatCurrency(totalValue)}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => onLogUsage(material.id)}
                  className="h-9 flex-1 gap-2"
                >
                  <History className="w-3 h-3" /> Log Usage
                </Button>
                <Button
                  onClick={() => onEdit(material.id)}
                  variant="outline"
                  className="h-9 flex-1 gap-2"
                >
                  <Edit2 className="w-3 h-3" /> Edit
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* DESKTOP VIEW */}
      <div className="hidden md:block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <Table className="min-w-full">
          <TableHeader className="bg-slate-50/50">
            <TableRow>
              <TableHead className="w-[10%] font-bold text-primary-600 px-4 py-3">
                Material
              </TableHead>
              <TableHead className="w-[10%] font-bold text-primary-600 px-4 py-3">
                Project
              </TableHead>
              <TableHead className="w-[10%] font-bold text-primary-600 px-4 py-3">
                Quantity
              </TableHead>
              <TableHead className="w-[10%] font-bold text-primary-600 px-4 py-3">
                Unit Cost
              </TableHead>
              <TableHead className="w-[10%] font-bold text-primary-600 px-4 py-3">
                Total Value
              </TableHead>
              <TableHead className="w-[10%] text-center font-bold text-primary-600 px-4 py-3">
                Status
              </TableHead>
              <TableHead className="w-[10%] text-right font-bold text-primary-600 px-4 py-3">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((material) => {
              const { totalValue, isLow, statusLabel } =
                computeMaterialRow(material);
              return (
                <TableRow
                  key={material.id}
                  className="group transition-colors hover:bg-slate-50/50"
                >
                  <TableCell className="px-4 py-3 truncate">
                    <div className="flex items-center gap-3 py-1">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                        <Box className="h-4.5 w-4.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 truncate">
                          {material.name}
                        </div>
                        <div className="text-[11px] text-slate-400 font-medium uppercase truncate">
                          {material.unit}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 font-medium text-slate-500 italic truncate">
                    {material.projectName}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="font-semibold text-foreground">
                      {material.quantity}
                    </div>
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
                      Min: {material.minQuantity}
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 tabular-nums text-muted-foreground">
                    {formatCurrency(material.unitCost)}
                  </TableCell>
                  <TableCell className="px-4 py-3 tabular-nums font-bold text-brand-primary">
                    {formatCurrency(totalValue)}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-center">
                    <Badge
                      variant="secondary"
                      className={
                        isLow
                          ? 'border-destructive/10 bg-destructive/10 text-destructive'
                          : 'border-success/10 bg-success/10 text-success'
                      }
                    >
                      {/* Conditional Icon Rendering */}
                      {isLow ? (
                        <AlertTriangle className="w-3 h-3" />
                      ) : (
                        <CheckCircle2 className="w-3 h-3" />
                      )}
                      {statusLabel}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        onClick={() => onLogUsage(material.id)}
                        variant="ghost"
                        size="sm"
                        className="h-8 px-3 text-primary hover:bg-primary hover:text-primary-foreground active:scale-95 transition-all"
                      >
                        <History className="mr-2 h-3.5 w-3.5" />
                        Log Usage
                      </Button>
                      <Button
                        onClick={() => onEdit(material.id)}
                        variant="ghost"
                        className="h-8 px-3 text-secondary hover:bg-secondary hover:text-secondary-foreground active:scale-95 transition-all"
                      >
                        <Edit2 className="mr-2 h-3.5 w-3.5" />
                        Edit
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
