import React, { useEffect, useState } from 'react';
import ApprovalCard from '../../components/Approvers/ApprovalCard';
import styles from './L1ApproverDashboard.module.scss';
import Header from '../../components/Helper/Header';
import {
  getPendingRequestsForApprover,
  getApprovedRequestsForApprover
} from '../../components/Approvers/service';
import { Search } from 'lucide-react';
import { Col, Empty, Row } from 'antd/es';

const L1ApproverDashboard = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved'>('pending');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const approverEmail = 'lithika@M365x69937178.onmicrosoft.com'; // get from context
  const approvalLevel = 'L1';

  

  useEffect(() => {
    const loadRequests = async () => {
      
      try {
        setLoading(true);
        const data =
          activeTab === 'pending'
            ? await getPendingRequestsForApprover(approverEmail, approvalLevel)
            : await getApprovedRequestsForApprover(approverEmail, approvalLevel);

            console.log("Loading data",data);

        setRequests(data);

      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    loadRequests();
  }, [activeTab]);


  



  return (
    <div className={styles.container}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
       <Header
        title="Approvals"
        activeTabForApprover={activeTab}
        onTabChangeForApprover={setActiveTab}
      />
        <div className={styles.searchBar}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type='text'
            placeholder='Search requests...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          /></div>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <Row gutter={[16, 16]}>
        {requests.length > 0 ? (
          requests.map(req => (
            <Col
              key={req.RequestId}
              xs={24}
              sm={12}
              md={8}
              lg={6}
            >
              <ApprovalCard request={req} />
            </Col>
          ))
        ) : (
          <Col span={24}>
            <Empty description="No requests found" />
          </Col>
        )}
      </Row>
      )}
    </div>
  );
};

export default L1ApproverDashboard;
