import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Box, TrendingDown, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/lib/numeric-formatting';
import { Material } from './mockData';

type Props = { materials: Material[] };

export default function StatsGrid({ materials }: Props) {
  const totalMaterials = materials.length;
  const inventoryValue = materials.reduce(
    (acc, m) => acc + m.quantity * m.unitCost,
    0,
  );
  const lowStockCount = materials.filter(
    (m) => m.quantity <= m.minQuantity,
  ).length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Box className="w-5 h-5 text-sky-500" />
            Total Materials
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
            Inventory Value
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
            Low Stock
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">{lowStockCount}</div>
        </CardContent>
      </Card>
    </div>
  );
}
