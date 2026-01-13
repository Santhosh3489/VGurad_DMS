import { SPFI } from '@pnp/sp';
import { IFileInfo as IFileInfoCustom, IFolderInfo } from './DocsLibraryConfig';
import { IFileInfo } from '@pnp/sp/files';

export class DocsLibraryService {
    private _sp: SPFI;

    constructor(sp: SPFI) {
        this._sp = sp;
    }

    /**
     * Recursively get all files from a folder and its subfolders
     */
    private async getAllFilesRecursive(folderPath: string, searchTerm?: string): Promise<any[]> {
        try {
            const folder = this._sp.web.getFolderByServerRelativePath(folderPath);
            // Get files from current folder with Status filter
            const files = await folder.files.select(
                'Name',
                'ServerRelativeUrl',
                'TimeCreated',
                'TimeLastModified',
                'Length',
                'ListItemAllFields/Status',
                'ListItemAllFields/ID'
            ).expand('ListItemAllFields')();

            // Filter files by Status = "Completed"
            const completedFiles = files.filter(file =>
                (file as any).ListItemAllFields?.Status === 'Completed'
            );

            // Filter by search term if provided
            let filteredFiles = completedFiles;
            if (searchTerm) {
                filteredFiles = completedFiles.filter(file =>
                    file.Name.toLowerCase().includes(searchTerm.toLowerCase())
                );
            }

            // Get all subfolders
            const subfolders = await folder.folders();
            // Recursively get files from each subfolder
            const subfolderFilesPromises = subfolders.map(subfolder =>
                this.getAllFilesRecursive(subfolder.ServerRelativeUrl, searchTerm)
            );
            const subfolderFilesArrays = await Promise.all(subfolderFilesPromises);

            // Flatten all arrays and combine with current folder files
            const allFiles: any[] = [...filteredFiles];
            subfolderFilesArrays.forEach(files => {
                allFiles.push(...files);
            });
            return allFiles;
        } catch (error: any) {
            console.error(`Error getting files from ${folderPath}:`, error);
            return []; // Return empty array instead of failing completely
        }
    }

