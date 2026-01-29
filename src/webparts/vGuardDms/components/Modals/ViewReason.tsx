import * as React from 'react';
import styles from '../Styles/ViewReason.module.scss';
import { DateFormatter } from '../utils/DateFormatter';

interface IViewReasonProps {
  isOpen: boolean;
  onClose: () => void;
  reasonData?: {
    approverName: string;
    fileName: string;
    rejectedDate: string;
    comments: string;
  } | null;
}

export const ViewReason: React.FC<IViewReasonProps> = ({
  isOpen,
  onClose,
  reasonData,
}) => {
  if (!isOpen || !reasonData) return null;

  const date = DateFormatter.formatDateTime(reasonData.rejectedDate);

  return (
    <div className={styles.backdrop}>
      <div className={styles.modal}>
        
        <div className={styles.header}>
          <h3 className={styles.title}>Rejection Details</h3>
        </div>

        <div className={styles.body}>
          
          <div className={styles.fileRow}>
            <div>
              <span className={styles.sectionLabel}>Rejected By </span>
              <span>{reasonData.approverName}</span>
            </div>

            <div>
              <span className={styles.fileLabel}>File Name </span>
              <span>{reasonData.fileName}</span>
            </div>

            <div>
              <span className={styles.fileLabel}>Rejected Date </span>
              <span>{date}</span>
            </div>
          </div>

          <hr className={styles.divider} />

          <div>
            <div className={styles.commentsChip}>Comments</div>

            <div className={styles.commentsBox}>
              {reasonData.comments || 'No comments'}
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.closeButton} onClick={onClose}>
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
