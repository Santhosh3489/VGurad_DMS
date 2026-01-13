export interface PopupProps {
    isOpen: boolean;
    onClose: () => void;
    currentFolderPath?: string;  
}

export interface ITemplate {
    Id: number;
    Title: string;
    Description: string;
    FileRef: string;
    FormDescription?: string;
    FormName?: string;
}

export interface ITemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// In ModalConfig.ts (or wherever your interfaces are defined)
export interface IUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentFolderPath?: string;
    onUploadSuccess?: () => void;
}

export interface PopupProps {
    isOpen: boolean;
    onClose: () => void;
    currentFolderPath?: string; 
}