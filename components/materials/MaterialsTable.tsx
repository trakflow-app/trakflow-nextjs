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
import { Box, History, Edit2 } from 'lucide-react';

type Props = {
  materials: Material[];
  projectFilter: string | null;
  searchTerm: string;
  onLogUsage: (id: string) => void;
  onEdit: (id: string) => void;
};

export default function MaterialsTable({
  materials,
  projectFilter,
  searchTerm,
  onLogUsage,
  onEdit,
}: Props) {
  const rows = materials.filter((material) => {
    if (projectFilter && material.project !== projectFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        material.name.toLowerCase().includes(q) ||
        material.project.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="w-full">
      {/* MOBILE VIEW: Hidden on large screens (md:hidden) */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {rows.map((m) => {
          const isLow = m.quantity <= m.minQuantity;
          return (
            <div
              key={m.id}
              className="bg-white p-4 rounded-xl border shadow-sm space-y-4"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                    <Box className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{m.name}</h3>
                    <p className="text-xs text-muted-foreground">{m.project}</p>
                  </div>
                </div>
                <Badge
                  className={
                    isLow
                      ? 'bg-red-100 text-red-800 border-none'
                      : 'bg-green-100 text-green-800 border-none'
                  }
                >
                  {isLow ? 'Low' : 'In Stock'}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 py-2 border-y border-slate-50">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                    In Stock
                  </p>
                  <p className="text-sm font-semibold">
                    {m.quantity} {m.unit}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                    Total Value
                  </p>
                  <p className="text-sm font-semibold text-sky-600">
                    {formatCurrency(m.unitCost * m.quantity)}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => onLogUsage(m.id)}
                  className="flex-1 gap-2 bg-sky-600 hover:bg-sky-700 h-9 text-xs"
                >
                  <History className="w-3 h-3" /> Log Usage
                </Button>
                <Button
                  onClick={() => onEdit(m.id)}
                  variant="outline"
                  className="flex-1 gap-2 h-9 text-xs"
                >
                  <Edit2 className="w-3 h-3" /> Edit
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* DESKTOP VIEW: Hidden on small screens (hidden md:block) */}
      <div className="hidden md:block overflow-hidden bg-white rounded-xl border shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow>
              <TableHead className="font-bold text-slate-700">
                Material
              </TableHead>
              <TableHead className="font-bold text-slate-700">
                Project
              </TableHead>
              <TableHead className="text-right font-bold text-slate-700">
                Quantity
              </TableHead>
              <TableHead className="text-right font-bold text-slate-700">
                Unit Cost
              </TableHead>
              <TableHead className="text-right font-bold text-slate-700">
                Total Value
              </TableHead>
              <TableHead className="font-bold text-slate-700 text-center">
                Status
              </TableHead>
              <TableHead className="text-right font-bold text-slate-700">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((m) => {
              const totalValue = m.unitCost * m.quantity;
              const isLow = m.quantity <= m.minQuantity;
              return (
                <TableRow
                  key={m.id}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-100 rounded flex items-center justify-center">
                        <Box className="w-4 h-4 text-slate-500" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">
                          {m.name}
                        </div>
                        <div className="text-xs text-muted-foreground italic">
                          {m.unit}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-600 font-medium">
                    {m.project}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="font-bold text-slate-900">{m.quantity}</div>
                    <div className="text-[10px] text-slate-400 font-medium uppercase">
                      Min: {m.minQuantity}
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-slate-600 tabular-nums">
                    {formatCurrency(m.unitCost)}
                  </TableCell>
                  <TableCell className="text-right font-bold text-sky-600 tabular-nums">
                    {formatCurrency(totalValue)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant="secondary"
                      className={
                        isLow
                          ? 'bg-red-50 text-red-700 border-red-100'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                      }
                    >
                      {isLow ? 'Low Stock' : 'In Stock'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        onClick={() => onLogUsage(m.id)}
                        variant="ghost"
                        size="sm"
                        className="text-sky-600 hover:text-sky-700 hover:bg-sky-50"
                      >
                        {/** TODO Logic */}
                        Log Usage
                      </Button>
                      <Button
                        onClick={() => onEdit(m.id)}
                        variant="ghost"
                        size="sm"
                        className="text-slate-400 hover:text-slate-600"
                      >
                        {/** TODO Logic */}
                        Log Usage Edit
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
