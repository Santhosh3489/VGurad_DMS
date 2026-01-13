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
    const [renewalDate, setRenewalDate] = React.useState<string>('');
    const [department, setDepartment] = React.useState<string>('');

    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const departments = ['HR', 'IT', 'Admin'];


    const sp: SPFI = getSP();

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

    const handleUpload = async () => {
        if (!selectedFile) {
            setError('Please select a file');
            setUploadStatus('error');
            return;
        }
        try {
            setUploading(true);
            setError('');
            setUploadStatus('idle');

            const user = await getCurrentUser();
            const userEmail = user?.mail || user?.userPrincipalName;
            const userName = user?.displayName;

            if (!userEmail || !userName) {
                throw new Error('Unable to get the user information');
            }

            const folderPath = currentFolderPath || '/sites/Developsite/DMS';
            console.log('Uploading to folder:', folderPath);

            const folder = sp.web.getFolderByServerRelativePath(folderPath);

            const uploadResult = await folder.files.addUsingPath(
                selectedFile.name,
                selectedFile,
                { Overwrite: true }
            )

            const fileUrl = uploadResult.ServerRelativeUrl;
            const formattedRenewalDate = moment(renewalDate, 'YYYY-MM-DD').toDate();


            const requestId = await createDMSRequest({
                folderURL: fileUrl,
                requesterName: userName,
                requesterEmail: userEmail,
                renewalDate: formattedRenewalDate,
                department: department
            });

            console.log(`DMS request ${requestId} created successfully`);
            const spFile = sp.web.getFileByServerRelativePath(fileUrl);

            const fileItem = await spFile.getItem();
            await fileItem.update({
                RequestId: requestId,
                Status: "L1 Approval Pending"
            })
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

                <div className={styles.renewalDateSection}>
                    <label className={styles.dateLabel}>Renewal Date</label>
                     <input
                        type="date"
                        className={styles.dateInput}
                        value={renewalDate}
                        onChange={(e) => setRenewalDate(e.target.value)}
                        disabled={uploading}
                     />

                     <label className={styles.dateLabel} style={{marginLeft: '20px'}}>Department</label>
                     <select
                       className={styles.departmentDropdown}
                       value={department}
                       onChange={(e) => setDepartment(e.target.value)}
                       disabled={uploading}
                       style={{
                          color: department === "" ? "#333" : "#000",
                          fontWeight: "normal"
                        }}
                     >
                          <option value=""  disabled hidden>Select Department</option>
                          {departments.map((dept) => (
                            <option key={dept} value={dept}>{dept}</option>
                          ))}
                     </select>
                </div>

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
                    disabled={!selectedFile || uploading || uploadStatus === 'success'}
                    styles={{
                        root: { minWidth: 120 }
                    }}
                />
            </DialogFooter>
        </Dialog>
    );
};

export default UploadModal;