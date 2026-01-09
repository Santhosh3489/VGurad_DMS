import * as React from 'react';
import { Menu, MenuProps, Skeleton, ConfigProvider } from 'antd';
import {
    CheckCircleOutlined, ContainerOutlined,
    HomeOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import styles from '../VGuardDms.module.scss'

type MenuItem = Required<MenuProps>['items'][number];

interface NavigationProps {
    access: string;
}

const Navigation: React.FC<NavigationProps> = ({ access }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [userItems, setUserItems] = useState<MenuItem[]>([]);
    const [selectedKey, setSelectedKey] = useState<string>('Home');

    // Update selected key based on current route
    useEffect(() => {
        const path = location.pathname;
        if (path.includes('/Home')) setSelectedKey('Home');
        else if (path.includes('/MyRequests')) setSelectedKey('MyRequests');
        else if (path.includes('/ApproverDashboard')) setSelectedKey('ApproverDashboard');
    }, [location]);

    const handleNavigationClick = (key: string) => {
        setSelectedKey(key);
        switch (key) {
            case 'Home': navigate('/Home'); break;
            case 'MyRequests': navigate('/MyRequests'); break;
            case 'ApproverDashboard': navigate('/ApproverDashboard'); break;
        }
    };

    const userNavItems: MenuItem[] = [
        { key: 'Home', icon: <HomeOutlined />, label: 'Home', onClick: () => handleNavigationClick('Home') },
        { key: 'MyRequests', icon: <CheckCircleOutlined />, label: 'My Requests', onClick: () => handleNavigationClick('MyRequests') },
    ];

    const approverNavItems: MenuItem[] = [
        ...userNavItems,
        { key: 'ApproverDashboard', icon: <ContainerOutlined />, label: 'Approver Dashboard', onClick: () => handleNavigationClick('ApproverDashboard') },
    ];

    useEffect(() => {
        setUserItems(access === 'Approver' ? approverNavItems : userNavItems);
    }, [access]);

    if (!userItems.length) {
        return <Skeleton active />;
    }

    return (
        <ConfigProvider theme={{
            token: {
                colorPrimary: '#EE9B01', // Orange color
                colorPrimaryHover: '#EE9B01',
                controlItemBgActive: '#fff7e6', // Light orange background for selected item
                controlItemBgActiveHover: '#fff7e6',
            },
            components: {
                Menu: {
                    itemBorderRadius: 8,
                    itemHoverBg: '#fff7e6',
                    iconSize: 24, // Larger icon size
                    itemHeight: 48, // Height for each menu item
                    itemMarginBlock: 8,

                },
                Tooltip: {
                    colorBgSpotlight: "white", // background
                    colorTextLightSolid: "black",
                },
            },
        }}>
            <div className={styles.navContainer}>
                <Menu
                    mode="vertical"
                    items={userItems}
                    inlineCollapsed={true}
                    style={{
                        // Remove bullet points
                        width: 74,
                        border: 'none',
                        height: '100%',
                        boxShadow: 'rgba(0, 0, 0, 0.1) 0px 4px 12px',
                        borderRadius: '8px',
                        padding: '8px 0',
                        backgroundColor: '#fff'
                    }}
                    selectedKeys={[selectedKey]}
                    // Additional CSS to remove bullet points
                    className="custom-menu"
                />
            </div>
        </ConfigProvider>
    );
};

export default Navigation;