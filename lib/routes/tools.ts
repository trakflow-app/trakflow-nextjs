import { TOOLS_MANAGEMENT } from '@/constants/components/tools/tools-constants';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Builds the tool detail path from a validated tool id value.
 */
export function getToolDetailPath(toolId: string) {
  return `${TOOLS_MANAGEMENT.ROUTES.TOOLS_PATH}/${encodeURIComponent(toolId)}`;
}

/**
 * Checks whether a route param has the expected tool id shape before lookup.
 */
export function isValidToolId(value: string) {
  return UUID_PATTERN.test(value);
}
