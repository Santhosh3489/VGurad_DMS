// FileUpload.tsx - UPDATED VERSION
import * as React from 'react';
import { Upload, FileText } from 'lucide-react';
import {
    Drawer,
    DrawerHeader,
    DrawerHeaderTitle,
    DrawerBody,
    Button,
    FluentProvider,
    webLightTheme, 
    IdPrefixProvider
} from '@fluentui/react-components';
import { Dismiss24Regular } from '@fluentui/react-icons';
import { PopupProps } from './ModalConfig';
import UploadModal from './UploadModal';
import TemplateModal from './TemplateModal';
import styles from '../Styles/FileUpload.module.scss';

const FileUpload: React.FC<PopupProps> = ({ isOpen, onClose, currentFolderPath }) => {
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

    // Close the drawer when any modal opens
    React.useEffect(() => {
        if (isUploadModalOpen || isTemplateModalOpen) {
            // Temporarily hide the drawer content
        }
    }, [isUploadModalOpen, isTemplateModalOpen]);

    return (
        <>
            {/* Conditionally render modals first when they are open */}
            {(isUploadModalOpen || isTemplateModalOpen) && (
                <>
                    <UploadModal
                        isOpen={isUploadModalOpen}
                        onClose={handleUploadModalClose}
                        currentFolderPath={currentFolderPath}
                        onUploadSuccess={() => {
                            handleUploadModalClose();
                            onClose(); // Also close the drawer on success
                        }}
                    />

                    <TemplateModal
                        isOpen={isTemplateModalOpen}
                        onClose={handleTemplateModalClose}
                    />
                </>
            )}

            {/* Only show drawer if no modal is open AND drawer is open */}
            {isOpen && !isUploadModalOpen && !isTemplateModalOpen && (
                <IdPrefixProvider value="Doc-Drawer">
                    <FluentProvider theme={webLightTheme}>
                        <Drawer
                            open={isOpen}
                            position="end"
                            size="large"
                            onOpenChange={(_, { open }) => {
                                if (!open) onClose();
                            }}
                        >
                            <DrawerHeader style={{ borderBottom: '1px solid #363636', paddingBottom: '8px' }}>
                                <DrawerHeaderTitle
                                    action={
                                        <Button
                                            appearance="subtle"
                                            aria-label="Close"
                                            icon={<Dismiss24Regular />}
                                            onClick={onClose}
                                        />
                                    }
                                >
                                    Add New Document
                                </DrawerHeaderTitle>
                            </DrawerHeader>

                            <DrawerBody style={{ width: '100%', display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-start', alignItems: 'flex-start', paddingTop: '3%' }}>
                                <div className={styles.body}>
                                    <Button
                                        appearance="transparent"
                                        className={styles.optionCard}
                                        onClick={handleNewUploadClick}
                                    >
                                        <div className={styles.iconCircle}>
                                            <Upload size={32} />
                                        </div>
                                        <h4 className={styles.optionTitle}>New Upload</h4>
                                        <p className={styles.optionDescription}>
                                            Upload a completed document directly from your device.
                                        </p>
                                    </Button>

                                    <Button
                                        appearance="transparent"
                                        className={styles.optionCard}
                                        onClick={handleChooseTemplateClick}
                                    >
                                        <div className={styles.iconCircle}>
                                            <FileText size={32} />
                                        </div>
                                        <h4 className={styles.optionTitle}>Choose Template</h4>
                                        <p className={styles.optionDescription}>
                                            Select and download a standardized document template.
                                        </p>
                                    </Button>
                                </div>
                            </DrawerBody>
                        </Drawer>
                    </FluentProvider>
                </IdPrefixProvider>
            )}
        </>
    );
};

export default FileUpload;