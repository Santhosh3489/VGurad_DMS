import React, { useEffect, useState, useMemo } from 'react';
import ApprovalCard from '../../components/Approvers/ApprovalCard';
import styles from './L1ApproverDashboard.module.scss';
import Header from '../../components/Helper/Header';
import {
  getPendingRequestsForApprover,
  getApprovedRequestsForApprover
} from '../../components/Approvers/service';
import { getCurrentUser } from '../../../../Service/commonService';
import { Search } from 'lucide-react';
import { Col, Empty, Row } from 'antd/es';

const L1ApproverDashboard = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved'>('pending');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');

  // FIX 1: Line 32 - Wrap fetchUserEmail in async function with void operator
  useEffect(() => {
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

    void fetchUserEmail();
  }, []);

  // FIX 2: Line 59 - Wrap loadRequests in async function with void operator
  useEffect(() => {
    const loadRequests = async () => {
      if (!currentUserEmail) {
        console.log('Waiting for user email...');
        return;
      }

      try {
        setLoading(true);
        const data =
          activeTab === 'pending'
            ? await getPendingRequestsForApprover(currentUserEmail)
            : await getApprovedRequestsForApprover(currentUserEmail);

        console.log("Loading data for:", currentUserEmail, data);
        setRequests(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    void loadRequests();
  }, [activeTab, currentUserEmail]);

  // FIX 3: Line 75 - Add hasOwnProperty check for guard-for-in rule
  const filteredRequests = useMemo(() => {
    if (!searchTerm.trim()) {
      return requests;
    }
    const searchLower = searchTerm.toLowerCase().trim();
    return requests.filter(request => {
      // Recursive function to search through nested objects
      const searchObject = (obj: any): boolean => {
        if (!obj || typeof obj !== 'object') {
          return false;
        }
        for (const key in obj) {
          // FIX: Add hasOwnProperty check to filter prototype properties
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const value = obj[key];

            if (typeof value === 'string' && value.toLowerCase().includes(searchLower)) {
              return true;
            }

            if (typeof value === 'object' && value !== null) {
              if (searchObject(value)) {
                return true;
              }
            }
          }
        }
        return false;
      };
      return searchObject(request);
    });
  }, [requests, searchTerm]);

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
          />
        </div>
      </div>

      {loading ? (
        <div style={{ width: '90%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Loading...</div>
      ) : (
        <Row gutter={[14, 14]} style={{ position: 'relative', left: '3%', width: '97%' }}>
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
                />
              </Col>
            ))
          ) : (
            <Col span={24}>
              <Empty
                description={
                  searchTerm
                    ? `No requests found for "${searchTerm}"`
                    : "No requests found"
                }
              />
            </Col>
          )}
        </Row>
      )}
    </div>
  );
};

export default L1ApproverDashboard;