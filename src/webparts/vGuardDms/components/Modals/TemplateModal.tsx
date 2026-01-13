import * as React from 'react';
import { X, Download, Eye, FileText } from 'lucide-react';
import { SPFI } from '@pnp/sp';
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import {
    Dialog,
    DialogType,
    DialogFooter,
    DefaultButton,
    Spinner,
    SpinnerSize,
    MessageBar,
    MessageBarType,
    IconButton,
    IIconProps,
    Stack,
    Text,
    IStackTokens
} from '@fluentui/react';
import { ITemplate, ITemplateModalProps } from './ModalConfig';
import { getSP } from '../../../../Config/pnpConfig';
import { LibraryConstants } from '../DocService/DocsLibraryConfig';
import styles from '../Styles/TemplateModal.module.scss'

const css = `
.ms-Dialog-main {
min-width: 75% !important;
}
`;

const TemplateModal: React.FC<ITemplateModalProps> = ({ isOpen, onClose }) => {
    const _sp: SPFI = getSP();
    const [templates, setTemplates] = React.useState<ITemplate[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string>('');

    const downloadIconProps: IIconProps = { iconName: 'Download' };
    const viewIconProps: IIconProps = { iconName: 'View' };

    React.useEffect(() => {
        if (isOpen) {
            void loadTemplates();
        } else {
            // Reset state when modal closes
            setTemplates([]);
            setError('');
        }
    }, [isOpen]);

    const loadTemplates = React.useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const items = await _sp.web.lists
                .getByTitle(LibraryConstants.DOCUMENT_LIBRARY.TEMPLATES_Library)
                .items
                .select("Id", "Title", "FileRef", "FormName", "FormDescription")
                .filter("FSObjType eq 0")();

            setTemplates(items);
        } catch (error) {
            console.error('Error loading templates:', error);
            setError('Failed to load templates. Please try again.');
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
            setError('Failed to download template. Using fallback method.');

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

    const modalProps = React.useMemo(
        () => ({
            isBlocking: false,
            styles: {
                main: {
                    zIndex: 1001
                },
            },
        }),
        []
    );

    const dialogContentProps = {
        type: DialogType.close,
        title: 'Select Template',
        closeButtonAriaLabel: 'Close',
    };

    return (
        <>
            <style>{css}</style>
            <Dialog
                hidden={!isOpen}
                onDismiss={onClose}
                dialogContentProps={dialogContentProps}
                modalProps={{
                    ...modalProps,
                    layerProps: {
                        styles: {
                            root: {
                                zIndex: 1002  // Higher than drawer's z-index
                            }
                        }
                    }
                }}
                styles={{
                    main: {
                        minWidth: '75%',
                        // Ensure dialog container has proper z-index
                        position: 'relative'
                    }
                }}
            >
                <div className={styles.body}>
                    {error && (
                        <MessageBar
                            messageBarType={MessageBarType.error}
                            isMultiline={false}
                            styles={{ root: { marginBottom: 16 } }}
                            onDismiss={() => setError('')}
                            dismissButtonAriaLabel="Close"
                        >
                            {error}
                        </MessageBar>
                    )}

                    {loading ? (
                        <div className={styles.loadingContainer}>
                            <Spinner
                                size={SpinnerSize.medium}
                                label="Loading templates..."
                            />
                        </div>
                    ) : templates.length === 0 ? (
                        <MessageBar
                            messageBarType={MessageBarType.info}
                            styles={{ root: { margin: '20px 0' } }}
                        >
                            No templates available.
                        </MessageBar>
                    ) : (
                        <div className={styles.templateGrid}>
                            {templates.map((template) => (
                                <div key={template.Id} className={styles.templateCard}>
                                    <div className={styles.templateIcon}>
                                        <FileText size={30} />
                                    </div>
                                    <Text variant="mediumPlus" block styles={{ root: { fontWeight: 600 } }}>
                                        {template.FormName || 'No Title'}
                                    </Text>
                                    <Text variant="small" block styles={{ root: { color: '#666' } }}>
                                        {template.FormDescription || 'No description'}
                                    </Text>
                                    <Stack horizontal horizontalAlign="space-between">
                                        <div onClick={() => handlePreview(template)} style={{ padding: '5px 12px', borderRadius: '30px', backgroundColor: '#F2F2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px', cursor: 'pointer' }}>
                                            <IconButton
                                                iconProps={viewIconProps}
                                                title="Preview template"
                                                ariaLabel="Preview template"
                                                styles={{
                                                    root: { color: '#282828' },
                                                    rootHovered: { backgroundColor: 'transparent' }
                                                }}
                                            />
                                            <span style={{ color: '#282828' }}>Preview</span></div>
                                        <div onClick={() => handleDownload(template)} style={{ display: 'flex', alignItems: 'center', gap: '2px', cursor: 'pointer' }}>
                                            <IconButton
                                                iconProps={downloadIconProps}
                                                title="Download template"
                                                ariaLabel="Download template"
                                                styles={{
                                                    root: { color: '#EE9B01' },
                                                    rootHovered: { backgroundColor: 'transparent' }
                                                }}
                                            />
                                            <span style={{ color: '#EE9B01' }}>Download</span></div>
                                    </Stack>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <DefaultButton
                        onClick={onClose}
                        text="Close"
                    />
                </DialogFooter>
            </Dialog>
        </>
    );
};

export default TemplateModal;