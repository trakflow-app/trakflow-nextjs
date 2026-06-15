import { notFound } from 'next/navigation';
import { ToolDetailView } from '@/components/tools/tool-detail-view';
import { requireOrgMember } from '@/lib/dal/auth';
import { getToolById } from '@/lib/dal/tools';
import { isValidToolId } from '@/lib/routes/tools';

type ToolDetailPageProps = {
  params: Promise<{ id: string }>;
};

/**
 * Tool detail page scoped by authenticated org membership.
 */
export default async function ToolDetailPage({ params }: ToolDetailPageProps) {
  const { id } = await params;

  if (!isValidToolId(id)) {
    notFound();
  }

  const { account } = await requireOrgMember();
  const tool = await getToolById(id, account.org_id as string);

  if (!tool) notFound();

  return <ToolDetailView tool={tool} />;
}
