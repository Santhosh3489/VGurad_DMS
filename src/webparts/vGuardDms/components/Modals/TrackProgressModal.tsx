import * as React from 'react';
import { X, CheckCircle, Clock, Circle, XCircle } from 'lucide-react';
import { IRequestItem, IApprovalLevel } from '../MyRequest/helperConfig';
import styles from '../Styles/TrackProgressModal.module.scss';
import { DateFormatter } from '../utils/DateFormatter';


interface ITrackProgressModalProps {
    isOpen: boolean;
    onClose: () => void;
    request: IRequestItem;
}

const TrackProgressModal: React.FC<ITrackProgressModalProps> = ({ isOpen, onClose, request }) => {
    if(!isOpen) return null;

    // request.approvalLevels comes from getUserRequestsWithDetails
    const timeline = request.approvalLevels || [];

    const getStatusIcon = (status: string) => {
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

    const getStatusBadge = (status: string) => {
        if (status === 'Approved') {
            return <span className={styles.badgeApproved}>Approved</span>;
        } else if (status === 'Pending') {
            return <span className={styles.badgePending}>Pending</span>;
        } else if (status === 'Rejected') {
            return <span className={styles.badgeRejected}>Rejected</span>;
        }
        return null;
    };

    const getDocumentName = (url: string) => {
        if (!url) return 'Unknown Document';
        const parts = url.split('/');
        return parts[parts.length - 1];
    };

   

return (
    
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <div>
                        <h3 className={styles.title}>Approval Timeline</h3>
                        <p className={styles.subtitle}>{getDocumentName(request.FolderURL)}</p>
                    </div>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className={styles.timeline}>
                    {timeline.map((level: any, index: number) => (
                        <div key={level.Id} className={styles.timelineItem}>
                            <div className={styles.iconContainer}>
                                {getStatusIcon(level.Level_Status)}
                                {index < timeline.length - 1 && (
                                    <div className={`${styles.connector} ${
                                        level.Level_Status === 'Approved' ? styles.connectorActive : ''
                                    }`} />
                                )}
                            </div>

                            <div className={styles.content}>
                                <div className={styles.levelHeader}>
                                    <span className={styles.levelLabel}>{level.Req_Level}</span>
                                    {getStatusBadge(level.Level_Status)}
                                </div>

                                <div className={styles.approverInfo}>
                                    <p className={styles.approverName}>
                                        {level.Approver_Name || level.Assigned_UserName || 'Not assigned'}
                                    </p>
                                    {level.Assigned_MailId && (
                                        <p className={styles.approverRole}>{level.Assigned_MailId}</p>
                                    )}
                                </div>

                                {level.ApprovedDate && (
                                    <p className={styles.timestamp}>
                                        {DateFormatter.formatDateTime(level.ApprovedDate)}
                                    </p>
                                )}


                                {!level.ApprovedDate && level.Level_Status === 'Pending' && (
                                    <p className={styles.awaitingText}>Awaiting approval</p>
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
