'use client';

import { useTransition } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PROJECTS_MANAGEMENT } from '@/constants/components/projects/projects-constants';
import { showToast } from '@/lib/toast';
import { PROJECT_DETAIL_MESSAGES } from '@/locales/app/(dashboard)/projects/[id]/page-locales';

const { costExport } = PROJECT_DETAIL_MESSAGES;
const PDF_CONTENT_TYPE = 'application/pdf';
const CONTENT_DISPOSITION_FILENAME_PATTERN = /filename="([^"]+)"/;

interface ProjectCostExportButtonProps {
  projectId: string;
}

/**
 * Downloads the project's cost report as a PDF.
 * Visible only to callers who can already view the project budget (OWNER/FOREMAN).
 */
export function ProjectCostExportButton({
  projectId,
}: ProjectCostExportButtonProps) {
  const [isPending, startTransition] = useTransition();

  function handleExport() {
    startTransition(() => {
      void (async () => {
        try {
          const response = await fetch(
            PROJECTS_MANAGEMENT.ROUTES.projectCostReportApi(projectId),
          );
          const contentType = response.headers.get('content-type') ?? '';

          if (!response.ok || !contentType.includes(PDF_CONTENT_TYPE)) {
            showToast(await readErrorMessage(response), 'error');
            return;
          }

          const blob = await response.blob();
          downloadBlob(blob, getFileNameFromResponse(response));
          showToast(costExport.successToast, 'success');
        } catch {
          showToast(costExport.errorToast, 'error');
        }
      })();
    });
  }

  return (
    <Button variant="outline" isLoading={isPending} onClick={handleExport}>
      <Download data-icon="inline-start" />
      {costExport.buttonLabel}
    </Button>
  );
}

/**
 * Extracts a server-provided error message from a failed export response,
 * falling back to a generic message when the body isn't the expected JSON
 * shape (for example, an HTML redirect to the login page).
 */
async function readErrorMessage(response: Response): Promise<string> {
  try {
    const data: unknown = await response.json();
    const message =
      typeof data === 'object' && data !== null && 'error' in data
        ? (data as { error: unknown }).error
        : null;

    if (typeof message === 'string' && message.length > 0) {
      return message;
    }
  } catch {
    // Response body wasn't JSON — fall back to the generic message below.
  }

  return costExport.errorToast;
}

/**
 * Reads the server-suggested filename from the response's Content-Disposition header.
 */
function getFileNameFromResponse(response: Response): string {
  const disposition = response.headers.get('content-disposition') ?? '';
  const match = CONTENT_DISPOSITION_FILENAME_PATTERN.exec(disposition);

  return match?.[1] ?? costExport.fallbackFileName;
}

/**
 * Triggers a browser download for a PDF blob via a transient anchor element.
 */
function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
