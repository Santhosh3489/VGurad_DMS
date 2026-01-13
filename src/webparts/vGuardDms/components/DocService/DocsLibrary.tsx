import * as React from 'react';
import { SPFI } from '@pnp/sp';
import styles from './DocStyles.module.scss';
import { IDocsLibraryProps, IFileInfo, IFolderCache, IFolderInfo, LibraryConstants } from './DocsLibraryConfig';
import { getSP } from '../../../../Config/pnpConfig';
import FolderCard from './FolderCard';
import DocumentCard from './DocumentCard';
import Breadcrumbs, { IBreadcrumbItem } from '../Helper/Breadcrumbs';
import Header from '../Helper/Header';
import { List, Grid2X2, Search, X } from 'lucide-react';
import { DocsLibraryService } from './DocsService';

const DocsLibrary: React.FC<IDocsLibraryProps> = ({
    currentView,
    searchTerm: initialSearchTerm = '',
    onFolderChange,
    onViewChange: externalOnViewChange,
    onSearch: externalOnSearch,
    onAddNew
}, ref) => {
    const _sp: SPFI = getSP();
    const initialPath = `/sites/Developsite/${LibraryConstants.DOCUMENT_LIBRARY.DMS_Library}`;
    const siteRoot = '/sites/Developsite';

    const [loading, setLoading] = React.useState<boolean>(true);
    const [error, setError] = React.useState<string>('');
    const [folders, setFolders] = React.useState<IFolderInfo[]>([]);
    const [files, setFiles] = React.useState<IFileInfo[]>([]);
    const [currentPath, setCurrentPath] = React.useState<string>(initialPath);
    const [breadcrumbs, setBreadcrumbs] = React.useState<IBreadcrumbItem[]>([]);

    const [internalSearchTerm, setInternalSearchTerm] = React.useState<string>(initialSearchTerm);
    const [internalView, setInternalView] = React.useState<'list' | 'grid'>(currentView || 'list');

    const actualView = currentView !== undefined ? currentView : internalView;
    const actualSearchTerm = initialSearchTerm !== undefined ? initialSearchTerm : internalSearchTerm;

    const folderCacheRef = React.useRef<Map<string, IFolderCache>>(new Map());
    const [history, setHistory] = React.useState<string[]>([initialPath]);
    const [historyIndex, setHistoryIndex] = React.useState<number>(0);
    const isNavigatingRef = React.useRef<boolean>(false);

    const [isSearching, setIsSearching] = React.useState<boolean>(false);
    const [searchResults, setSearchResults] = React.useState<{
        file: IFileInfo;
        folderPath: string;
        relativePath: string;
    }[]>([]);

    // Add search loading state
    const [searchLoading, setSearchLoading] = React.useState<boolean>(false);
    const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    // Create service instance
    const docsLibraryService = React.useMemo(() =>
        new DocsLibraryService(_sp), [_sp]
    );

    const handleAddNew = React.useCallback(() => {
        if (onAddNew) {
            onAddNew(); // call the parent handler
        }
    }, [onAddNew]);

    const buildBreadcrumbs = React.useCallback((path: string): IBreadcrumbItem[] => {
        const libraryRoot = `${siteRoot}/${LibraryConstants.DOCUMENT_LIBRARY.DMS_Library}`;

        if (path === libraryRoot) {
            return [];
        }

        const relativePath = path.replace(libraryRoot, '').replace(/^\/+|\/+$/g, '');

        if (!relativePath) {
            return [];
        }

        const parts = relativePath.split('/').filter(part => part.trim() !== '');
        const breadcrumbItems: IBreadcrumbItem[] = [];
        let accumulatedPath = libraryRoot;

        for (let i = 0; i < parts.length; i++) {
            accumulatedPath += `/${parts[i]}`;
            breadcrumbItems.push({
                name: decodeURIComponent(parts[i]),
                path: accumulatedPath
            });
        }

        return breadcrumbItems;
    }, [siteRoot]);

    const loadFolder = React.useCallback(async (folderPath: string, forceRefresh: boolean = false, searchTerm?: string): Promise<void> => {
        try {
            // Clear search results when not searching
            if (!searchTerm) {
                setSearchResults([]);
                setIsSearching(false);
            }

            const cachedData = folderCacheRef.current.get(folderPath);
            const CACHE_DURATION = 5 * 60 * 1000;
            const now = Date.now();

            // IMPORTANT: Only use cache for the SAME folder path
            // Don't use cache when forceRefresh is true or when searching
            if (!searchTerm && !forceRefresh && cachedData && (now - cachedData.timestamp) < CACHE_DURATION && cachedData.path === folderPath) {
                setCurrentPath(folderPath);
                setFolders(cachedData.folders);
                setFiles(cachedData.files);
                setBreadcrumbs(cachedData.breadcrumbs);
                setSearchResults([]);
                setError('');

                // Call onFolderChange AFTER state is set
                const folderName = folderPath.split('/').pop() || LibraryConstants.DOCUMENT_LIBRARY.DMS_Library;
                onFolderChange(folderName, folderPath);

                setLoading(false);
                return;
            }

            setLoading(true);
            if (searchTerm) {
                setSearchLoading(true);
            }
            setError('');

            let result: { folders: IFolderInfo[], files: IFileInfo[], searchResults?: any[] };

            if (searchTerm && searchTerm.trim()) {
                // Perform recursive search
                setIsSearching(true);
                result = await docsLibraryService.searchRecursive(folderPath, searchTerm);
                setSearchResults(result.searchResults || []);
            } else {
                // Normal folder load
                setIsSearching(false);
                result = await docsLibraryService.getFolderContents(folderPath);
                setSearchResults([]);
            }

            const newBreadcrumbs = buildBreadcrumbs(folderPath);

            // Cache only non-search results
            if (!searchTerm) {
                folderCacheRef.current.set(folderPath, {
                    path: folderPath, // Store the path in cache
                    folders: result.folders || [],
                    files: result.files || [],
                    breadcrumbs: newBreadcrumbs,
                    timestamp: now
                });
            }

            // Update all state together
            setCurrentPath(folderPath);
            setFolders(result.folders || []);
            setFiles(result.files || []);
            setBreadcrumbs(newBreadcrumbs);
            setError('');

            const folderName = folderPath.split('/').pop() || LibraryConstants.DOCUMENT_LIBRARY.DMS_Library;
            onFolderChange(folderName, folderPath);

        } catch (err: any) {
            console.error("Error in loading folder: ", err);
            setError(err.message || 'Failed to load folder');
            setIsSearching(false);
            setSearchResults([]);
        } finally {
            setLoading(false);
            setSearchLoading(false);
        }
    }, [buildBreadcrumbs, onFolderChange, docsLibraryService]);

    // Clear search function
    const handleClearSearch = React.useCallback(() => {
        if (externalOnSearch) {
            externalOnSearch('');
        } else {
            setInternalSearchTerm('');
        }

        // Clear search and load current folder
        void loadFolder(currentPath, false);

        // Clear any pending search timeout
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
            searchTimeoutRef.current = null;
        }
    }, [externalOnSearch, loadFolder, currentPath]);

    // Update the search handler to trigger recursive search with debouncing
    const handleSearchChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;

        if (externalOnSearch) {
            externalOnSearch(value);
        } else {
            setInternalSearchTerm(value);
        }

        // Clear any existing timeout
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        // Set loading state immediately when user starts typing
        if (value.trim()) {
            setSearchLoading(true);
        } else {
            setSearchLoading(false);
        }

        // Debounce search to avoid too many API calls
        searchTimeoutRef.current = setTimeout(() => {
            // Trigger search when typing
            if (value.trim()) {
                void loadFolder(currentPath, false, value);
            } else {
                // Clear search and load current folder
                void loadFolder(currentPath, false);
            }
        }, 300);
    }, [externalOnSearch, loadFolder, currentPath]);

    // Clean up timeout on unmount
    React.useEffect(() => {
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, []);

    React.useEffect(() => {
        loadFolder(initialPath).catch((err) => {
            console.error('Failed to load initial folder:', err);
            setError('Failed to load initial folder');
        });
    }, [loadFolder, initialPath]);
    // Initial load - only on mount
    React.useEffect(() => {
        // Create a wrapper function that doesn't depend on loadFolder
        const loadInitialData = async () => {
            try {
                setLoading(true);
                setError('');

                const result = await docsLibraryService.getFolderContents(initialPath);
                const newBreadcrumbs = buildBreadcrumbs(initialPath);

                setCurrentPath(initialPath);
                setFolders(result.folders || []);
                setFiles(result.files || []);
                setBreadcrumbs(newBreadcrumbs);

                // Call onFolderChange for initial load too
                const folderName = initialPath.split('/').pop() || LibraryConstants.DOCUMENT_LIBRARY.DMS_Library;
                onFolderChange(folderName, initialPath);

            } catch (err: any) {
                console.error('Failed to load initial folder:', err);
                setError('Failed to load initial folder');
            } finally {
                setLoading(false);
            }
        };

        loadInitialData();
    }, []);

    React.useEffect(() => {
        console.log('Current path updated:', currentPath);
    }, [currentPath]);

    // Update filtered files to use search results when searching
    const filteredFiles = React.useMemo(() => {
        if (!actualSearchTerm) return files;

        // When searching recursively, we already have filtered files
        if (isSearching) {
            return files;
        }

        // Client-side filtering for non-recursive search
        return files.filter(f =>
            f.Name.toLowerCase().includes(actualSearchTerm.toLowerCase())
        );
    }, [files, actualSearchTerm, isSearching]);

    // Update filtered folders similarly
    const filteredFolders = React.useMemo(() => {
        if (!actualSearchTerm) return folders;

        if (isSearching) {
            return folders;
        }

        return folders.filter(f =>
            f.Name.toLowerCase().includes(actualSearchTerm.toLowerCase())
        );
    }, [folders, actualSearchTerm, isSearching]);

    React.useEffect(() => {
        if (isNavigatingRef.current) {
            isNavigatingRef.current = false;
            return;
        }

        if (currentPath && currentPath !== history[historyIndex]) {
            const newHistory = history.slice(0, historyIndex + 1);
            newHistory.push(currentPath);
            setHistory(newHistory);
            setHistoryIndex(newHistory.length - 1);
        }
    }, [currentPath, history, historyIndex]);

    React.useImperativeHandle(ref, () => ({
        loadFolder: (path: string) => loadFolder(path, true),
        loadRootFolder: () => loadFolder(initialPath, true)
    }), [loadFolder, initialPath]);


    const handleBreadcrumbNavigate = React.useCallback((path: string) => {
        isNavigatingRef.current = true;

        if (path === '/') {
            void loadFolder(`${siteRoot}/${LibraryConstants.DOCUMENT_LIBRARY.DMS_Library}`);
        } else {
            void loadFolder(path);
        }
    }, [loadFolder, siteRoot]);

    const handleFolderClick = React.useCallback((folder: IFolderInfo) => {
        console.log('Navigating to folder:', folder.ServerRelativeUrl);
        console.log('Current path before navigation:', currentPath);
        void loadFolder(folder.ServerRelativeUrl);
    }, [loadFolder, currentPath]);

    const handleFileClick = React.useCallback((file: IFileInfo) => {
        const officeExtensions = ['.docx', '.doc', '.xlsx', '.xls', '.pptx', '.ppt'];
        const fileExtension = file.Name.substring(file.Name.lastIndexOf('.')).toLowerCase();

        if (officeExtensions.includes(fileExtension)) {
            window.open(`${file.ServerRelativeUrl}?web=1`, '_blank');
        } else {
            window.open(file.ServerRelativeUrl, '_blank');
        }
    }, []);

    const handleViewToggle = React.useCallback((view: 'list' | 'grid') => {
        if (externalOnViewChange) {
            externalOnViewChange(view);
        } else {
            setInternalView(view);
        }
    }, [externalOnViewChange]);


    React.useEffect(() => {
        loadFolder(initialPath).catch((err) => {
            console.error('Failed to load initial folder:', err);
            setError('Failed to load initial folder');
        });
    }, [loadFolder, initialPath]);

    if (error) {
        return (
            <div className={styles.errorContainer}>
                <p>Error: {error}</p>
                <button
                    onClick={() => void loadFolder(currentPath, true)}
                    className={styles.retryBtn}
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Header
                    title={"Documents"}
                    showAddButton={true}
                    onAddNew={handleAddNew}
                    showSearch={false}
                />
                <div >
                    <img src={require('../../assets/VguardLogo.png')} />
                </div>
            </div>

            <div className={styles.navigationBar}>
                <div className={styles.breadcrumbSection}>
                    <Breadcrumbs
                        items={breadcrumbs}
                        onNavigate={handleBreadcrumbNavigate}
                        homeLabel={LibraryConstants.DOCUMENT_LIBRARY.DMS_Library}
                        showHome={true}
                    />
                </div>

                <div className={styles.controlsSection}>
                    <div className={styles.searchBox}>
                        <div className={styles.searchWrapper}>
                            <Search className={styles.searchIcon} size={18} />
                            <input
                                type="text"
                                placeholder="Search files..."
                                value={actualSearchTerm}
                                onChange={handleSearchChange}
                                className={styles.searchInput}
                            />
                            {searchLoading && (
                                <div className={styles.searchLoading}>
                                    <div className={styles.loadingSpinner}></div>
                                </div>
                            )}
                            {actualSearchTerm && !searchLoading && (
                                <button
                                    onClick={handleClearSearch}
                                    className={styles.clearSearchBtn}
                                    title="Clear search"
                                >
                                    <X size={18} />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className={styles.viewToggle}>
                        <button
                            className={`${styles.viewBtn} ${actualView === 'list' ? styles.activeView : ''}`}
                            onClick={() => handleViewToggle('list')}
                            title="List view"
                        >
                            <List size={20} />
                        </button>
                        <button
                            className={`${styles.viewBtn} ${actualView === 'grid' ? styles.activeView : ''}`}
                            onClick={() => handleViewToggle('grid')}
                            title="Grid view"
                        >
                            <Grid2X2 size={20} />
                        </button>
                    </div>
                </div>
            </div>

            <div className={styles.contentWrapper}>
                {loading ? (
                    <div className={styles.loadingContainer}>
                        <div className={styles.spinner}></div>
                        <p>Loading folder contents...</p>
                    </div>
                ) : searchLoading ? (
                    <div className={styles.loadingContainer}>
                        <div className={styles.spinner}></div>
                        <p>Searching for "{actualSearchTerm}"...</p>
                    </div>
                ) : isSearching && filteredFolders.length === 0 && filteredFiles.length === 0 ? (
                    <div className={styles.emptyState}>
                        <p>No documents found matching "{actualSearchTerm}"</p>
                    </div>
                ) : filteredFolders.length === 0 && filteredFiles.length === 0 ? (
                    <div className={styles.emptyState}>
                        <p>No documents found in this folder</p>
                    </div>
                ) : (
                    <>
                        {actualView === 'grid' ? (
                            <div className={styles.gridView}>
                                {filteredFolders.map((folder) => (
                                    <FolderCard
                                        key={folder.ServerRelativeUrl}
                                        name={folder.Name}
                                        date={folder.TimeCreated}
                                        onClick={() => handleFolderClick(folder)}
                                    />
                                ))}

                                {filteredFiles.map((file) => {
                                    return (
                                        <DocumentCard
                                            key={file.ServerRelativeUrl}
                                            name={file.Name}
                                            date={file.TimeLastModified}
                                            onClick={() => handleFileClick(file)}
                                        />
                                    );
                                })}
                            </div>
                        ) : (
                            <div className={styles.listView}>
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th>Document Name</th>
                                            <th>Submission Date</th>
                                            <th>Size</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredFolders.map((folder) => (
                                            <tr
                                                key={folder.ServerRelativeUrl}
                                                onClick={() => handleFolderClick(folder)}
                                                className={styles.tableRow}
                                            >
                                                <td>📁 {folder.Name}</td>
                                                <td>{new Date(folder.TimeCreated).toLocaleDateString()}</td>
                                                <td>{folder.ItemCount || 0} items</td>
                                            </tr>
                                        ))}

                                        {filteredFiles.map((file) => (
                                            <tr
                                                key={file.ServerRelativeUrl}
                                                onClick={() => handleFileClick(file)}
                                                className={styles.tableRow}
                                            >
                                                <td>📄 {file.Name}</td>
                                                <td>{new Date(file.TimeLastModified).toLocaleDateString()}</td>
                                                <td>{(parseInt(file.Length) / 1024).toFixed(2)} KB</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default DocsLibrary;