import * as React from 'react';
import { X, Upload, File, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { IUploadModalProps } from './ModalConfig';
import styles from '../Styles/UploadModal.module.scss'
import { SPFI } from "@pnp/sp";
import { getSP } from '../../../../Config/pnpConfig';
import { getCurrentUser } from '../../../../Service/commonService';
import { createDMSRequest } from '../MyRequest/service';

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
    const fileInputRef = React.useRef<HTMLInputElement>(null);

     const sp: SPFI = getSP();

    if (!isOpen) return null;

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
        // Validate file type
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
         if(!selectedFile){
            setError('Please select a file');
            setUploadStatus('error');
            return;
         }


         try{
            setUploading(true);
            setError('');
            setUploadStatus('idle');
            
            //Get current user details
            const user = await getCurrentUser();
            const userEmail = user?.mail || user?.userPrincipalName;
            const userName = user?.displayName;

            if(!userEmail || !userName){
                throw new Error('Unable to get the user information');
            }
            
            //Determine upload folder path
            const folderPath = currentFolderPath || '/sites/Developsite/DMS';
            console.log('Uploading to folder:', folderPath);

            //Upload file to SharePoint document library
            const folder = sp.web.getFolderByServerRelativePath(folderPath);

            const uploadResult = await folder.files.addUsingPath(
                selectedFile.name,
                selectedFile,
                { Overwrite: true }
            )

            const fileUrl = uploadResult.ServerRelativeUrl;
            console.log('File uploaded successfully to:', fileUrl);

            //create DMS requst with approval workflow
            const requestId = await createDMSRequest({
                folderURL: fileUrl,
                requesterName: userName,
                requesterEmail: userEmail
            });

            console.log(`DMS request ${requestId} created successfully`);

            setUploadStatus('success');
            setUploading(false);

            setTimeout(() => {
                if (onUploadSuccess) {
                    onUploadSuccess();
                }
                handleClose();
            }, 1500);

         }catch(error: any){
            console.log("Upload error",error);
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
    

    return (
        <div className={styles.overlay} onClick={handleClose}>
            <div 
                className={styles.modal} 
                onClick={(e) => e.stopPropagation()}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.xls,.xlsx"
                    disabled={uploading}
                />

                <div className={styles.header}>
                    <h2 className={styles.title}>Upload Document</h2>
                    <button className={styles.closeBtn} onClick={handleClose}  disabled={uploading}>
                        <X size={24} />
                    </button>
                </div>

                <div className={styles.body}>
                    {!selectedFile ? (
                        <div
                            className={`${styles.dropZone} ${dragActive ? styles.dragActive : ''}`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            onClick={!uploading ? handleClick : undefined}
                        >   <div className={styles.uploadIconCircle}>
                            <Upload size={32} />
                            </div>
                            <p className={styles.dropText}>
                                Drag & Drop or Click to Upload
                            </p>
                            <p className={styles.orText}>or</p>

                            <p className={styles.supportText}>
                                Supported formats: PDF, DOC, DOCX
                            </p>
                        </div>
                    ) : (
                        <div className={styles.filePreview}>
                            <div className={styles.fileIcon}>
                                <File size={40} />
                            </div>
                            <div className={styles.fileInfo}>
                                <h3 className={styles.fileName}>{selectedFile.name}</h3>
                                <p className={styles.fileSize}>
                                    {formatFileSize(selectedFile.size)} KB
                                </p>
                            </div>
                            {!uploading && uploadStatus !== 'success' && (
                                <button 
                                    className={styles.removeBtn}
                                    onClick={handleRemoveFile}
                                >
                                    <X size={20} />
                                </button>
                            )}
                        </div>
                    )}

                    {uploadStatus === 'success' && (
                        <div className={styles.successMessage}>
                            <CheckCircle size={18} />
                            <span>Document uploaded successfully!</span>
                        </div>
                    )}

                    {uploadStatus === 'error' && (
                        <div className={styles.errorMessage}>
                            <AlertCircle size={24} />
                            <span>{error}</span>
                        </div>
                    )}

                    {uploading && (
                        <div className={styles.uploadingMessage}>
                            <Loader size={18} />
                            <span>Creating approval request...</span>
                        </div>
                    )}
                </div>

                <div className={styles.footer}>
                    
                    <button 
                        className={styles.uploadBtn}
                        onClick={handleUpload}
                        disabled={!selectedFile || uploading || uploadStatus === 'success'}
                    >
                        {uploading ? (
                            <>
                                
                                Uploading...
                            </>
                        ) : uploadStatus === 'success' ? (
                            'Uploaded'
                        ) : (
                            'Upload Document'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UploadModal;
