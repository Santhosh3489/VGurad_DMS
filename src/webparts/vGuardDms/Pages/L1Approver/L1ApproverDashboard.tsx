import React, { useEffect, useState, useMemo } from 'react';
import ApprovalCard from '../../components/Approvers/ApprovalCard';
import styles from './L1ApproverDashboard.module.scss';
import Header from '../../components/Helper/Header';
import {
  getPendingRequestsForApprover,
  getApprovedRequestsForApprover,
  getRejectedRequestsForApprover,
  getAllRequestsForApprover
} from '../../components/Approvers/service';
import { getCurrentUser } from '../../../../Service/commonService';
import { Search } from 'lucide-react';
import { Col, Empty, Row } from 'antd/es';

const L1ApproverDashboard = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'totalRequests'>('pending');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');
  
  // State to store counts for each tab
  const [tabCounts, setTabCounts] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    totalRequests: 0
  });
  
  useEffect(() => {
    void fetchUserEmail();
  }, []); 

  const fetchUserEmail = async () => {
    try {
      const user = await getCurrentUser();
      const email = user.mail || user.userPrincipalName;
      setCurrentUserEmail(email);
      console.log('Logged in user email:', email);
    } catch (error) {
      console.error('Failed to get current user:', error);
    }
  };

  // Fetch data for all tabs to get counts
  const fetchAllTabCounts = async (email: string) => {
    if (!email) return;
    
    try {
      const [pendingData, approvedData, rejectedData, allData] = await Promise.all([
        getPendingRequestsForApprover(email),
        getApprovedRequestsForApprover(email),
        getRejectedRequestsForApprover(email),
        getAllRequestsForApprover(email)
      ]);
      
      setTabCounts({
        pending: pendingData.length,
        approved: approvedData.length,
        rejected: rejectedData.length,
        totalRequests: allData.length
      });
      
    } catch (error) {
      console.error('Error fetching tab counts:', error);
    }
  };

  useEffect(() => {
    if (currentUserEmail) {
      void loadRequests();
      void fetchAllTabCounts(currentUserEmail);
    }
  }, [activeTab, currentUserEmail]); 

  const loadRequests = async () => {
    if (!currentUserEmail) {
      console.log('Waiting for user email...');
      return;
    }

    try {
      setLoading(true);
      let data: any[] = []; 

      if(activeTab === "pending"){ 
        data = await getPendingRequestsForApprover(currentUserEmail);
      }
      else if (activeTab === "approved") {
        data = await getApprovedRequestsForApprover(currentUserEmail);
      }
      else if (activeTab === "rejected"){
        data = await getRejectedRequestsForApprover(currentUserEmail);
      }
      else{
        data = await getAllRequestsForApprover(currentUserEmail);
      }

      console.log("Loading data for:", currentUserEmail, data);
      setRequests(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = useMemo(() => {
    if (!searchTerm.trim()) {
      return requests;
    }

    const lowerSearchTerm = searchTerm.toLowerCase();
    
    return requests.filter(req => {
      const fileUrl = req.approvalDetails?.FileURL;
      if (!fileUrl) return false;
      
      const fileName = decodeURIComponent(fileUrl.split('/').pop() || '');
      return fileName.toLowerCase().includes(lowerSearchTerm);
    });
  }, [requests, searchTerm]);

  // Function to refresh counts when a request is approved/rejected
  const handleRequestActionComplete = () => {
    void loadRequests(); // Reload current tab
    if (currentUserEmail) {
      void fetchAllTabCounts(currentUserEmail); // Refresh all counts
    }
  };

  return (
    <div className={styles.container}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <Header
          title="Approvals"
          activeTabForApprover={activeTab}
          onTabChangeForApprover={setActiveTab}
          // Pass the counts to Header component
          pendingCount={tabCounts.pending}
          approvedCount={tabCounts.approved}
          rejectedCount={tabCounts.rejected}
          totalCount={tabCounts.totalRequests}
        />
        <div className={styles.searchBar}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type='text'
            placeholder='Search requests...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ width: '90%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Loading...</div>
      ) : (
        <Row gutter={[16, 16]}>
          {filteredRequests.length > 0 ? (
            filteredRequests.map(req => (
              <Col
                style={{ minWidth: '318px', maxWidth: '320px' }}
                key={req.RequestId}
                xs={22}
                sm={10}
                md={6}
                lg={4}
              >
                <ApprovalCard 
                  request={req}
                  status={activeTab}
                  onActionCompleted={handleRequestActionComplete}
                />
              </Col>
            ))
          ) : (
            <Col span={24}>
              <Empty description={searchTerm ? "No requests match your search" : "No requests found"} />
            </Col>
          )}
        </Row>
      )}
    </div>
  );
};
export default L1ApproverDashboard;