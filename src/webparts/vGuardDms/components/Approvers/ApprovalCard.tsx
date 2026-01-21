import React, { useState } from 'react';
import { Card, Badge } from 'antd';
import { FileOutlined } from '@ant-design/icons';
import styles from './ApprovalCard.module.scss';
import { DateFormatter } from '../utils/DateFormatter';
import { File } from 'lucide-react';
import ApprovalCardDetails from './ApprovalCardDetails';  
import { getUserProfilePhoto } from '../../../../Service/commonService';


interface ApprovalCardProps {
  request: any;
  status: 'pending' | 'approved';
}

const ApprovalCard: React.FC<ApprovalCardProps> = ({ request, status }) => {
  const { approvalDetails } = request;

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [photoUrl, setPhotoUrl] = React.useState<string | null>(null);

  const getFileNameFromUrl = (fileUrl?: string): string => {
    if (!fileUrl) return '';
    return decodeURIComponent(fileUrl.split('/').pop() || '');
  };

  React.useEffect(() => {
      if (!approvalDetails?.Requester_MailId) return;
  
      getUserProfilePhoto(approvalDetails.Requester_MailId)
        .then(setPhotoUrl);
    }, [approvalDetails]);
  

  const fileName = getFileNameFromUrl(approvalDetails?.FileURL);
  const date = DateFormatter.formatDate(approvalDetails?.Created);

  const openDrawer = () => setIsDrawerOpen(true);
  const closeDrawer = () => setIsDrawerOpen(false);

return (
  <>
    <Card
      hoverable={status === 'pending'}
      className={`${styles.card} ${status === 'approved' ? styles.approvedCard : ''}`}
      onClick={status === 'pending' ? openDrawer : undefined}
    >
      {status === 'approved' ? (
        
          <div className={styles.cardContent}>
            <div className={styles.topRow}>
              <div className={styles.left}>
                <div className={styles.iconBox}>
                  <FileOutlined />
                </div>

                <div className={styles.fileInfo}>
                  <div className={styles.title}>{fileName || '-'}</div>
                </div>
              </div>
            </div>

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
          </div>
        
      ) : (
        <div className={styles.cardContent}>
          {/* TOP */}
          <div className={styles.topRow}>
            <div className={styles.left}>
              <div className={styles.iconBox}>
                <FileOutlined />
              </div>

              <div className={styles.fileInfo}>
                <div className={styles.title}>{fileName || '-'}</div>
              </div>
            </div>
          </div>

          {/* BOTTOM */}
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
        </div>
      )}
    </Card>

    <ApprovalCardDetails
      open={isDrawerOpen}
      onClose={closeDrawer}
      approvalDetails={approvalDetails}
    />
  </>
);
}

export default ApprovalCard;
