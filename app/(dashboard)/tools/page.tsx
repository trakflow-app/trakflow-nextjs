import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ToolsList } from '@/components/tools/tools-list';
import { ToolsStatsGrid } from '@/components/tools/tools-stats-grid';
import { requireOrgMember } from '@/lib/dal/auth';
import { getTools } from '@/lib/dal/tools';
import { TOOLS_PAGE_TEXT } from '@/locales/app/(dashboard)/tools/tools-page-locales';

/**
 * Tools page that fetches organization tools and renders inventory summaries.
 */
export default async function ToolsPage() {
  const { account } = await requireOrgMember();
  const tools = await getTools(account.org_id as string);

  return (
    <div className="min-h-screen bg-background px-6 py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {TOOLS_PAGE_TEXT.title}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {TOOLS_PAGE_TEXT.subtitle}
            </p>
          </div>
          <Button disabled>
            <Plus />
            {TOOLS_PAGE_TEXT.addToolButton}
          </Button>
        </div>

        <ToolsStatsGrid tools={tools} />
        <ToolsList tools={tools} />
      </div>
    </div>
  );
}
