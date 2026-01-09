import * as React from 'react';
import { X, ExternalLink, Download, FileText, AlertCircle } from 'lucide-react';
import styles from '../Styles/DocumentPreviewModal.module.scss'


interface IDocumentPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    documentUrl?: string;
    documentName: string;
}

const DocumentPreviewModal: React.FC<IDocumentPreviewModalProps> = ({
    isOpen,
    onClose,
    documentUrl,
    documentName
}) => {
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(false);


    if (!isOpen) return null;

    const handleOpenInNewTab = () => {
        console.log("Opening in new tab:", documentUrl);
        if (documentUrl) {
            window.open(documentUrl, '_blank', 'noopener,noreferrer');
        }
    };

    const handleDownload = () => {
        console.log(" Downloading:", documentName);
        if (documentUrl) {
            const link = document.createElement('a');
            link.href = documentUrl;
            link.download = documentName;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const handleIframeLoad = () => {
        console.log(" Preview loaded successfully");
        setLoading(false);
        setError(false);
    };

    const handleIframeError = () => {
        console.log("Preview failed to load");
        setLoading(false);
        setError(true);
    };

    // Build Office Online preview URL
    const getPreviewUrl = () => {
        if (!documentUrl) return '';

        const fileExtension = documentUrl.split('.').pop()?.toLowerCase();
        
        // For Office files, use Office Online viewer
        if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(fileExtension || '')) {
            return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(documentUrl)}`;
        }
        
        // For PDF files, add web=1 parameter for SharePoint preview
        if (fileExtension === 'pdf') {
            return `${documentUrl}?web=1`;
        }

        // For images, return direct URL
        if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension || '')) {
            return documentUrl;
        }

        // Default: try SharePoint preview
        return `${documentUrl}?web=1`;
    };

    const previewUrl = getPreviewUrl();
    const fileExtension = documentUrl?.split('.').pop()?.toLowerCase();
    const isImage = ['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension || '');

    console.log("📄 Document Preview Modal:", {
        isOpen,
        documentUrl,
        documentName,
        previewUrl,
        fileExtension,
        isImage
    });

    React.useEffect(() =>{
        if(isOpen && documentUrl){
            setLoading(true);
            setError(false);
        }
    },[isOpen,documentUrl])

    return (
        
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.titleSection}>
                        <FileText size={20} className={styles.fileIcon} />
                        <h3 className={styles.title} title={documentName}>
                            {documentName}
                        </h3>
                    </div>
                    
                    <div className={styles.headerActions}>
                        <button 
                            className={styles.actionBtn} 
                            onClick={handleDownload}
                            title="Download"
                            disabled={!documentUrl}
                            type="button"
                        >
                            <Download size={18} />
                        </button>
                        <button 
                            className={styles.actionBtn} 
                            onClick={handleOpenInNewTab}
                            title="Open in new tab"
                            disabled={!documentUrl}
                            type="button"
                        >
                            <ExternalLink size={18} />
                        </button>
                        <button 
                            className={styles.closeBtn} 
                            onClick={onClose}
                            title="Close"
                            type="button"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Preview Container */}
                <div className={styles.previewContainer}>
                    {!documentUrl ? (
                        <div className={styles.noPreview}>
                            <AlertCircle size={48} />
                            <p>Document URL not available</p>
                        </div>
                    ) : (
                        <>
                            {loading && (
                                <div className={styles.loadingOverlay}>
                                    <div className={styles.spinner} />
                                    <p>Loading preview...</p>
                                </div>
                            )}

                            {error ? (
                                <div className={styles.errorPreview}>
                                    <AlertCircle size={48} />
                                    <p>Unable to preview this document</p>
                                    <button 
                                        className={styles.retryBtn}
                                        onClick={handleOpenInNewTab}
                                        type="button"
                                    >
                                        Open in New Tab
                                    </button>
                                </div>
                            ) : isImage ? (
                                <div className={styles.imagePreview}>
                                    <img 
                                        src={documentUrl} 
                                        alt={documentName}
                                        onLoad={handleIframeLoad}
                                        onError={handleIframeError}
                                    />
                                </div>
                            ) : (
                                <iframe
                                    src={previewUrl}
                                    className={styles.iframe}
                                    title={documentName}
                                    onLoad={handleIframeLoad}
                                    onError={handleIframeError}
                                />
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
        
    );
};

export default DocumentPreviewModal;
