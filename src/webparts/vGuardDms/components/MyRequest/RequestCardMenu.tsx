import * as React from 'react';
import { Eye, Activity } from 'lucide-react';
import { IRequestItem } from './helperConfig';
import styles from '../MyRequest/RequestCardMenu.module.scss';
import TrackProgressModal from '../Modals/TrackProgressModal';

interface IRequestCardMenuProps {
    request: IRequestItem;
    onClose: () => void;
}

const RequestCardMenu: React.FC<IRequestCardMenuProps> = ({ request, onClose }) => {
    const [showProgressModal, setShowProgressModal] = React.useState(false);

    const handlePreviewClick = () => {
        // Open the document in a new tab
        if (request.FolderURL) {
            window.open(request.FolderURL, '_blank', 'noopener,noreferrer');
        }
        onClose();
    }

    const handleTrackProgressClick = () => {
        setShowProgressModal(true);
        onClose();
    }

    return (
        <>
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

            <TrackProgressModal
                isOpen={showProgressModal}
                onClose={() => setShowProgressModal(false)}
                request={request}
            />
        </>
    )
}


export default RequestCardMenu;


