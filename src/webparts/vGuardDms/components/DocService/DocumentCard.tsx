import * as React from 'react';
import styles from './DocStyles.module.scss'
import { IDocumentCardProps } from './DocsLibraryConfig';
import { DateFormatter } from '../utils/DateFormatter';
import { FileHelper } from '../utils/FileHelper';

const DocumentCard: React.FC<IDocumentCardProps> = ({ name, date, size, onClick }) => {
    return (
        <div className={styles.card} onClick={onClick}>
            <div className={styles.iconWrapper}>
                <span className={styles.fileIcon}>
                    {FileHelper.getFileIcon(name)}
                </span>
            </div>
            <div className={styles.content}>
                <h3 className={styles.name}>{name}</h3>
                <p className={styles.meta}>
                    {DateFormatter.formatDate(date)} 
                    {size && FileHelper.formatFileSize(size)}
                </p>
            </div>
        </div>
    );
};

export default DocumentCard;
