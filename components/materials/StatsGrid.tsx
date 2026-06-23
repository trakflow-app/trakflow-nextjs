import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Box, TrendingDown, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/lib/numeric-formatting';
import type { MaterialStats } from '@/lib/dal/materials';
import { statsGrid } from '@/locales/components/materials/stats-grid-locales';

/**
 * Props for the materials summary cards.
 */
type Props = { stats: MaterialStats };

/**
 * Displays material summary metrics from the server-side aggregate query.
 */
export default function StatsGrid({ stats }: Props) {
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
          <div className="text-2xl font-semibold">{stats.totalMaterials}</div>
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
            {formatCurrency(stats.inventoryValue)}
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
          <div className="text-2xl font-semibold">{stats.lowStockCount}</div>
        </CardContent>
      </Card>
    </div>
  );
}
