import 'server-only';

import { requireOrgMember } from '@/lib/dal/auth';
import {
  getServerProjectById,
  getServerProjectMaterials,
} from '@/lib/dal/projects-server';
import {
  renderProjectCostReportPdf,
  type ProjectCostReportMaterial,
} from '@/lib/pdf/project-cost-report-document';
import { PROJECTS_MANAGEMENT } from '@/constants/components/projects/projects-constants';

const PROJECT_COST_EXPORT_ERRORS = {
  permissionDenied:
    'You do not have permission to export this project cost report.',
  projectNotFound: 'Project not found.',
  generationFailed: 'Failed to generate the project cost report PDF.',
};

const FILE_NAME_UNSAFE_CHARS = /[^a-z0-9-]+/g;

/**
 * Outcome of generating a project's cost report PDF: either the rendered
 * file, or an HTTP-mappable error for the caller to surface to the client.
 */
export type ProjectCostExportResult =
  | { ok: true; pdfBytes: Buffer; fileName: string }
  | { ok: false; status: 403 | 404 | 500; message: string };

/**
 * Builds a filesystem- and header-safe PDF filename from a project name.
 */
function buildReportFileName(projectName: string): string {
  const slug = projectName
    .trim()
    .toLowerCase()
    .replace(FILE_NAME_UNSAFE_CHARS, '-')
    .replace(/^-+|-+$/g, '');
  const datePart = new Date().toISOString().slice(0, 10);

  return `project-cost-report-${slug || 'project'}-${datePart}.pdf`;
}

/**
 * Computes the total cost of materials currently assigned to a project.
 */
function sumMaterialsCost(materials: ProjectCostReportMaterial[]): number {
  return materials.reduce(
    (total, material) => total + material.unitQty * material.unitCost,
    0,
  );
}

/**
 * Builds and renders the cost report PDF for a project.
 * Restricted to organization managers (OWNER/FOREMAN), matching the same
 * boundary that gates project budget visibility.
 */
export async function exportProjectCostReportPdf(
  projectId: string,
): Promise<ProjectCostExportResult> {
  const { account } = await requireOrgMember();
  const orgId = account.org_id as string;
  const isManager = PROJECTS_MANAGEMENT.MANAGER_ROLES.includes(
    account.role as (typeof PROJECTS_MANAGEMENT.MANAGER_ROLES)[number],
  );

  if (!isManager) {
    return {
      ok: false,
      status: 403,
      message: PROJECT_COST_EXPORT_ERRORS.permissionDenied,
    };
  }

  let project;
  try {
    project = await getServerProjectById(projectId, orgId, {
      includeBudget: true,
    });
  } catch {
    return {
      ok: false,
      status: 403,
      message: PROJECT_COST_EXPORT_ERRORS.permissionDenied,
    };
  }

  if (!project) {
    return {
      ok: false,
      status: 404,
      message: PROJECT_COST_EXPORT_ERRORS.projectNotFound,
    };
  }

  const materialRows = await getServerProjectMaterials(projectId, orgId);
  const materials: ProjectCostReportMaterial[] = materialRows.map(
    (material) => ({
      id: material.id,
      name: material.name,
      unitCost: material.unit_cost,
      unitQty: material.unit_qty,
    }),
  );

  try {
    const pdfBytes = await renderProjectCostReportPdf({
      projectName: project.project_name,
      status: project.status,
      startDate: project.start_date,
      endDate: project.end_date,
      budgetAmount: project.budget_amount,
      materials,
      totalMaterialsCost: sumMaterialsCost(materials),
      generatedAt: new Date(),
    });

    return {
      ok: true,
      pdfBytes,
      fileName: buildReportFileName(project.project_name),
    };
  } catch {
    return {
      ok: false,
      status: 500,
      message: PROJECT_COST_EXPORT_ERRORS.generationFailed,
    };
  }
}
