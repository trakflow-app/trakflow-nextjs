import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Box, TrendingDown, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/lib/numeric-formatting';
import type { MaterialUI } from '@/lib/types/materials-types';
import { statsGrid } from '@/locales/components/materials/stats-grid-locales';

type Props = { materials: MaterialUI[] };

export default function StatsGrid({ materials }: Props) {
  // Total amount of materials per type of material
  const totalMaterials = materials.length;

  // Total value of all materials
  const inventoryValue = materials.reduce(
    (sum, material) => sum + material.quantity * material.unitCost,
    0,
  );

  // Total count of lows stock
  const lowStockCount = materials.filter(
    (material) => material.quantity <= material.minQuantity,
  ).length;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Box className="w-5 h-5 text-sky-500" />
            {statsGrid.totalMaterials}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">{totalMaterials}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-amber-500" />
            {statsGrid.inventoryValue}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">
            {formatCurrency(inventoryValue)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            {statsGrid.lowStock}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">{lowStockCount}</div>
        </CardContent>
      </Card>
    </div>
  );
}
