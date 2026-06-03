import { CheckCircle2, ClipboardList, Wrench } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ToolRow } from '@/lib/dal/tools';
import { TOOLS_STATS_TEXT } from '@/locales/app/(dashboard)/tools/tools-page-locales';

type ToolsStatsGridProps = {
  tools: ToolRow[];
};

/**
 * Displays summary metrics for the tools inventory.
 */
export function ToolsStatsGrid({ tools }: ToolsStatsGridProps) {
  const totalTools = tools.length;
  const availableTools = tools.filter(
    (tool) => tool.status === 'AVAILABLE',
  ).length;
  const checkedOutTools = tools.filter(
    (tool) => tool.status === 'CHECKEDOUT',
  ).length;
  const serviceTools = tools.filter(
    (tool) =>
      tool.status === 'OUT_OF_SERVICE' ||
      tool.condition === 'DAMAGED' ||
      tool.condition === 'OUT_OF_SERVICE',
  ).length;

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
          <div className="text-2xl font-semibold">{totalTools}</div>
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
          <div className="text-2xl font-semibold">{availableTools}</div>
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
          <div className="text-2xl font-semibold">{checkedOutTools}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Wrench />
            {TOOLS_STATS_TEXT.serviceTools}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">{serviceTools}</div>
        </CardContent>
      </Card>
    </div>
  );
}
