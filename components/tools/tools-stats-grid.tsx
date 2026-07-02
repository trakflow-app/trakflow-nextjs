import {
  CheckCircle2,
  ClipboardList,
  Wrench,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ToolStats } from '@/lib/dal/tools';
import { TOOLS_STATS_TEXT } from '@/locales/app/(dashboard)/tools/tools-page-locales';

type ToolsStatsGridProps = {
  stats: ToolStats;
};

/**
 * Displays summary metrics for the tools inventory.
 */
export function ToolsStatsGrid({ stats }: ToolsStatsGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Wrench />
            {TOOLS_STATS_TEXT.totalTools}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">{stats.totalTools}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckCircle2 />
            {TOOLS_STATS_TEXT.availableTools}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">{stats.availableTools}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardList />
            {TOOLS_STATS_TEXT.checkedOutTools}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">{stats.checkedOutTools}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle />
            {TOOLS_STATS_TEXT.serviceTools}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">{stats.serviceTools}</div>
        </CardContent>
      </Card>
    </div>
  );
}
