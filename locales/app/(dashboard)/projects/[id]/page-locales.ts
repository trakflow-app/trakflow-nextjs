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
} as const;
