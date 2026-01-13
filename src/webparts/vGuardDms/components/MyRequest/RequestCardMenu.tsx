import * as React from 'react';
import { Eye, Activity } from 'lucide-react';
import { IRequestItem } from './helperConfig';
import styles from '../MyRequest/RequestCardMenu.module.scss';

interface IRequestCardMenuProps {
    request: IRequestItem;
    onClose: () => void;
    onTrackProgressClick?: () => void;
}

const RequestCardMenu: React.FC<IRequestCardMenuProps> = ({ 
    request, 
    onClose,
    onTrackProgressClick 
}) => {
    const handlePreviewClick = () => {
        if (request.FolderURL) {
            window.open(request.FolderURL, '_blank', 'noopener,noreferrer');
        }
        onClose();
    }

    const handleTrackProgressClick = () => {
        onClose();
        if (onTrackProgressClick) {
            onTrackProgressClick();
        }
    }

    return (
        <div className={styles.menu}>
            <button className={styles.menuItem} onClick={handlePreviewClick}>
                <Eye size={16} />
                <span>Document Preview</span>
            </button>

            <button className={styles.menuItem} onClick={handleTrackProgressClick}>
                <Activity size={16} />
                <span>Track Progress</span>
            </button>
        </div>
    )
}

export default RequestCardMenu;