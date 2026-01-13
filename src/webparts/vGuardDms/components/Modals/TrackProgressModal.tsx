import * as React from 'react';
import { X, CheckCircle, Clock, Circle, XCircle } from 'lucide-react';
import { IRequestItem, IApprovalLevel } from '../MyRequest/helperConfig';
import styles from '../Styles/TrackProgressModal.module.scss';
import { DateFormatter } from '../utils/DateFormatter';
import { getApprovalLevelsByRequestId } from '../MyRequest/service';

export interface ITrackProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: IRequestItem;
}

type LevelStatusType = 'Approved' | 'Pending' | 'notreached' | 'Rejected';

export const TrackProgressModal: React.FC<ITrackProgressModalProps> = ({
  isOpen,
  onClose,
  request,
}) => {
  const [timeline, setTimeline] = React.useState<IApprovalLevel[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    if (isOpen && request) {
      fetchApprovalData();
    }
  }, [isOpen, request]);


  const toLevelStatusType = (status: string): LevelStatusType => {
    if (!status) return 'notreached';
    const s = status.toLowerCase();

    if (s.includes('approved') || s === 'completed') return 'Approved';
    if (s.includes('pending') || s.includes('inprogress')) return 'Pending';
    if (s.includes('rejected')) return 'Rejected';
    if (s.includes('notreached') || s.includes('not reached')) return 'notreached';

    return 'notreached';
  };

  const getLevelNumber = (levelStr: string): number => {
    const match = levelStr?.match(/L(\d+)/i);
    return match ? parseInt(match[1], 10) : 0;
  };


  const fetchApprovalData = async () => {
    try {
      setLoading(true);

      const data = await getApprovalLevelsByRequestId(request.RequestId);
      console.log("Trackprogress data: ",data);
      if (!data || data.length === 0) {
        createFallbackTimeline();
        return;
      }

    
      const normalized = data
        .map(level => ({
          ...level,
          Level_Status: toLevelStatusType(level.Level_Status),
          Req_Level: level.Req_Level || 'L1'
        }))
        .sort((a, b) => getLevelNumber(a.Req_Level) - getLevelNumber(b.Req_Level));

      
      const maxLevel = Math.max(
        3,
        ...normalized.map(l => getLevelNumber(l.Req_Level))
      );

      const completeTimeline: IApprovalLevel[] = [];
      let blockNextLevels = false;

      for (let i = 1; i <= maxLevel; i++) {
        const existing = normalized.find(
          l => getLevelNumber(l.Req_Level) === i
        );

  if (blockNextLevels) {
    // Force not reached
    completeTimeline.push({
      Id: `blocked-${i}`,
      Req_Level: `L${i} Approval`,
      Level_Status: 'notreached',
      Approver_Name: '',
      Assigned_UserName: '',
      Assigned_MailId: '',
      Approved_Date: null,
    });
    continue;
  }

  if (existing) {
    completeTimeline.push(existing);

    
    if (
      existing.Level_Status === 'Pending' ||
      existing.Level_Status === 'Rejected'
    ) {
      blockNextLevels = true;
    }
  } else {
    completeTimeline.push({
      Id: `placeholder-${i}`,
      Req_Level: `L${i} Approval`,
      Level_Status: 'notreached',
      Approver_Name: '',
      Assigned_UserName: '',
      Assigned_MailId: '',
      Approved_Date: null,
    });
  }

      }

      setTimeline(completeTimeline);
    } catch (error) {
      console.error('Error fetching approval levels:', error);
      createFallbackTimeline();
    } finally {
      setLoading(false);
    }
  };

  // Fallback only if API fails
  const createFallbackTimeline = () => {
    const timeline: IApprovalLevel[] = [];

    for (let i = 1; i <= 3; i++) {
      timeline.push({
        Id: `fallback-${i}`,
        Req_Level: `L${i} Approval`,
        Level_Status: 'notreached',
        Approver_Name: '',
        Assigned_UserName: '',
        Assigned_MailId: '',
        Approved_Date: undefined
      });
    }

    setTimeline(timeline);
  };

  const getStatusIcon = (status: LevelStatusType) => {
    switch (status) {
      case 'Approved':
        return <CheckCircle className={styles.iconApproved} />;
      case 'Pending':
        return <Clock className={styles.iconPending} />;
      case 'Rejected':
        return <XCircle className={styles.iconRejected} />;
      default:
        return <Circle className={styles.iconNotReached} />;
    }
  };

  const getStatusBadgeClass = (status: LevelStatusType): string => {
    switch (status) {
      case 'Approved':
        return styles.badgeApproved;
      case 'Pending':
        return styles.badgePending;
      case 'Rejected':
        return styles.badgeRejected;
      default:
        return;
    }
  };

  const getStatusMessage = (level: IApprovalLevel): string => {
    switch (level.Level_Status) {
      case 'Approved':
        return level.Approved_Date
          ? ` ${DateFormatter.formatDateAndTime(level.Approved_Date)}`
          : '';
      case 'Pending':
        return 'Awaiting approval';
      case 'Rejected':
        return `Rejected at ${level.Req_Level}`;
      default:
        return 'Not yet reached';
    }
  };

  const getStatusColorClass = (status) => {
  switch(status) {
    case 'Approved':
      return styles.approved;   // green
    case 'Pending':
      return styles.pending;    // orange
    case 'Rejected':
      return styles.rejected;   // red
    default:
      return styles.default;    // grey or black
  }
};

  const getDocumentName = (url: string) => {
    if (!url) return 'Unknown Document';
    return decodeURIComponent(url.split('/').pop() || 'Unknown Document');
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div>
            <h2 className={styles.modalTitle}>Approval Timeline</h2>
            <div className={styles.modalSubtitle}>
              {getDocumentName(request.FolderURL)}
            </div>
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.modalDivider}></div>

        <div className={styles.timelineContainer}>
          {loading ? (
            <p>Loading approval timeline...</p>
          ) : (
            <div className={styles.timeline}>
              {timeline.map((level, index) => {
                const isLast = index === timeline.length - 1;
                const status = level.Level_Status;

                return (
                  <div key={level.Id} className={styles.timelineItem}>
                    <div className={styles.timelineIconWrapper}>
                      {getStatusIcon(status)}
                      {!isLast && (
                        <div
                          className={`${styles.timelineConnector} ${
                            status === 'Approved'
                              ? styles.connectorApproved
                              : styles.connectorInactive
                          }`}
                        />
                      )}
                    </div>

                    <div className={styles.timelineContent}>
                      <div className={`${styles.levelHeader} ${getStatusColorClass(status)}`}>
                        <span>{level.Req_Level}</span>
                        <span
                          className={`${styles.statusBadge} ${getStatusBadgeClass(
                            status
                          )}`}
                        >
                          {status === 'notreached' ? '' : status}
                        </span>
                      </div>
                      <div className={styles.approverInfo}>
                      {(level.Approver_Name || level.Assigned_UserName) && (
                        <div className={getStatusColorClass(status)}>
                          {level.Approver_Name || level.Assigned_UserName}
                        </div>
                      )}

                      <div className={styles.statusMessage}>
                        {getStatusMessage(level)}
                      </div>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrackProgressModal;
