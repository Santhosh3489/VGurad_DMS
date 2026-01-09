import * as React from 'react';
import {
  HashRouter as Router,
  Routes,
  Route
} from 'react-router-dom';
import Navigation from './Helper/Navigation';
import { getCurrentUser, getListItems } from '../../../Service/commonService';
import MSGraphClientService from '../../../Config/msGraph';
import Home from '../Pages/Dashboard/Home'; 
import { IVGuardDmsProps } from './IVGuardDmsProps';
import MyRequests from '../Pages/MyRequests/MyRequests';
import L1Approver from '../Pages/L1Approver/L1ApproverDashboard';
import styles from './VGuardDms.module.scss';

const VGuardDms = (props: IVGuardDmsProps) => {
  const { isInitialized } = props;
  const [userRole, setUserRole] = React.useState('');
  const [graphInitialized, setGraphInitialized] = React.useState(isInitialized);
  const [loading, setLoading] = React.useState(true);

 
  React.useEffect(() => {    
    console.log(props);

    const fetchUserRoles = async (): Promise<void> => {
      setLoading(true); 
      try {
        const user = await getCurrentUser();
        const items = await getListItems('User_Configuration', '*');

        const userEmail = 
          Array.isArray(user)
            ? user[0]?.mail || user[0]?.userPrincipalName
            : user?.mail || user?.userPrincipalName;

        if (!userEmail) {
          console.error('User email not found', user);
          setUserRole('');
          return;
        }

        const approverAccess = items.filter(
          (item: any) => item.UserEmailId === userEmail
        );

        setUserRole(approverAccess.length > 0 ? 'Approver' : '');
      } catch (error) {
        console.error('Error fetching user role', error);
        setUserRole('');
      } finally {
        setLoading(false);
      }
    };

  
    if (!isInitialized) {
      const checkGraphInitialization = (): void => {
        if (MSGraphClientService.getInstance().isInitialized()) {
          setGraphInitialized(true);
          void fetchUserRoles(); // ✅ Use void operator
        } else {
          setTimeout(checkGraphInitialization, 100);
        }
      };
      checkGraphInitialization();
    } else {
      void fetchUserRoles(); 
    }
  }, [isInitialized, props]); 

  return (
    <div className={styles.AppContainer}>
      <img 
        src={require('../assets/Background.png')} 
        alt="VGuard Background" 
        className={styles.bgContainer} 
      />
      {(!graphInitialized || loading) ? (
        <div style={{ width: '100%', height: '80vh' }}>
          <p>Loading...</p>
        </div>
      ) : (
        <div className={styles.mainContainer}>
          <div className={styles.navItems}>
            <Navigation access={userRole} />
          </div>
          <div className={styles.dmsContainer}>
            <div className={styles.dmsInnerContainer}>
              <Routes>
                <Route path='/' element={<Home />} />
                <Route path='/Home' element={<Home />} />
                <Route path='/MyRequests' element={<MyRequests />} />
                <Route path='/ApproverDashboard' element={<L1Approver />} />
                <Route path="*" element={<h1>404 Not Found</h1>} />
              </Routes>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const DmsRouter = (props: IVGuardDmsProps) => {
  return (
    <Router>
      <VGuardDms {...props} />
    </Router>
  );
};

export default DmsRouter;
