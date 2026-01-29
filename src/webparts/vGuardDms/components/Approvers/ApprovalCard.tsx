import React, { useState, useEffect } from 'react';
import { Card } from 'antd';
import { FileOutlined } from '@ant-design/icons';
import styles from './ApprovalCard.module.scss';
import { DateFormatter } from '../utils/DateFormatter';
import { File } from 'lucide-react';
import ApprovalCardDetails from './ApprovalCardDetails';
import { getUserProfilePhoto } from '../../../../Service/commonService';

interface ApprovalCardProps {
  request: any;
  status: 'pending' | 'approved' | 'rejected' | 'totalRequests';
  onActionCompleted: () => void;
}

const ApprovalCard: React.FC<ApprovalCardProps> = ({ request, status, onActionCompleted }) => {
  const { approvalDetails } = request;

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  const getFileNameFromUrl = (fileUrl?: string): string => {
    if (!fileUrl) return '';
    return decodeURIComponent(fileUrl.split('/').pop() || '');
  };

  useEffect(() => {
    if (!approvalDetails?.Requester_MailId) return;

   void getUserProfilePhoto(approvalDetails.Requester_MailId).then(setPhotoUrl)
   .catch(err => {
      console.error('Failed to load profile photo', err);
    });
  }, [approvalDetails]);

  const fileName = getFileNameFromUrl(approvalDetails?.FileURL);
  const date = DateFormatter.formatDate(approvalDetails?.Created);

  const openDrawer = () => setIsDrawerOpen(true);
  const closeDrawer = () => setIsDrawerOpen(false);

  
 const LevelDot = approvalDetails?.Req_Level && (() => {
  let color = '#FFA500'; 

  if (approvalDetails.Level_Status === 'Rejected') color = '#D32F2F';
  else if (approvalDetails.Level_Status === 'Approved') color = '#2E7D32';

  return (
    <div className={styles.levelDot} style={{ color }}>
      <span className={styles.dot} style={{ backgroundColor: color }} />
      {approvalDetails.Req_Level.replace(' Approval', '')}
    </div>
  );
})();

  return (
    <>
      <Card
        hoverable
        className={styles.card}
        onClick={openDrawer}
      >
        <div className={styles.cardContent}>
         
          <div className={styles.topRow}>
             <div className={styles.left}>
                <div className={styles.iconBox}>
                 <FileOutlined />
                </div>

                <div className={styles.fileInfo}>
                  <div className={styles.title} title={fileName}>
                        {fileName || '-'}
                   </div>
                </div>
          </div>

          {/* <div className={styles.right}>
               {approvalDetails?.Req_Level && (
                 <div className={styles.levelDot}>
                    <span className={styles.dot} />
                     {approvalDetails.Req_Level.replace(' Approval', '')}
                   </div>
                )}
          </div> */}

          <div className={styles.right}>
             {LevelDot}
          </div>
       </div>


          
          {status === 'approved' && (
            <div className={styles.ApprovedbottomRow}>
              <div className={styles.date}>
                <File size={18} />
                Requested {date || ''}
              </div>

              <div className={styles.requester}>
                <img
                  className={styles.avatar}
                  src={
                    photoUrl ??
                    'https://static.vecteezy.com/system/resources/previews/026/619/142/original/default-avatar-profile-icon-of-social-media-user-photo-image-vector.jpg'
                  }
                  alt="profile"
                />
                <span className={styles.Approvedname}>
                  {approvalDetails?.Requester_Name || '-'}
                </span>
              </div>
            </div>
          ) } 

          {status === 'rejected' && (
            <div className={styles.RejectedbottomRow}>
              <div className={styles.date}>
                <File size={18} />
                Requested {date || ''}
              </div>

              <div className={styles.requester}>
                <img
                  className={styles.avatar}
                  src={
                    photoUrl ??
                    'https://static.vecteezy.com/system/resources/previews/026/619/142/original/default-avatar-profile-icon-of-social-media-user-photo-image-vector.jpg'
                  }
                  alt="profile"
                />
                <span className={styles.Rejectedname}>
                  {approvalDetails?.Requester_Name || '-'}
                </span>
              </div>
            </div>
          )} 

           
          {status !== 'rejected' && status !== 'approved' && (
            <div className={styles.bottomRow}>
              <div className={styles.date}>
                <File size={18} />
                Requested {date || ''}
              </div>

              <div className={styles.requester}>
                <img
                  className={styles.avatar}
                  src={
                    photoUrl ??
                    'https://static.vecteezy.com/system/resources/previews/026/619/142/original/default-avatar-profile-icon-of-social-media-user-photo-image-vector.jpg'
                  }
                  alt="profile"
                />
                <span className={styles.name}>
                  {approvalDetails?.Requester_Name || '-'}
                </span>
              </div>
            </div>
             )}
          
        </div>
      </Card>

      <ApprovalCardDetails
        open={isDrawerOpen}
        onClose={closeDrawer}
        approvalDetails={approvalDetails}
        status={status}
        onActionCompleted={onActionCompleted} 
      />
    </>
  );
};

export default ApprovalCard;
