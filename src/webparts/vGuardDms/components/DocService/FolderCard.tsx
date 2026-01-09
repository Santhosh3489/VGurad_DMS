import * as React from 'react';
import styles from './DocStyles.module.scss'
import { IFolderCardProps } from './DocsLibraryConfig';
import { DateFormatter } from '../utils/DateFormatter';

const FolderCard: React.FC<IFolderCardProps> = ({ name, date, onClick }) => {
    return (
        <div className={styles.card} onClick={onClick}>
            <div className={styles.iconWrapper}>
               📁
            </div>
            <div className={styles.content}>
                <h3 className={styles.name}>{name}</h3>
                <p className={styles.date}>{DateFormatter.formatDate(date)}</p>
            </div>
        </div>
    );
};

export default FolderCard;
