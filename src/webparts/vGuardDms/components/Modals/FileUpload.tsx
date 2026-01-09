import * as React from 'react';
import { X, Upload, FileText } from 'lucide-react';
import { PopupProps } from './ModalConfig';
import styles from '../Styles/FileUpload.module.scss'
import UploadModal from './UploadModal';
import TemplateModal from './TemplateModal';

const FileUpload: React.FC<PopupProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;
    const [isUploadModalOpen, setIsUploadModalOpen] = React.useState(false);
    const [isTemplateModalOpen, setIsTemplateModalOpen] = React.useState(false); 

    const handleNewUploadClick = () => {
        setIsUploadModalOpen(true);
    };

    const handleChooseTemplateClick = () => {
        setIsTemplateModalOpen(true); 
    };

    const handleUploadModalClose = () => {
        setIsUploadModalOpen(false);
    };

    const handleTemplateModalClose = () => {
        setIsTemplateModalOpen(false); 
    };

    return (
        <>
            <div className={styles.overlay} onClick={onClose}>
                <div 
                    className={styles.modal} 
                    onClick={(e) => e.stopPropagation()}>

                    <div className={styles.header}>
                        <h3 className={styles.title}>Add New Document</h3>
                        <button className={styles.closeBtn} onClick={onClose}>
                            <X size={24}/>
                        </button>
                    </div>

                    <div className={styles.body}>
                        <button className={styles.optionCard} onClick={handleNewUploadClick}>
                            <div className={styles.iconCircle}>
                               <Upload size = {32}/>
                            </div>
                            <h4 className={styles.optionTitle}>New Upload</h4>
                            <p className={styles.optionDescription}>
                                Upload a completed document directly from your device.
                            </p>
                        </button>

                        <button className={styles.optionCard} onClick={handleChooseTemplateClick}>
                            <div className={styles.iconCircle}>
                                <FileText size={32} />
                            </div>
                            <h4 className={styles.optionTitle}>Choose Template</h4>
                            <p className={styles.optionDescription}>
                                Select and download a standardized document template.
                            </p>
                        </button>
                    </div>
                </div>
            </div>

            <UploadModal 
                isOpen={isUploadModalOpen}
                onClose={handleUploadModalClose}
            />

            <TemplateModal 
                isOpen={isTemplateModalOpen}
                onClose={handleTemplateModalClose}
            />
        </>
    );
};

export default FileUpload;
