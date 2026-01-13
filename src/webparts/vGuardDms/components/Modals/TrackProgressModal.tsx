import * as React from 'react';
import { X, CheckCircle, Clock, Circle, XCircle } from 'lucide-react';
import { IRequestItem, IApprovalLevel } from '../MyRequest/helperConfig';
import styles from '../Styles/TrackProgressModal.module.scss';
import { DateFormatter } from '../utils/DateFormatter';
import { getApprovalLevelsByRequestId } from '../MyRequest/service';

interface ITrackProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: IRequestItem;
}

const TrackProgressModal: React.FC<ITrackProgressModalProps> = ({
  isOpen,
  onClose,
  request
}) => {
  const [timeline, setTimeline] = React.useState<IApprovalLevel[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);

 //if (!isOpen) return null;


  React.useEffect(() => {
    const loadTimeline = async () => {

    if (!isOpen || !request?.RequestId) return;
      setLoading(true);
      try {
        const data = await getApprovalLevelsByRequestId(request.RequestId);

        const sorted = [...data].sort((a, b) =>
          a.Req_Level.localeCompare(b.Req_Level)
        );
          console.log("TrackProgressModal isOpen:", isOpen);
        setTimeline(sorted);
      } catch (error) {
        console.error('Error fetching approval levels', error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && request?.RequestId) {
     void loadTimeline();
    }
  }, [isOpen, request?.RequestId]);

//   React.useEffect(() => {
//     if (isOpen) {
//       document.body.style.overflow = 'hidden';
//     }
//     return () => {
//       document.body.style.overflow = 'auto';
//     };
//   }, [isOpen]);

  if (!isOpen) return null;

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'Approved':
        return <CheckCircle size={24} className={styles.iconApproved} />;
      case 'Rejected':
        return <XCircle size={24} className={styles.iconRejected} />;
      case 'Pending':
        return <Clock size={24} className={styles.iconPending} />;
      default:
        return <Circle size={24} className={styles.iconNotReached} />;
    }
  };

  const getStatusBadge = (status?: string) => {
    if (status === 'Approved')
      return <span className={styles.badgeApproved}>Approved</span>;
    if (status === 'Pending')
      return <span className={styles.badgePending}>Pending</span>;
    if (status === 'Rejected')
      return <span className={styles.badgeRejected}>Rejected</span>;
    return null;
  };

  const getDocumentName = (url: string) => {
    if (!url) return 'Unknown Document';
    return url.split('/').pop() || 'Unknown Document';
  };


  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <div className={styles.header}>
          <div>
            <h3 className={styles.title}>Approval Timeline</h3>
            <p className={styles.subtitle}>
              {getDocumentName(request.FolderURL)}
            </p>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* BODY */}
        <div className={styles.timeline}>
          {loading && <p className={styles.loading}>Loading...</p>}

          {!loading &&
            Array.isArray(timeline) &&
            timeline.map((level, index) => (
              <div key={level.Id} className={styles.timelineItem}>
                <div className={styles.iconContainer}>
                  {getStatusIcon(level.Level_Status)}
                  {index < timeline.length - 1 && (
                    <div
                      className={`${styles.connector} ${
                        level.Level_Status === 'Approved'
                          ? styles.connectorActive
                          : ''
                      }`}
                    />
                  )}
                </div>

                <div className={styles.content}>
                  <div className={styles.levelHeader}>
                    <span className={styles.levelLabel}>
                      {level.Req_Level}
                    </span>
                    {getStatusBadge(level.Level_Status)}
                  </div>

                  <div className={styles.approverInfo}>
                    <p className={styles.approverName}>
                      {level.Approver_Name ||
                        level.Assigned_UserName ||
                        'Not assigned'}
                    </p>
                    {level.Assigned_MailId && (
                      <p className={styles.approverRole}>
                        {level.Assigned_MailId}
                      </p>
                    )}
                  </div>

                  {level.Approved_Date ? (
                    <p className={styles.timestamp}>
                      {DateFormatter.formatDateTime(level.Approved_Date)}
                    </p>
                  ) : (
                    level.Level_Status === 'Pending' && (
                      <p className={styles.awaitingText}>
                        Awaiting approval
                      </p>
                    )
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default TrackProgressModal;
