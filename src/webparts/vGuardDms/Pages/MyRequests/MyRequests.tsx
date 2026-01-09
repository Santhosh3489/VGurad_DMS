import * as React from 'react';
import { getCurrentUser, getListItems } from '../../../../Service/commonService';
import styles from './MyRequests.module.scss';
import RequestCard from '../../components/MyRequest/RequestCard';
import { IRequestItem } from '../../components/MyRequest/helperConfig';
import { Search } from 'lucide-react';
//import { Header } from 'antd/es/layout/layout';
import { getUserRequestsWithDetails } from '../../components/MyRequest/service';
//import { Header } from '../../components/Helper/Header';
import Header from "../../components/Helper/Header";

const MyRequests: React.FC = () => {

  const [activeTab, setActiveTab] = React.useState<'pending' | 'completed'>('pending');
  const [requests, setRequests] = React.useState<IRequestItem[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [searchTerm, setSearchTerm] = React.useState<string>('');
  const [currentUserEmail, setCurrentUserEmail] = React.useState<string>('');

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const user = await getCurrentUser();
        const userEmail = user?.mail || user?.userPrincipalName;
        setCurrentUserEmail(userEmail);

        //  const allRequests = await getListItems('DMS_Request','*');

        //  const userRequests = allRequests.filter(
        //    (req: any) => req.RequesterEmail === userEmail
        //  );

        //  setRequests(userRequests);

        const userRequestsWithDetails = await getUserRequestsWithDetails(userEmail);
        setRequests(userRequestsWithDetails);
      } catch (error) {
        console.log('Error fetching requests:', error);
      } finally {
        setLoading(false);
      }
    }

    void fetchData();
  }, []);


  const pendingRequests = React.useMemo(() => {
    // request is array of that particular user's requests
    return requests.filter(req => req.Status === 'InProgress' ||
      req.Status === 'Pending' ||
      req.Status === 'Rejected')
  }, [requests]);


  const completedRequests = React.useMemo(() => {
    // request is array of that particular user's requests
    return requests.filter(req => req.Status === 'Approved' || req.Status === 'Completed')
  }, [requests]);

  const getDocumentNameFromUrl = (url: string): string => {
    if (!url) return '';
    const parts = url.split('/');
    const fileName = parts[parts.length - 1];
    return decodeURIComponent(fileName).toLowerCase();
  };

  //search request
  const filteredRequestes = React.useMemo(() => {
    const sourceRequests = activeTab === 'pending' ? pendingRequests : completedRequests;

    if (!searchTerm) return sourceRequests;
    const searchLower = searchTerm.toLowerCase();

    return sourceRequests.filter(req => {
      const documentName = getDocumentNameFromUrl(req.FolderURL || '');
      const requestId = req.RequestId?.toLowerCase() || '';

      return documentName.includes(searchLower) || requestId.includes(searchLower);
    });
  }, [activeTab, pendingRequests, completedRequests, searchTerm]);

  const handleTabChange = (tab: 'pending' | 'completed') => {
    setActiveTab(tab);
    setSearchTerm('');
  }

  return (
    <div className={styles.container}>
      <Header
        title="My Requests"
        activeTabForRequest={activeTab}
        onTabChangeForRequest={handleTabChange}
        pendingCount={pendingRequests.length}
        completedCount={completedRequests.length}
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

      <div className={styles.cardsContainer}>
        {loading ? (
          <div className={styles.loadingState}>
            <p>Loading requests...</p>
          </div>
        ) : filteredRequestes.length === 0 ? (
          <div className={styles.emptyState}>
            <p>
              {searchTerm ? `No requests found matching "${searchTerm}"`
                : `No ${activeTab} requests`}
            </p>
          </div>
        ) : (
          <div className={styles.cardsGrid}>
            {filteredRequestes.map((request) => (
              <RequestCard
                key={request.ID}
                request={request}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  );
};


export default MyRequests;