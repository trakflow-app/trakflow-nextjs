import { exportProjectCostReportPdf } from '@/app/services/project-cost-export-services';

type RouteParams = {
  params: Promise<{ id: string }>;
};

/**
 * Streams a project's cost report as a downloadable PDF.
 * Restricted to organization managers (OWNER/FOREMAN).
 */
export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  const result = await exportProjectCostReportPdf(id);

  if (!result.ok) {
    return Response.json({ error: result.message }, { status: result.status });
  }

  return new Response(new Uint8Array(result.pdfBytes), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${result.fileName}"`,
      'Cache-Control': 'no-store',
    },
  });
}
