export const MATERIALS_MANAGEMENT = {
  ROUTES: {
    MATERIALS_PATH: '/materials',
  },
  DEFAULTS: {
    FIRST_PAGE: 1,
    PAGE_SIZE: 10,
  },
  FILTERS: {
    ALL_PROJECTS: '__all__',
  },
  PAGE_SIZES: {
    SMALL: 10,
    MEDIUM: 25,
    LARGE: 50,
  },
  SEARCH_DEBOUNCE_MS: 300,
  PAGE_SUMMARY_TOKENS: {
    CURRENT_PAGE: '{currentPage}',
    TOTAL_PAGES: '{totalPages}',
  },
  QUERY_PARAMS: {
    page: 'page',
    pageSize: 'pageSize',
    project: 'project',
    search: 'search',
  },
} as const;
