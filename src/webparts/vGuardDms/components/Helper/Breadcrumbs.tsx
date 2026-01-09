// Breadcrumbs.tsx
import * as React from 'react';
import { Home, ChevronRight, ChevronLeft, MoreHorizontal } from 'lucide-react';
import styles from '../Styles/Breadcrumbs.module.scss';

export interface IBreadcrumbItem {
    name: string;
    path: string;
}

export interface IBreadcrumbsProps {
    items: IBreadcrumbItem[];
    onNavigate: (path: string) => void;
    homeLabel?: string;
    showHome?: boolean;
}

const Breadcrumbs: React.FC<IBreadcrumbsProps> = ({
    items,
    onNavigate,
    homeLabel = 'Home',
    showHome = true
}) => {
    const [showMenu, setShowMenu] = React.useState(false);
    const [isMobile, setIsMobile] = React.useState(false);
    const menuRef = React.useRef<HTMLDivElement>(null);

    // Detect mobile view
    React.useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Close menu when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
        };

        if (showMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showMenu]);

    const handleClick = (path: string, isCurrent: boolean) => {
        if (!isCurrent) {
            onNavigate(path);
            setShowMenu(false);
        }
    };

    const handleBack = () => {
        if (items.length > 0) {
            const previousItem = items[items.length - 2];
            onNavigate(previousItem ? previousItem.path : '/');
        } else {
            onNavigate('/');
        }
    };

if (isMobile) {
    const currentItem = items[items.length - 1];
    const parentItems = items.slice(0, -1); // All items except the current one

    const handleMobileBack = () => {
        if (items.length > 1) {
            // Go to parent folder (second last item in breadcrumbs)
            const parentItem = items[items.length - 2];
            onNavigate(parentItem.path);
        } else if (items.length === 1) {
            // Go to home if we're at first level folder
            onNavigate('/');
        }
    };

    return (
        <nav className={styles.breadcrumbsMobile} aria-label="Breadcrumb">
            <div className={styles.mobileHeader}>
                {/* Back button - only show if we can go back */}
                {(items.length > 0) && (
                    <button
                        className={styles.backButton}
                        onClick={handleMobileBack}
                        aria-label="Go back"
                        type="button"
                    >
                        <ChevronLeft size={20} />
                    </button>
                )}
                
                {/* Current folder name */}
                <div className={styles.currentFolder}>
                    <span className={styles.currentFolderName}>
                        {currentItem ? currentItem.name : homeLabel}
                    </span>
                </div>

                {/* Menu button - only show if we have breadcrumbs or home */}
                {(showHome || items.length > 0) && (
                    <div className={styles.menuContainer} ref={menuRef}>
                        <button
                            className={styles.menuButton}
                            onClick={() => setShowMenu(!showMenu)}
                            aria-label="Show breadcrumb menu"
                            type="button"
                        >
                            <MoreHorizontal size={20} />
                        </button>

                        {showMenu && (
                            <div className={styles.dropdownMenu}>
                                {/* Home option */}
                                {showHome && (
                                    <button
                                        className={styles.menuItem}
                                        onClick={() => {
                                            onNavigate('/');
                                            setShowMenu(false);
                                        }}
                                        type="button"
                                    >
                                        <Home size={16} />
                                        <span>{homeLabel}</span>
                                        {items.length === 0 && <span> (Current)</span>}
                                    </button>
                                )}

                                {/* Separator if we have both home and parent items */}
                                {showHome && parentItems.length > 0 && (
                                    <div className={styles.menuSeparator} />
                                )}

                                {/* All parent folders (excluding current) */}
                                {parentItems.map((item, index) => (
                                    <button
                                        key={item.path}
                                        className={styles.menuItem}
                                        onClick={() => {
                                            onNavigate(item.path);
                                            setShowMenu(false);
                                        }}
                                        type="button"
                                    >
                                        {item.name}
                                    </button>
                                ))}

                                {/* Current folder (non-clickable) */}
                                {currentItem && (
                                    <>
                                        {parentItems.length > 0 && (
                                            <div className={styles.menuSeparator} />
                                        )}
                                        <div className={`${styles.menuItem} ${styles.currentMenuItem}`}>
                                            {currentItem.name}
                                            <span> (Current)</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </nav>
    );
}

return (
    <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
        {showHome && (
            <>
                <button
                    className={styles.item}
                    onClick={() => handleClick('/', false)}
                    aria-label="Go to home"
                    type="button"
                >
                    <Home size={17} className={styles.homeIcon} />
                    <span>{homeLabel}</span>
                </button>
                {items.length > 0 && (
                    <ChevronRight size={16} className={styles.separator} aria-hidden="true" />
                )}
            </>
        )}

        {items.map((item, index) => {
            const isCurrent = index === items.length - 1;
            const isClickable = !isCurrent;

            return (
                <React.Fragment key={item.path}>
                    {((showHome && index > 0) || (!showHome && index > 0)) && (
                        <ChevronRight size={16} className={styles.separator} aria-hidden="true" />
                    )}
                    
                    <button
                        className={`${styles.item} ${isCurrent ? styles.current : ''}`}
                        onClick={() => isClickable && handleClick(item.path, isCurrent)}
                        disabled={!isClickable}
                        aria-current={isCurrent ? 'page' : undefined}
                        type="button"
                    >
                        {item.name}
                    </button>
                </React.Fragment>
            );
        })}
    </nav>
);
};

export default Breadcrumbs;