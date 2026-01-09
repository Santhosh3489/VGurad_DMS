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
    activeTabForRequest?: 'pending' | 'completed';
    onTabChangeForRequest?: (tab: 'pending' | 'completed') => void;
    pendingCount?: number;
    completedCount?: number;
    activeTabForApprover?: 'pending' | 'approved';
    onTabChangeForApprover?: (tab: 'pending' | 'approved') => void;
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




