import * as React from 'react';
import { Plus, List, Grid2X2 } from 'lucide-react';
import styles from '../Styles/Header.module.scss'
import { IHeaderProps } from './helperConfig'
import Breadcrumbs from './Breadcrumbs';

const Header: React.FC<IHeaderProps> = ({
    title,
    showAddButton = false,
    onAddNew,
  // showSearch = false,
  // onSearch,
  //  showViewToggle = false,
  //  currentView = 'list',
   // onViewChange,
    activeTabForRequest,
    onTabChangeForRequest,
    pendingCount = 0,
    completedCount = 0,
    activeTabForApprover,
    onTabChangeForApprover
}) => {
  //  const [searchTerm, setSearchTerm] = React.useState('');

const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //  const value = e.target.value;
  //  setSearchTerm(value);
    
   // ADD THIS: Call the onSearch callback if provided
    // if (onSearch) {
    //     onSearch(value);
    // }
};

    return (
        <header className={styles.header}>
            <div className={styles.headerLeft}>
                <h1 className={styles.title}>
                    {title}  </h1>

                {showAddButton && onAddNew && (
                    <button className={styles.addButton} onClick={onAddNew}>
                        <Plus size={20} />
                        <span>Add New</span>
                    </button>
                )}    

                {activeTabForRequest && onTabChangeForRequest && (
                    <div className={styles.pillTabs}>
                        <button
                            className={`${styles.pillTab} ${activeTabForRequest === 'pending' ? styles.activePill : ''}`}
                            onClick={() => onTabChangeForRequest('pending')}
                        >
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

             {/* <div className={styles.headerRight}>
                {showSearch && (
                    <div className={styles.searchBox}>
                        
                        <input
                            type="text"
                            placeholder="Search files..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                            className={styles.searchInput}
                        />
                    </div>
                )}

                {showViewToggle && onViewChange && (
                    <div className={styles.viewToggle}>
                        <button
                            className={`${styles.viewBtn} ${currentView === 'list' ? styles.activeView : ''}`}
                            onClick={() => onViewChange('list')}
                            title="List view" >
                            <List size={20} />
                        </button>
                        <button
                            className={`${styles.viewBtn} ${currentView === 'grid' ? styles.activeView : ''}`}
                            onClick={() => onViewChange('grid')}
                            title="Grid view" >
                            <Grid2X2 size={20} />
                        </button>
                    </div>
                )}
            </div>   */}
        </header>
    );
};

export default Header;
