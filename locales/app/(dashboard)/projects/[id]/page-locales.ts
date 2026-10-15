export const PROJECT_DETAIL_MESSAGES = {
  header: {
    backButton: 'Back to Projects',
    editButton: 'Edit Project',
    budgetLabel: 'Budget',
    startDateLabel: 'Start date',
    endDateLabel: 'End date',
    noEndDate: 'Ongoing',
    noBudget: 'Not set',
    statusLabels: {
      ACTIVE: 'Active',
      COMPLETED: 'Completed',
    },
  },
  tools: {
    heading: 'Assigned Tools',
    columns: {
      tag: 'Tag',
      name: 'Name',
      status: 'Status',
      condition: 'Condition',
    },
    statusLabels: {
      AVAILABLE: 'Available',
      CHECKEDOUT: 'Checked Out',
      OUT_OF_SERVICE: 'Out of Service',
      ARCHIVED: 'Archived',
    },
    conditionLabels: {
      GOOD: 'Good',
      FAIR: 'Fair',
      DAMAGED: 'Damaged',
      OUT_OF_SERVICE: 'Out of Service',
    },
    empty: {
      title: 'No tools assigned',
      description: 'No tools have been assigned to this project yet.',
    },
  },
  materials: {
    heading: 'Assigned Materials',
    columns: {
      name: 'Name',
      quantity: 'Qty',
      unitCost: 'Unit Cost',
      status: 'Status',
    },
    lowStock: 'Low Stock',
    inStock: 'In Stock',
    empty: {
      title: 'No materials assigned',
      description: 'No materials have been assigned to this project yet.',
    },
  },
  team: {
    heading: 'Team',
    roleLabels: {
      OWNER: 'Owner',
      FOREMAN: 'Foreman',
      CREW: 'Crew',
    },
    empty: {
      title: 'No team members',
      description: 'No members found in this organization.',
    },
  },
  costExport: {
    buttonLabel: 'Export Cost PDF',
    fallbackFileName: 'project-cost-report.pdf',
    successToast: 'Project cost PDF downloaded.',
    errorToast: 'Failed to export the project cost PDF. Please try again.',
    report: {
      title: 'Project Cost Report',
      generatedAtLabel: 'Generated',
      detailsHeading: 'Project Details',
      statusLabel: 'Status',
      startDateLabel: 'Start date',
      endDateLabel: 'End date',
      noEndDate: 'Ongoing',
      budgetLabel: 'Budget',
      noBudget: 'Not set',
      materialsHeading: 'Materials Cost',
      materialsEmpty: 'No materials have been assigned to this project.',
      columns: {
        name: 'Name',
        quantity: 'Qty',
        unitCost: 'Unit Cost',
        total: 'Total',
      },
      totalCostLabel: 'Total Project Cost',
      statusLabels: {
        ACTIVE: 'Active',
        COMPLETED: 'Completed',
      },
    },
  },
} as const;
