import * as React from 'react';
import { SPFI } from '@pnp/sp';
import styles from './DocStyles.module.scss';
import { IDocsLibraryProps, IFileInfo, IFolderCache, IFolderInfo, LibraryConstants } from './DocsLibraryConfig';
import { getSP } from '../../../../Config/pnpConfig';
import FolderCard from './FolderCard';
import DocumentCard from './DocumentCard';
import Breadcrumbs, { IBreadcrumbItem } from '../Helper/Breadcrumbs';
import Header from '../Helper/Header';
import { List, Grid2X2 } from 'lucide-react';

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

  
    const handleAddNew = React.useCallback(() => {
        if(onAddNew){
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

   
    const loadFolder = React.useCallback(async (folderPath: string, forceRefresh: boolean = false): Promise<void> => {
        try {
            const cachedData = folderCacheRef.current.get(folderPath);
            const CACHE_DURATION = 5 * 60 * 1000;
            const now = Date.now();

            if (!forceRefresh && cachedData && (now - cachedData.timestamp) < CACHE_DURATION) {
                setCurrentPath(folderPath);
                setFolders(cachedData.folders);
                setFiles(cachedData.files);
                setBreadcrumbs(cachedData.breadcrumbs);

                const folderName = folderPath.split('/').pop() || LibraryConstants.DOCUMENT_LIBRARY.DMS_Library;
                onFolderChange(folderName, folderPath);

                setError('');
                return;
            }

            setLoading(true);
            setError('');

            const folder = _sp.web.getFolderByServerRelativePath(folderPath);
            const [folderResult, fileResult] = await Promise.all([
                folder.folders(),
                folder.files()
            ]);

            const newBreadcrumbs = buildBreadcrumbs(folderPath);

            folderCacheRef.current.set(folderPath, {
                folders: folderResult || [],
                files: fileResult || [],
                breadcrumbs: newBreadcrumbs,
                timestamp: now
            });

            setCurrentPath(folderPath);
            setFolders(folderResult || []);
            setFiles(fileResult || []);
            setBreadcrumbs(newBreadcrumbs);

            const folderName = folderPath.split('/').pop() || LibraryConstants.DOCUMENT_LIBRARY.DMS_Library;
            onFolderChange(folderName, folderPath);

        } catch (err: any) {
            console.log("Error in loading folder: ", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [buildBreadcrumbs, onFolderChange, _sp]); // ✅ Added dependencies

    
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
        void loadFolder(folder.ServerRelativeUrl);
    }, [loadFolder]);

    const handleFileClick = React.useCallback((file: IFileInfo) => {
        window.open(file.ServerRelativeUrl, '_blank');
    }, []);

    const filteredFolders = React.useMemo(() => {
        if (!actualSearchTerm) return folders;
        return folders.filter(f =>
            f.Name.toLowerCase().includes(actualSearchTerm.toLowerCase())
        );
    }, [folders, actualSearchTerm]);

    const filteredFiles = React.useMemo(() => {
        if (!actualSearchTerm) return files;
        return files.filter(f =>
            f.Name.toLowerCase().includes(actualSearchTerm.toLowerCase())
        );
    }, [files, actualSearchTerm]);

    const handleSearchChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        
        if (externalOnSearch) {
            externalOnSearch(value);
        } else {
            setInternalSearchTerm(value);
        }
    }, [externalOnSearch]);

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
            <Header
                title="Documents"
                showAddButton={true}
                onAddNew={handleAddNew}
                showSearch={false}
            />

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
                        <input
                            type="text"
                            placeholder="Search files..."
                            value={actualSearchTerm}
                            onChange={handleSearchChange}
                            className={styles.searchInput}
                        />
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
                        <p>Loading...</p>
                    </div>
                ) : filteredFolders.length === 0 && filteredFiles.length === 0 && actualSearchTerm ? (
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

                                {filteredFiles.map((file) => (
                                    <DocumentCard
                                        key={file.ServerRelativeUrl}
                                        name={file.Name}
                                        date={file.TimeLastModified}
                                        onClick={() => handleFileClick(file)}
                                    />
                                ))}
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
