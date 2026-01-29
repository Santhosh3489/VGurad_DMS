import * as React from 'react';
import {
  FileText,
  MoreVertical,
  Clock,
  CheckCircle,
  XCircle,
  FileIcon
} from 'lucide-react';
import { IRequestItem } from './helperConfig';
import styles from './RequestCard.module.scss';
import RequestCardMenu from './RequestCardMenu';
import { DateFormatter } from '../utils/DateFormatter';

interface IRequestCardProps {
  request: IRequestItem;
  onTrackProgressClick: () => void;
  onViewReasonClick: () => void;
}

const RequestCard: React.FC<IRequestCardProps> = ({
  request,
  onTrackProgressClick,
  onViewReasonClick
}) => {
  const [showMenu, setShowMenu] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  const isRejected =
  request.Status === 'Rejected' ||
  request.Level_Status?.toLowerCase().includes('rejected');


  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  
  const getStatusInfo = () => {
    
    if (request.Status === 'Approved' || request.Status === 'Completed') {
      return {
        icon: <CheckCircle size={20} />,
        label: 'Approved',
        className: styles.statusApproved,
        currentApprover: ''
      };
    }

    let currentLevel = request.Level_Status || 'L1';
    currentLevel = currentLevel.replace(/Pending|Rejected|approval/gi, '').trim();

    const approverName =
      request.currentApprover && request.currentApprover.length > 0
        ? request.currentApprover[0]
        : '-';

    if (isRejected) {
      return {
        icon: <XCircle size={20} />,
        label: `Rejected at ${currentLevel}`,
        className: styles.statusRejected,
        currentApprover: approverName
      };
    }

    return {
      icon: <Clock size={20} />,
      label: `Pending at ${currentLevel}`,
      className: styles.statusPending,
      currentApprover: approverName
    };
  };

  const statusInfo = getStatusInfo();

  const getDocumentName = (url: string) => {
    if (!url) return 'Unknown Document';
    const parts = url.split('/');
    return parts[parts.length - 1] || 'Unknown Document';
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.iconWrapper}>
          <FileText size={20} className={styles.fileIcon} />
          <p>{getDocumentName(request.FolderURL)}</p>
        </div>

        <div className={styles.menuWrapper} ref={menuRef}>
          <button
            className={styles.menuButton}
            onClick={() => setShowMenu(!showMenu)}
          >
            <MoreVertical size={18} />
          </button>

          {showMenu && (
            <RequestCardMenu
              request={request}
              onClose={() => setShowMenu(false)}
              onTrackProgressClick={onTrackProgressClick}
            />
          )}
        </div>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.requestInfoRow}>
          <div className={styles.requestInfo}>
            <span
              style={{
                background: '#f5f7fa',
                borderRadius: '4px',
                padding: '3px'
              }}
            >
              <FileIcon size={14} />
            </span>
            <span className={styles.dateLabel}>Requested on</span>
            <span className={styles.dateValue}>
              {DateFormatter.formatDate(request.Created)}
            </span>
          </div>

          {isRejected && (
            <button
              className={styles.viewReason}
              onClick={onViewReasonClick}
            >
              View Reason
            </button>
          )}
        </div>

        <div className={`${styles.statusBadge} ${statusInfo.className}`}>
          {statusInfo.icon}
          <div className={styles.statusInfo}>
            <span>{statusInfo.label}</span>
            {statusInfo.currentApprover && (
              <span>{statusInfo.currentApprover}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestCard;
