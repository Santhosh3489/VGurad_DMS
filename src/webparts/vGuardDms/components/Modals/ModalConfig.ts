export interface PopupProps {
    isOpen: boolean;
    onClose: () => void;
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

export interface IUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentFolderPath?: string;
    onUploadSuccess?: () => void;
}


