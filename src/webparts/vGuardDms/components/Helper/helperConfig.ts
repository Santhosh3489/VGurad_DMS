// Header service details ..........
export interface IHeaderProps {
    title: string;
    showAddButton?: boolean;
    onAddNew?: () => void;
    showSearch?: boolean;
    onSearch?: (term: string) => void;
    showViewToggle?: boolean;
    currentView?: 'list' | 'grid';
    onViewChange?: (view: 'list' | 'grid') => void;
    activeTabForRequest?: 'pending' | 'completed' | 'rejected' | 'totalRequests';
    onTabChangeForRequest?: (tab: 'pending' | 'completed' | 'rejected' | 'totalRequests') => void;
    pendingCount?: number;
    completedCount?: number;
    rejectedCount?: number;
    totalCount?: number;
    activeTabForApprover?: 'pending' | 'approved' |  'rejected' | 'totalRequests';
    onTabChangeForApprover?: (tab: 'pending' | 'approved' |  'rejected' | 'totalRequests') => void;
}

// Breadcrumb Service Details .............
export interface IBreadcrumb{
    name: string;
    path: string;
}

export interface IBreadcrumbsProps {
    breadcrumbs : IBreadcrumb[];
    onNavigate: (path: string) => void;
}




