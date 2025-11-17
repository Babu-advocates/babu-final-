export const getStatusColor = (status: string) => {
  const s = (status || '').toLowerCase();
  switch (s) {
    case 'to be assigned':
    case 'to_be_assigned':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'in_review':
    case 'under review':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'waiting for approval':
    case 'waiting_for_approval':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'completed':
    case 'approved':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'rejected':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'submitted':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'pending documents':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'draft':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'redirected':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    default:
      if (s.startsWith('redirected to ')) {
        return 'bg-purple-100 text-purple-800 border-purple-200';
      }
      return 'bg-muted text-muted-foreground';
  }
};

export const getDisplayStatus = (app: any, isAdminRoute: boolean) => {
  const s = (app?.status || '').toLowerCase();
  if (isAdminRoute) {
    if (s === 'to_be_assigned') return 'To be assigned';
    if (s === 'submitted') return 'Submitted';
    if (s === 'in_review') return 'Under Review';
    if (s === 'completed') return 'Completed';
    if (s === 'rejected') return 'Rejected';
    if (s === 'redirected') return 'Redirected';
    if (s.startsWith('redirected to ')) return s.charAt(0).toUpperCase() + s.slice(1);
  }
  return s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ') : '';
};

export const filterApplications = (
  applications: any[],
  filters: {
    searchTerm: string;
    selectedBank: string;
    selectedBankBranch: string;
    statusFilter: string;
    applicationTypeFilter: string;
    selectedEmployee: string;
    selectedOfficeBranch: string;
    startDate?: Date;
    endDate?: Date;
    isAdminRoute: boolean;
  }
) => {
  return applications.filter(app => {
    const matchesSearch =
      app.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      app.applicationNumber.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      app.bankName.toLowerCase().includes(filters.searchTerm.toLowerCase());

    const matchesBank =
      filters.selectedBank === "all" ||
      app.bankName.toLowerCase().includes(filters.selectedBank.toLowerCase());

    const matchesBankBranch =
      filters.selectedBankBranch === "all" ||
      (app.branch_name && app.branch_name.toLowerCase().includes(filters.selectedBankBranch.toLowerCase()));

    const matchesStatus = filters.statusFilter === "all" || app.status === filters.statusFilter;

    const matchesType =
      filters.isAdminRoute ||
      filters.applicationTypeFilter === "all" ||
      app.applicationType === filters.applicationTypeFilter;

    const matchesEmployee =
      filters.selectedEmployee === "all" || app.assigned_to_username === filters.selectedEmployee;

    const matchesOfficeBranch =
      filters.selectedOfficeBranch === "all" || app.office_branch === filters.selectedOfficeBranch;

    let matchesDateRange = true;
    if (filters.startDate || filters.endDate) {
      const appDate = new Date(app.submission_date || app.date);
      if (filters.startDate && filters.endDate) {
        const start = new Date(filters.startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        matchesDateRange = appDate >= start && appDate <= end;
      } else if (filters.startDate) {
        const start = new Date(filters.startDate);
        start.setHours(0, 0, 0, 0);
        matchesDateRange = appDate >= start;
      } else if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        matchesDateRange = appDate <= end;
      }
    }

    const isNotSubmitted = app.status !== 'submitted';

    return (
      matchesSearch &&
      matchesBank &&
      matchesBankBranch &&
      matchesStatus &&
      matchesType &&
      matchesDateRange &&
      isNotSubmitted &&
      matchesEmployee &&
      matchesOfficeBranch
    );
  });
};