    /**
     * Search across current folder and all subfolders
     */
    async searchRecursive(folderPath: string, searchTerm: string): Promise<{
        folders: IFolderInfo[];
        files: IFileInfo[];
        searchResults: {
            file: IFileInfo;
            folderPath: string;
            relativePath: string;
        }[];
    }> {
        try {
            if (!searchTerm.trim()) {
                // If search term is empty, return current folder contents
                const currentContents = await this.getFolderContents(folderPath);
                return {
                    folders: currentContents.folders,
                    files: currentContents.files,
                    searchResults: []
                };
            }
            // Get all files recursively
            const allFiles = await this.getAllFilesRecursive(folderPath, searchTerm);
            // Get folders from current directory that match search term
            const folder = this._sp.web.getFolderByServerRelativePath(folderPath);
            const allFolders = await folder.folders();

            const matchingFolders = allFolders.filter(folder =>
                folder.Name.toLowerCase().includes(searchTerm.toLowerCase())
            );

            // Create search results with folder path information
            const searchResults = allFiles.map(file => {
                const filePath = file.ServerRelativeUrl;
                const parentFolderPath = filePath.substring(0, filePath.lastIndexOf('/'));
                const relativePath = parentFolderPath.replace(folderPath, '').replace(/^\//, '') || 'Current folder';

                return {
                    file,
                    folderPath: parentFolderPath,
                    relativePath: relativePath === '' ? 'Current folder' : relativePath
                };
            });

            return {
                folders: matchingFolders,
                files: allFiles,
                searchResults
            };
        } catch (error: any) {
            console.error('Error in recursive search:', error);
            throw new Error(`Failed to search recursively: ${error.message}`);
        }
    }

    /**
     * Get folders and files from a specific folder path
     */
    async getFolderContents(folderPath: string): Promise<{
        folders: IFolderInfo[];
        files: IFileInfo[];
    }> {
        try {
            const folder = this._sp.web.getFolderByServerRelativePath(folderPath);
            const [folderResult, fileResult] = await Promise.all([
                folder.folders(),
                folder.files.select(
                    'Name',
                    'ServerRelativeUrl',
                    'TimeCreated',
                    'TimeLastModified',
                    'Length',
                    'ListItemAllFields/Status',
                    'ListItemAllFields/ID'
                ).expand('ListItemAllFields')()
            ]);

            // Filter files to only show "Completed" status
            const completedFiles = fileResult.filter(file =>
                (file as any).ListItemAllFields?.Status === 'Completed'
            );
            return {
                folders: folderResult || [],
                files: completedFiles || []
            };
        } catch (error: any) {
            console.error('Error getting folder contents:', error);
            throw new Error(`Failed to load folder contents: ${error.message}`);
        }
    }


    /**
     * Search for items in a folder (optional - if you want server-side search)
     */
    async searchInFolder(folderPath: string, searchTerm: string): Promise<{
        folders: IFolderInfo[];
        files: IFileInfo[];
    }> {
        try {
            const folder = this._sp.web.getFolderByServerRelativePath(folderPath);

            const [folderResult, fileResult] = await Promise.all([
                folder.folders(),
                folder.files()
            ]);
            // Client-side filtering (same as before, but could be moved to server-side)
            const filteredFolders = folderResult.filter(f =>
                f.Name.toLowerCase().includes(searchTerm.toLowerCase())
            );
            const filteredFiles = fileResult.filter(f =>
                f.Name.toLowerCase().includes(searchTerm.toLowerCase())
            );
            return {
                folders: filteredFolders,
                files: filteredFiles
            };
        } catch (error: any) {
            console.error('Error searching folder:', error);
            throw new Error(`Failed to search in folder: ${error.message}`);
        }
    }

    /**
     * Get folder metadata
     */
    async getFolderMetadata(folderPath: string): Promise<any> {
        try {
            const folder = this._sp.web.getFolderByServerRelativePath(folderPath);
            const props = await folder.select('*')();
            return props;
        } catch (error: any) {
            console.error('Error getting folder metadata:', error);
            throw new Error(`Failed to get folder metadata: ${error.message}`);
        }
    }

    /**
     * Get file metadata
     */
    async getFileMetadata(filePath: string): Promise<any> {
        try {
            const file = this._sp.web.getFileByServerRelativePath(filePath);
            const props = await file.select('*')();
            return props;
        } catch (error: any) {
            console.error('Error getting file metadata:', error);
            throw new Error(`Failed to get file metadata: ${error.message}`);
        }
    }

    /**
     * Get file content as text
     */
    async getFileContent(filePath: string): Promise<string> {
        try {
            const file = this._sp.web.getFileByServerRelativePath(filePath);
            const content = await file.getText();
            return content;
        } catch (error: any) {
            console.error('Error getting file content:', error);
            throw new Error(`Failed to get file content: ${error.message}`);
        }
    }

    /**
     * Create a new folder
     */
    async createFolder(parentFolderPath: string, folderName: string): Promise<IFolderInfo> {
        try {
            const folder = this._sp.web.getFolderByServerRelativePath(parentFolderPath);
            const newFolder = await folder.folders.addUsingPath(folderName);
            return newFolder;
        } catch (error: any) {
            console.error('Error creating folder:', error);
            throw new Error(`Failed to create folder: ${error.message}`);
        }
    }

    /**
     * Upload a file
     */
    async uploadFile(folderPath: string, fileName: string, content: Blob | ArrayBuffer): Promise<IFileInfo> {
        try {
            const folder = this._sp.web.getFolderByServerRelativePath(folderPath);
            const uploadedFile = await folder.files.addUsingPath(fileName, content, { Overwrite: true });
            return uploadedFile;
        } catch (error: any) {
            console.error('Error uploading file:', error);
            throw new Error(`Failed to upload file: ${error.message}`);
        }
    }

    /**
     * Delete a file
     */
    async deleteFile(filePath: string): Promise<void> {
        try {
            const file = this._sp.web.getFileByServerRelativePath(filePath);
            await file.delete();
        } catch (error: any) {
            console.error('Error deleting file:', error);
            throw new Error(`Failed to delete file: ${error.message}`);
        }
    }

    /**
     * Delete a folder
     */
    async deleteFolder(folderPath: string): Promise<void> {
        try {
            const folder = this._sp.web.getFolderByServerRelativePath(folderPath);
            await folder.delete();
        } catch (error: any) {
            console.error('Error deleting folder:', error);
            throw new Error(`Failed to delete folder: ${error.message}`);
        }
    }

    /**
     * Rename a file
     */
    async renameFile(filePath: string, newName: string): Promise<IFileInfo> {
        try {
            const file = this._sp.web.getFileByServerRelativePath(filePath);
            const parentPath = filePath.substring(0, filePath.lastIndexOf('/'));
            const newFilePath = `${parentPath}/${newName}`;

            await file.copyTo(newFilePath, true);
            await file.delete();

            const renamedFile = await this._sp.web.getFileByServerRelativePath(newFilePath).select('Name', 'ServerRelativeUrl', 'TimeLastModified', 'Length')();
            return renamedFile;
        } catch (error: any) {
            console.error('Error renaming file:', error);
            throw new Error(`Failed to rename file: ${error.message}`);
        }
    }

    /**
     * Rename a folder
     */
    async renameFolder(folderPath: string, newName: string): Promise<IFolderInfo> {
        try {
            const folder = this._sp.web.getFolderByServerRelativePath(folderPath);
            const parentPath = folderPath.substring(0, folderPath.lastIndexOf('/'));
            const newPath = `${parentPath}/${newName}`;

            await folder.moveByPath(newPath);
            const renamedFolder = await this._sp.web.getFolderByServerRelativePath(newPath).select('Name', 'ServerRelativeUrl', 'TimeCreated')();
            return renamedFolder;
        } catch (error: any) {
            console.error('Error renaming folder:', error);
            throw new Error(`Failed to rename folder: ${error.message}`);
        }
    }
}

// Factory function to create service instance
export const createDocsLibraryService = (sp: SPFI): DocsLibraryService => {
    return new DocsLibraryService(sp);
};

// Singleton instance (optional)
let docsLibraryServiceInstance: DocsLibraryService | null = null;

export const getDocsLibraryService = (sp: SPFI): DocsLibraryService => {
    if (!docsLibraryServiceInstance) {
        docsLibraryServiceInstance = new DocsLibraryService(sp);
    }
    return docsLibraryServiceInstance;
};