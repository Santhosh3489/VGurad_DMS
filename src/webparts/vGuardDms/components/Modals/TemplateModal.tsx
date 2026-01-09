import * as React from 'react';
import { X, Download, Eye, FileText } from 'lucide-react';
import { SPFI } from '@pnp/sp';
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";

import { ITemplate, ITemplateModalProps } from './ModalConfig';
import { getSP } from '../../../../Config/pnpConfig';
import { LibraryConstants } from '../DocService/DocsLibraryConfig';
import styles from '../Styles/TemplateModal.module.scss'

const TemplateModal: React.FC<ITemplateModalProps> = ({ isOpen, onClose }) => {
    const _sp: SPFI = getSP();
    const [templates, setTemplates] = React.useState<ITemplate[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        if (isOpen) {
            void loadTemplates();
        }
    }, [isOpen]);

    const loadTemplates = React.useCallback(async () => {
        try {
            setLoading(true);
            const items = await _sp.web.lists
                .getByTitle(LibraryConstants.DOCUMENT_LIBRARY.TEMPLATES_Library)
                .items
                .select("Id", "Title", "FileRef", "FormName", "FormDescription")
                .filter("FSObjType eq 0")();

            setTemplates(items);
        } catch (error) {
            console.error('Error loading templates:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleDownload = async (template: ITemplate) => {
        try {
            const fileName = template.FormName || template.Title || 'template';
            const fileUrl = template.FileRef;

            // Get server-relative path
            const serverRelativeUrl = fileUrl.includes(window.location.origin)
                ? fileUrl.replace(window.location.origin, '')
                : fileUrl;

            // Get file using PnP JS
            const file = await _sp.web.getFileByServerRelativePath(serverRelativeUrl);

            // Get the blob
            const blob: Blob = await file.getBlob();

            // Create download link
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;

            // Add file extension if needed
            let downloadName = fileName;
            if (!fileName.includes('.')) {
                const name = fileUrl.split('/').pop() || '';
                if (name.includes('.')) {
                    const ext = name.split('.').pop();
                    downloadName = `${fileName}.${ext}`;
                }
            }

            link.download = downloadName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Clean up
            window.URL.revokeObjectURL(url);

        } catch (error) {
            console.error('Error downloading file:', error);

            // Fallback to direct link
            const link = document.createElement('a');
            link.href = `${template.FileRef}?download=1`;
            link.download = template.FormName || template.Title || 'template';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const handlePreview = (template: ITemplate) => {
        // Add web=1 parameter to force browser view for Office documents
        const fileUrl = template.FileRef;

        // Check if the URL already has query parameters
        const separator = fileUrl.includes('?') ? '&' : '?';
        const browserViewUrl = `${fileUrl}${separator}web=1`;

        window.open(browserViewUrl, '_blank');
    };

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Select Template</h2>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <div className={styles.body}>

                    <div className={styles.templateGrid}>
                        {templates.map((template) => (
                            <div key={template.Id} className={styles.templateCard}>
                                <div className={styles.templateIcon}>
                                    <FileText size={32} />
                                </div>
                                <h3 className={styles.templateName}>{template.FormName}</h3>
                                <p className={styles.templateDesc}>{template.FormDescription || 'No description'}</p>
                                <div className={styles.actions}>
                                    <button
                                        className={styles.previewBtn}
                                        onClick={() => handlePreview(template)}
                                    >
                                        <Eye size={16} />
                                        Preview
                                    </button>
                                    <button
                                        className={styles.downloadBtn}
                                        onClick={() => handleDownload(template)}
                                    >
                                        <Download size={16} />
                                        Download
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default TemplateModal;
