import React from 'react';
import { Card } from 'antd';
import { FileOutlined } from '@ant-design/icons';
import styles from './ApprovalCard.module.scss';
import { DateFormatter } from '../utils/DateFormatter';
import { File } from 'lucide-react';

interface ApprovalCardProps {
  request: any;
}

const ApprovalCard: React.FC<ApprovalCardProps> = ({ request }) => {

    const {
    approvalDetails,
      } = request;

    console.log("approvaldetails",approvalDetails);

  const getFileNameFromUrl = (fileUrl?: string): string => {
    if (!fileUrl) return '';
    return decodeURIComponent(fileUrl.split('/').pop() || '');
  };

  const fileName = getFileNameFromUrl(approvalDetails?.FileURL);
  const date = DateFormatter.formatDate(approvalDetails?.Created);

  return (
    <Card hoverable className={styles.card}>
      
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

     
      <div className={styles.bottomRow}>
        <div className={styles.date}>
           <File size={18}/> 
           Requested {date || ''}
        </div>

        <div className={styles.requester}>  
          <span className={styles.name}>{approvalDetails?.Requester_Name || '-'}</span>
        </div>
      </div>
    </Card>
  );
};

export default ApprovalCard;
