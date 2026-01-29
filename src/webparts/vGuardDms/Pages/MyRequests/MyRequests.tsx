import * as React from 'react';
import { getCurrentUser } from '../../../../Service/commonService';
import styles from './MyRequests.module.scss';
import RequestCard from '../../components/MyRequest/RequestCard';
import { IRequestItem } from '../../components/MyRequest/helperConfig';
import { Search } from 'lucide-react';
import { getUserRequestsWithDetails } from '../../components/MyRequest/service';
import Header from "../../components/Helper/Header";
import TrackProgressModal from '../../components/Modals/TrackProgressModal';
import { ViewReason } from '../../components/Modals/ViewReason';

const MyRequests: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState<'pending' | 'completed' | 'rejected' | 'totalRequests'>('pending');
  const [requests, setRequests] = React.useState<IRequestItem[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [searchTerm, setSearchTerm] = React.useState<string>('');
  const [currentUserEmail, setCurrentUserEmail] = React.useState<string>('');
  const [selectedRequest, setSelectedRequest] = React.useState<IRequestItem | null>(null);
  const [showTrackProgress, setShowTrackProgress] = React.useState(false);
    const [showViewReason, setShowViewReason] = React.useState(false);
  const [viewReasonData, setViewReasonData] = React.useState<{
  approverName: string;
  fileName: string;
  rejectedDate: string;
  comments: string;
} | null>(null);


  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const user = await getCurrentUser();
        const userEmail = user?.mail || user?.userPrincipalName;
        setCurrentUserEmail(userEmail);

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



  const handleViewReasonClick = (request: IRequestItem) => {
  
  const rejectedLevel = request.approvalLevels?.find(
    (lvl: any) => lvl.Level_Status === 'Rejected'
  );

  if (!rejectedLevel) {
    setViewReasonData(null);
    setShowViewReason(true);
    return;
  }

   console.log("rejectedLevel", rejectedLevel);

  const fileName = getDocumentNameFromUrl(request.FolderURL || '');

  setViewReasonData({
    approverName: rejectedLevel.Approver_Name || rejectedLevel.Assigned_UserName || 'Unknown',
    fileName,
    rejectedDate: rejectedLevel.Approved_Date
      ? new Date(rejectedLevel.Approved_Date).toLocaleString()
      : 'N/A',
    comments: rejectedLevel.Comments || '',
  });

  setShowViewReason(true);
};


  // Add function to handle track progress click
  const handleTrackProgressClick = (request: IRequestItem) => {
    setSelectedRequest(request);
    setShowTrackProgress(true);
  };


  const pendingRequests = React.useMemo(() => {
    return requests.filter(req => req.Status === 'InProgress' ||
      req.Status === 'Pending')
  }, [requests]);


  const rejectedRequests = React.useMemo(() => {
    return requests.filter(req => req.Status === 'Rejected')
  }, [requests]);


  const completedRequests = React.useMemo(() => {
    return requests.filter(req => req.Status === 'Approved' || req.Status === 'Completed')
  }, [requests]);

  const totalRequests = React.useMemo(() => {
     return requests.filter(req => req.Status === 'Approved' || req.Status === 'Completed' || req.Status === 'Rejected' || req.Status === 'InProgress' ||
      req.Status === 'Pending')
  }, [requests]);

  const getDocumentNameFromUrl = (url: string): string => {
    if (!url) return '';
    const parts = url.split('/');
    const fileName = parts[parts.length - 1];
    return decodeURIComponent(fileName);
  };

  //search request
  const filteredRequestes = React.useMemo(() => {
    let sourceRequests 

    if(activeTab === 'pending') sourceRequests = pendingRequests;
    else if(activeTab === 'completed') sourceRequests = completedRequests;
    else if(activeTab === 'rejected') sourceRequests = rejectedRequests;
    else sourceRequests = totalRequests;

    if (!searchTerm) return sourceRequests;
    const searchLower = searchTerm.toLowerCase();

    return sourceRequests.filter(req => {
      const documentName = getDocumentNameFromUrl(req.FolderURL || '');
      const requestId = req.RequestId?.toLowerCase() || '';

      return documentName.includes(searchLower) || requestId.includes(searchLower);
    });
  }, [activeTab, pendingRequests, completedRequests, searchTerm]);

  const handleTabChange = (tab: 'pending' | 'completed' | 'rejected' | 'totalRequests') => {
    setActiveTab(tab);
    setSearchTerm('');
  }

  return (
    <div className={styles.container}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <Header
          title="My Requests"
          activeTabForRequest={activeTab}
          onTabChangeForRequest={handleTabChange}
          pendingCount={pendingRequests.length}
          completedCount={completedRequests.length}
          rejectedCount={rejectedRequests.length}
          totalCount={totalRequests.length}
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
                onTrackProgressClick={() => handleTrackProgressClick(request)}
                onViewReasonClick={() => handleViewReasonClick(request)}
              />
            ))}
          </div>
        )}
      </div>

      <ViewReason
           isOpen={showViewReason}
           onClose={() => {
                setShowViewReason(false);
                 setViewReasonData(null);
           }}
           reasonData={viewReasonData}
      />

      
      {selectedRequest && (
        <TrackProgressModal
          isOpen={showTrackProgress}
          onClose={() => {
            setShowTrackProgress(false);
            setSelectedRequest(null);
          }}
          request={selectedRequest}
        />
      )}
    </div>
  );
};

export default MyRequests;