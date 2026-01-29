import * as React from 'react';
import { X, Upload, File as FileIcon, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { IUploadModalProps } from './ModalConfig';
import styles from '../Styles/UploadModal.module.scss'
import { SPFI } from "@pnp/sp";
import { getSP } from '../../../../Config/pnpConfig';
import { getCurrentUser } from '../../../../Service/commonService';
import { createDMSRequest } from '../MyRequest/service';
import {
    DefaultButton, Dialog, DialogType, DialogFooter,
    PrimaryButton, Spinner, SpinnerSize,
    MessageBar, MessageBarType
} from '@fluentui/react';
import moment from 'moment';

const UploadModal: React.FC<IUploadModalProps> = ({
    isOpen,
    onClose,
    currentFolderPath,
    onUploadSuccess
}) => {
    const [dragActive, setDragActive] = React.useState(false);
    const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
    const [uploading, setUploading] = React.useState(false);
    const [uploadStatus, setUploadStatus] = React.useState<'idle' | 'success' | 'error'>('idle');
    const [error, setError] = React.useState('');
    const [documentType, setDocumentType] = React.useState('');
    const [mandatoryFields, setMandatoryFields] = React.useState<string[]>([]);
    const [optionalFields, setOptionalFields] = React.useState<string[]>([]);
    const [dynamicValues, setDynamicValues] = React.useState<Record<string,string | Date>>({});
    const [metadataMap, setMetadataMap] = React.useState<Record<string,{ label: string; order: number }>>({});
    const [docTypeChoices, setDocTypeChoices] = React.useState<string[]>([]);

    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const sp: SPFI = getSP();

    React.useEffect(() => {
        const loadChoices = async () => {
        const field = await sp.web.lists
        .getByTitle("DMS_Request")
        .fields.getByInternalNameOrTitle("Document_Type")
        .select("Choices")();
        
        setDocTypeChoices(field.Choices);
    }
   void loadChoices();
},[]);

    React.useEffect(() => {
        const loadMetadataFields = async () => {
            const items = await sp.web.lists
                          .getByTitle("Document_Metadata_Fields")
                          .items
                          .filter("Active eq 1")
                          .select("Title","Field_Id", "Order")();

                const map: any = {};
                items.forEach(i => {
                    map[i.Field_Id] = {
                        label: i.Title,
                        order: i.Order
                    }
                })
                
                setMetadataMap(map);
        };

        void loadMetadataFields();
    },[]);


    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const validateAndSetFile = (file: File) => {
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];

        if (!allowedTypes.includes(file.type)) {
            setError('Only PDF, DOC, DOCX, XLS, XLSX files are allowed');
            setUploadStatus('error');
            return;
        }

        setSelectedFile(file);
        setUploadStatus('idle');
        setError('');
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            validateAndSetFile(file);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            validateAndSetFile(file);
        }
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
        setUploadStatus('idle');
        setError('');
    };

    const handleClose = () => {
        if (!uploading) {
            setSelectedFile(null);
            setUploadStatus('idle');
            setError('');
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            onClose();
        }
    }

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const modalProps = React.useMemo(
        () => ({
            isBlocking: uploading,
            styles: {
                main: {
                    maxWidth: 500,
                },
            },
        }),
        [uploading]
    );

    const dialogContentProps = {
        type: DialogType.close,
        title: 'Upload Document',
        closeButtonAriaLabel: 'Close',
    };

    const handleDocumentTypeChange = async (docType: string) => {
        setDocumentType(docType);

        try {
            const item = await sp.web.lists
                .getByTitle("Document_Type")
                .items
                .filter(`Title eq '${docType}' and Active eq 1`)
                .top(1)();

            if (item.length > 0) {
                // Filter out DTE from mandatory fields
                const mandatory = item[0].Mandatory_Field_Id
                    ?.split(',')
                    .map((f: string) => f.trim())
                    .filter(f => f !== 'DTE'); // Exclude DTE

                // Filter out DTE from optional fields
                const optional = item[0].Optional_Field_Id
                    ?.split(',')
                    .map((f: string) => f.trim())
                    .filter(f => f !== 'DTE'); // Exclude DTE

                setMandatoryFields(mandatory || []);
                setOptionalFields(optional || []);
            } else {
                setMandatoryFields([]);
                setOptionalFields([]);
            }
        } catch (error) {
            console.error("Error fetching document type config", error);
            setMandatoryFields([]);
            setOptionalFields([]);
        }
    }

   
    const sortByOrder = (fields: string[]) =>
        fields
            .filter(f => metadataMap[f])
            .sort((a, b) => metadataMap[a].order - metadataMap[b].order);

    
    const renderInput = (fieldId: string, required: boolean) => {
       
        if (fieldId === 'DTE') {
            return null;
        }

        const meta = metadataMap[fieldId];
        const label = meta?.label || fieldId;

        const isDateField = fieldId === 'ER' || fieldId === 'CD';

        return (
            <div key={fieldId} className={styles.dynamicField}>
                <label>
                    {label} {required && <span style={{ color: 'red' }}>*</span>}
                </label>
                <input
                    type={isDateField ? 'date' : 'text'}
                    value={
                        isDateField && dynamicValues[fieldId] instanceof Date
                            ? moment(dynamicValues[fieldId]).format('YYYY-MM-DD')
                            : (dynamicValues[fieldId] as string) || ''
                    }
                    onChange={(e) =>
                        setDynamicValues(prev => ({
                            ...prev,
                            [fieldId]: isDateField
                                ? new Date(e.target.value)
                                : e.target.value
                        }))
                    }
                />
            </div>
        )
    }

    const handleUpload = async () => {
        if (!selectedFile) {
            setError('Please select a file');
            setUploadStatus('error');
            return;
        }
        try {
          
            for (const field of mandatoryFields) {
                const value = dynamicValues[field];
                if (
                    value === undefined ||
                    value === null ||
                    value === '' ||
                    value instanceof Date && isNaN(value.getTime())
                ) {
                    setError("Please fill mandatory fields");
                    setUploadStatus('error');
                    return;
                }
            }

            setUploading(true);
            setError('');
            setUploadStatus('idle');

            const user = await getCurrentUser();
            const userEmail = user?.mail || user?.userPrincipalName;
            const userName = user?.displayName;

            if (!userEmail || !userName) {
                throw new Error('Unable to get the user information');
            }

            const folderPath = currentFolderPath || '/sites/enterprisedocumenthub-test/DMS';
            console.log('Uploading to folder:', folderPath);

            const folder = sp.web.getFolderByServerRelativePath(folderPath);

            const uploadResult = await folder.files.addUsingPath(
                selectedFile.name,
                selectedFile,
                { Overwrite: true }
            )

            const fileUrl = uploadResult.ServerRelativeUrl;
            const department = dynamicValues["DP"] as string;
            const renewalDate = dynamicValues["ER"] as Date | undefined;

           
            const dmsRequestParams: any = {
                folderURL: fileUrl,
                requesterName: userName,
                requesterEmail: userEmail,
                department: department,
                renewalDate: renewalDate ?? null,
                Document_Type: documentType 
            };

          
            Object.keys(dynamicValues).forEach(fieldId => {
                const value = dynamicValues[fieldId];
                if (value !== undefined && value !== null && value !== '') {
                    if (fieldId !== 'DP' && fieldId !== 'DTE' && fieldId !== 'ER') { 
                        dmsRequestParams[fieldId] = value;
                    }
                }
            });

            const requestId = await createDMSRequest(dmsRequestParams);

            console.log(`DMS request ${requestId} created successfully`);
            
            const spFile = sp.web.getFileByServerRelativePath(fileUrl);
            const fileItem = await spFile.getItem();
           
            const metadataUpdate: any = {
                RequestId: requestId,
                Status: "L1 Approval Pending"
            };
            
            if (dynamicValues["DT"]) {
                metadataUpdate.Title = dynamicValues["DT"];
            } else {
                metadataUpdate.Title = selectedFile.name;
            }
            
            await fileItem.update(metadataUpdate);

            console.log('File uploaded successfully to:', fileUrl);

            setUploadStatus('success');
            setUploading(false);

            setTimeout(() => {
                if (onUploadSuccess) {
                    onUploadSuccess();
                }
                handleClose();
            }, 1500);

        } catch (error: any) {
            console.log("Upload error", error);
            setError(error.message);
            setUploadStatus('error');
            setUploading(false);
        }
    }

    return (
        <Dialog
            hidden={!isOpen}
            onDismiss={handleClose}
            dialogContentProps={dialogContentProps}
            modalProps={{
                isBlocking: uploading,
                styles: {
                    main: {
                        maxWidth: 500,
                    },
                },
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
                    position: 'relative',
                    zIndex: 1001
                }
            }}
        >

          <label className={styles.dateLabel}>
                Document Type <span style={{ color: "red"}}> * </span>
          </label>

          <select
            className={styles.departmentDropdown}
            value={documentType}
            onChange={(e) => handleDocumentTypeChange(e.target.value)}
            disabled={uploading}
          >
             
             <option value="" disabled hidden>Select Document Type</option>
            {docTypeChoices.map(choice => (
               <option key={choice} value={choice}>{choice}</option>
             ))}
          </select>

            <input
                ref={fileInputRef}
                type="file"
                style={{ display: 'none' }}
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.xls,.xlsx"
                disabled={uploading}
            />

            <div className={styles.body}>
                {!selectedFile ? (
                    <div
                        className={`${styles.dropZone} ${dragActive ? styles.dragActive : ''}`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={!uploading ? handleClick : undefined}
                    >
                        <div className={styles.uploadIconCircle}>
                            <Upload size={32} />
                        </div>
                        <p className={styles.dropText}>
                            Drag & Drop or Click to Upload
                        </p>
                        <p className={styles.orText}>or</p>
                        <p className={styles.supportText}>
                            Supported formats: PDF, DOC, DOCX, XLS, XLSX
                        </p>
                    </div>
                ) : (
                    <div className={styles.filePreview}>
                        <div className={styles.fileIcon}>
                            <FileIcon size={40} />
                        </div>
                        <div className={styles.fileInfo}>
                            <h3 className={styles.fileName}>{selectedFile.name}</h3>
                            <p className={styles.fileSize}>
                                {formatFileSize(selectedFile.size)}
                            </p>
                        </div>
                        {!uploading && uploadStatus !== 'success' && (
                            <button
                                className={styles.removeBtn}
                                onClick={handleRemoveFile}
                                disabled={uploading}
                            >
                                <X size={20} />
                            </button>
                        )}
                    </div>
                )}

                {mandatoryFields.length > 0 && (
                    <>
                     <div className={styles.inputGrid}>
                       {sortByOrder(mandatoryFields).map(f => renderInput(f, true))}
                       {sortByOrder(optionalFields).map(f => renderInput(f, false))}
                       </div>
                    </>
                )}

                {uploadStatus === 'success' && (
                    <MessageBar
                        messageBarType={MessageBarType.success}
                        isMultiline={false}
                        styles={{ root: { marginTop: 16 } }}
                    >
                        Document uploaded successfully!
                    </MessageBar>
                )}

                {uploadStatus === 'error' && error && (
                    <MessageBar
                        messageBarType={MessageBarType.error}
                        isMultiline={false}
                        styles={{ root: { marginTop: 16 } }}
                    >
                        {error}
                    </MessageBar>
                )}

                {uploading && (
                    <div className={styles.uploadingMessage}>
                        <Spinner size={SpinnerSize.small} label="Creating approval request..." />
                    </div>
                )}
            </div>

            <DialogFooter>
                <DefaultButton
                    onClick={handleClose}
                    text="Cancel"
                    disabled={uploading}
                />
                <PrimaryButton
                    onClick={handleUpload}
                    text={uploading ? "Uploading..." : uploadStatus === 'success' ? "Uploaded" : "Upload Document"}
                    disabled={!selectedFile || uploading || uploadStatus === 'success' || !documentType || mandatoryFields.some(f => !dynamicValues[f])}
                    styles={{
                        root: { minWidth: 120 }
                    }}
                />
            </DialogFooter>
        </Dialog>
    );
};

export default UploadModal;