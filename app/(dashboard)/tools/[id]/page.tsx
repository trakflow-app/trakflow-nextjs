import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import {
  ToolDetailImageSection,
  ToolDetailImageSkeleton,
  ToolDetailView,
} from '@/components/tools/tool-detail-view';
import { requireOrgMember } from '@/lib/dal/auth';
import { getToolById } from '@/lib/dal/tools';
import { isValidToolId } from '@/lib/routes/tools';
import { createClient } from '@/lib/supabase/server';
import { createSignedToolImageUrl } from '@/lib/storage/tool-images';

/**
 * Route params for the tool detail page.
 */
type ToolDetailPageProps = {
  params: Promise<{ id: string }>;
};

/**
 * Data needed to sign and render the tool image separately from the page shell.
 */
type ToolImageLoaderProps = {
  imageStoragePath: string | null;
  toolName: string;
};

/**
 * Signs the private tool image path inside a Suspense boundary.
 */
async function ToolImageLoader({
  imageStoragePath,
  toolName,
}: ToolImageLoaderProps) {
  if (!imageStoragePath) {
    return <ToolDetailImageSection imagePath={null} toolName={toolName} />;
  }

  const supabase = await createClient();
  const signedImageUrl = await createSignedToolImageUrl(
    supabase,
    imageStoragePath,
  );

  return (
    <ToolDetailImageSection imagePath={signedImageUrl} toolName={toolName} />
  );
}

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

  if (!tool) {
    notFound();
  }

  return (
    <ToolDetailView
      tool={tool}
      imageSection={
        <Suspense fallback={<ToolDetailImageSkeleton />}>
          <ToolImageLoader
            imageStoragePath={tool.imageStoragePath}
            toolName={tool.name}
          />
        </Suspense>
      }
    />
  );
}
