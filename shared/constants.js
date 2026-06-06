/** Shared constants between frontend and backend */

const USER_CATEGORIES = ['admin', 'standard'];

const SAMPLE_STATUSES = [
  'inward',
  'planned',
  'inWorkshop',
  'testing',
  'pendingApproval',
  'approved',
  'invoiced',
  'dispatched',
  'onHold',
  'cancelled',
];

const RECEIPT_MODES = ['byHand', 'byCourier', 'byCustomer'];

const VALID_STATUS_TRANSITIONS = {
  inward: ['planned', 'onHold', 'cancelled'],
  planned: ['inWorkshop', 'onHold', 'cancelled'],
  inWorkshop: ['testing', 'onHold', 'cancelled'],
  testing: ['pendingApproval', 'onHold', 'cancelled'],
  pendingApproval: ['approved', 'testing', 'onHold', 'cancelled'],
  approved: ['invoiced', 'onHold'],
  invoiced: ['dispatched'],
  dispatched: [],
  onHold: ['inward', 'planned', 'inWorkshop', 'testing', 'pendingApproval', 'approved'],
  cancelled: [],
};

const SYSTEM_PAGES = [
  { pageName: 'dashboard', label: 'Dashboard' },
  { pageName: 'customers', label: 'Customers' },
  { pageName: 'samples', label: 'Sample Inward' },
  { pageName: 'plans', label: 'Test Plan' },
  { pageName: 'workshop', label: 'Workshop' },
  { pageName: 'results', label: 'Test Results' },
  { pageName: 'approvals', label: 'Approvals' },
  { pageName: 'invoices', label: 'Invoices' },
  { pageName: 'dispatch', label: 'Dispatch' },
  { pageName: 'specifications', label: 'Specifications' },
  { pageName: 'tests', label: 'Test Master' },
  { pageName: 'equipment', label: 'Equipment' },
  { pageName: 'reports', label: 'MIS Reports' },
  { pageName: 'users', label: 'Users' },
  { pageName: 'roles', label: 'Roles' },
  { pageName: 'settings', label: 'Settings' },
];

const buildDefaultPages = () =>
  SYSTEM_PAGES.map(({ pageName }) => ({
    pageName,
    canView: false,
    canAdd: false,
    canEdit: false,
    canDelete: false,
  }));

module.exports = {
  USER_CATEGORIES,
  SAMPLE_STATUSES,
  RECEIPT_MODES,
  VALID_STATUS_TRANSITIONS,
  SYSTEM_PAGES,
  buildDefaultPages,
};
