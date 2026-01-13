import { IBreadcrumbItem } from "../Helper/Breadcrumbs";

// Maintaining the Library and List Names ...
export class LibraryConstants {
    public static readonly LIST_NAMES = {
        DMS_REQUEST: 'DMS_Request',
        APPROVAL_DETAILS: 'Req_Approval_Lvl_Details',
        USER_CONFIG: 'User_Configuration',

    };

    public static readonly DOCUMENT_LIBRARY = {
        DMS_Library: 'DMS',
        TEMPLATES_Library: 'Form Templates'
    };

    public static readonly ITEMS_PER_PAGE = 25;
}

// Docs Library services ....
export interface IFileInfo {
    Name: string;
    ServerRelativeUrl: string;
    TimeLastModified: string;
    Length: string;
}

export interface IFolderInfo {
    Name: string;
    ServerRelativeUrl: string;
    TimeCreated: string;
    ItemCount?: number;
}

export interface IDocsLibraryProps {
    currentView?: 'list' | 'grid';
    searchTerm?: string;
    onFolderChange: (folderName: string, folderUrl: string) => void;
    onViewChange?: (view: 'list' | 'grid') => void;
    onSearch?: (term: string) => void;
    onAddNew?: () => void;
    onUploadSuccess?: () => void; // Add this if you want to refresh after upload
}

export interface IDocsLibraryRef {
    loadFolder: (path: string) => void;
    loadRootFolder: () => void;
}

// Cache interface for storing folder data
export interface IFolderCache {
    folders: IFolderInfo[];
    files: IFileInfo[];
    breadcrumbs: IBreadcrumbItem[];
    timestamp: number;
    path?: string;
}

// Document Card services ...
export interface IDocumentCardProps {
    name: string;
    date: string;
    size?: string;
    onClick: () => void;
}

// Folder Card services ...
export interface IFolderCardProps {
    name: string;
    date: string;
    onClick: () => void;
}

