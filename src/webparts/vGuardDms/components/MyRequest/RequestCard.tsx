import * as React from 'react';
import { FileText, MoreVertical, Clock, CheckCircle, XCircle } from 'lucide-react';
import { IRequestItem } from './helperConfig';
import styles from './RequestCard.module.scss';
import RequestCardMenu from './RequestCardMenu';
import { DateFormatter } from '../utils/DateFormatter';

interface IRequestCardProps {
    request: IRequestItem;
    onTrackProgressClick: () => void;
}


const RequestCard: React.FC<IRequestCardProps> = ({ request, onTrackProgressClick }) => {

    const [showMenu, setShowMenu] = React.useState(false);
    const menuRef = React.useRef<HTMLDivElement>(null); 

    const isCompleted = request.Status === 'Approved';
    const isRejected = request.Status === 'Rejected';

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if(menuRef.current && !menuRef.current.contains(event.target as Node)){
                setShowMenu(false);
            }
        };


        if(showMenu){
            document.addEventListener('mousedown',handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showMenu])


    const getStatusInfo = () => {
        if(isCompleted){
            return{
                icon: <CheckCircle size={16} />,
                label: 'Approved',
                className: styles.statusApproved
            };
        }

        if (isRejected) {
            return {
                icon: <XCircle size={16} />,
                label: 'Rejected',
                className: styles.statusRejected
            };
        }

        const currentLevel = request.Level_Status || 'L1';

        return {
            icon: <Clock size={16} />,
            label: `Pending at ${currentLevel}`,
            className: styles.statusPending
        }

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
                    <FileText size={20} className={styles.fileIcon}/>
                    <p>{getDocumentName(request.FolderURL)}</p>
                </div>

                <div className={styles.menuWrapper} ref={menuRef}>
                     <button
                     className={styles.menuButton}
                     onClick={() => setShowMenu(!showMenu)}
                     >
                        <MoreVertical size={18}/>
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

             <div className={styles.requestInfo}>
             <span className={styles.dateLabel}>Requested</span> 
             <span className={styles.dateValue}>
                {DateFormatter.formatDate(request.Created)}
            </span>  

        </div>

        <button
             className={`${styles.statusBadge} ${statusInfo.className}`}
             onClick={onTrackProgressClick}
        >
            {statusInfo.icon}
          <span>{statusInfo.label}</span>
        </button>
        </div>

        </div>
    )
}

export default RequestCard;
