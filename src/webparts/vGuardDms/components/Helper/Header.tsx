import * as React from 'react';
import { Plus } from 'lucide-react';
import styles from '../Styles/Header.module.scss'
import { IHeaderProps } from './helperConfig';

const Header: React.FC<IHeaderProps> = ({
    title,
    showAddButton = false,
    onAddNew,
    activeTabForRequest,
    onTabChangeForRequest,
    pendingCount = 0,
    completedCount = 0,
    activeTabForApprover,
    onTabChangeForApprover
}) => {
    return (
        <header className={styles.header}>
            <div className={styles.headerLeft}>
                <h1 className={styles.title}>
                    {title}  </h1>

                {showAddButton && onAddNew && (
                    <button className={styles.addButton} onClick={onAddNew}>
                        <span style={{ padding: '4px', border: '2px solid #fff', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><Plus size={12} stroke='#fff' /></span>
                        <span>Add New</span>
                    </button>
                )}

                {activeTabForRequest && onTabChangeForRequest && (
                    <div className={styles.pillTabs}>
                        <button
                            className={`${styles.pillTab} ${activeTabForRequest === 'pending' ? styles.activePill : ''}`}
                            onClick={() => onTabChangeForRequest('pending')}>
                            Pending
                            <span className={styles.pillCount}>{pendingCount}</span>
                        </button>
                        <button
                            className={`${styles.pillTab} ${activeTabForRequest === 'completed' ? styles.activePill : ''}`}
                            onClick={() => onTabChangeForRequest('completed')}
                        >
                            Completed
                            <span className={styles.pillCount}>{completedCount}</span>
                        </button> 
                    </div>
                )}

                {activeTabForApprover && onTabChangeForApprover && (
                    <div className={styles.pillTabs}>
                        <button
                            className={`${styles.pillTab} ${activeTabForApprover === 'pending' ? styles.activePill : ''}`}
                            onClick={() => onTabChangeForApprover('pending')} >
                            Pending
                        </button>
                        <button
                            className={`${styles.pillTab} ${activeTabForApprover === 'approved' ? styles.activePill : ''}`}
                            onClick={() => onTabChangeForApprover('approved')} >
                            Approved
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;
