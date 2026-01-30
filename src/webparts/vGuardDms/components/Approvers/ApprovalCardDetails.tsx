import React from 'react';
import { Drawer } from 'antd';
import { DateFormatter } from '../utils/DateFormatter';
import TrackProgressModal from '../Modals/TrackProgressModal';
import { getUserRequestsWithDetails } from '../MyRequest/service';
import { IRequestItem } from './helperConfig';
import styles from './ApprovalCardDetails.module.scss';
import { FileWordOutlined, EyeOutlined } from '@ant-design/icons';
import { getSP } from '../../../../Config/pnpConfig';
import { getUserProfilePhoto } from '../../../../Service/commonService';
import ApprovalConfirmModal from '../Modals/ApproverConfirmModal';
import { approveDocument } from './service';
import RejectCommentModal from '../Modals/RejectCommentModal';

interface ApprovalCardDetailsProps {
  open: boolean;
  onClose: () => void;
  approvalDetails: any | null;
  status: 'pending' | 'approved' | 'rejected' | 'totalRequests';
  onActionCompleted: () => void;
}

const ApprovalCardDetails: React.FC<ApprovalCardDetailsProps> = ({
  open,
  onClose,
  approvalDetails,
  status,
  onActionCompleted
}) => {
  if (!approvalDetails) return null;

  const [openModal, setOpenModal] = React.useState(false);
  const [requestDetails, setRequestDetails] = React.useState<IRequestItem | null>(null);
  const [fileSizeKB, setFileSizeKB] = React.useState<string>('-');
  const [photoUrl, setPhotoUrl] = React.useState<string | null>(null);
  const [openApproveModal, setOpenApproveModal] = React.useState(false);
  const [openRejectModal, setOpenRejectModal] = React.useState(false);

  const fileUrl = approvalDetails.FileURL;
  const fileName = fileUrl
    ? decodeURIComponent(fileUrl.split('/').pop() || '')
    : '';


  React.useEffect(() => {
    if (!approvalDetails?.Requester_MailId) return;
   void getUserProfilePhoto(approvalDetails.Requester_MailId).then(setPhotoUrl);
  }, [approvalDetails]);

 
  React.useEffect(() => {
    if (!approvalDetails?.Requester_MailId) return;

    const load = async () => {
      const data = await getUserRequestsWithDetails(
        approvalDetails.Requester_MailId
      );
      const matched = data.find(
        (r: IRequestItem) => r.RequestId === approvalDetails.RequestId
      );
      setRequestDetails(matched || null);
    };

     void load().catch(err => {
    console.error('Failed to load request details', err);
  });

  }, [approvalDetails]);

  
  React.useEffect(() => { 
    const loadSize = async () => {
      try {
        const sp = getSP();
        const file = await sp.web
          .getFileByServerRelativePath(approvalDetails.FileURL)();
        setFileSizeKB((parseInt(file.Length) / 1024).toFixed(2));
      } catch {
        setFileSizeKB('-');
      }
    };

    if (approvalDetails?.FileURL) void loadSize();
  }, [approvalDetails]);

 
  const handleApproveConfirm = async () => {
    await approveDocument({
      requestId: approvalDetails.RequestId,
      approverName: approvalDetails.Assigned_UserName,
      approverEmail: approvalDetails.Assigned_MailId,
      approvalLevel: approvalDetails.Req_Level.replace(
        ' Approval',
        ''
      ) as 'L1' | 'L2' | 'L3',
      action: 'Approve',
      comments: 'Approved'
    });
  

  };


  const handleRejectSubmit = async (reason: string) => {
    await approveDocument({
      requestId: approvalDetails.RequestId,
      approverName: approvalDetails.Assigned_UserName,
      approverEmail: approvalDetails.Assigned_MailId,
      approvalLevel: approvalDetails.Req_Level.replace(
        ' Approval',
        ''
      ) as 'L1' | 'L2' | 'L3',
      action: 'Reject',
      comments: reason
    });

     setOpenRejectModal(false);
     onActionCompleted();
     onClose(); 
  };

  const requestedDate = DateFormatter.formatDate(approvalDetails.Created);

  const getBrowserUrl = (url: string) =>
    url.includes('?') ? `${url}&web=1` : `${url}?web=1`;

  return (
    <Drawer
      title={fileName || 'Request Details'}
      width={580}
      open={open}
      onClose={() => {
    setOpenApproveModal(false);
    onClose() } }
      footer={
        status === 'pending' ? (
          <div className={styles.footerActions}>
            <button
              className={styles.rejectBtn}
              onClick={() => setOpenRejectModal(true)}
            >
              Reject
            </button>

            <button
              className={styles.approveBtn}
              onClick={() => setOpenApproveModal(true)}
            >
              Approve
            </button>

            <RejectCommentModal
              open={openRejectModal}
              onSubmit={handleRejectSubmit}
              onCancel={() => setOpenRejectModal(false)}
            />

            <ApprovalConfirmModal
              open={openApproveModal}
              onConfirm={handleApproveConfirm}
              onCancel={() => setOpenApproveModal(false)}
              onCompleted={onActionCompleted}
            />
          </div>
        ) : null
      }
    >
      
      <button
        className={styles.viewStatus}
        onClick={() => setOpenModal(true)}
      >
        View Status
      </button>

      {requestDetails && (
        <TrackProgressModal
          isOpen={openModal}
          onClose={() => setOpenModal(false)}
          request={requestDetails}
        />
      )}

     
      <div className={styles.requesterDetails}>
        <img
          className={styles.avatar}
          src={
            photoUrl ??
            'https://static.vecteezy.com/system/resources/previews/026/619/142/original/default-avatar-profile-icon-of-social-media-user-photo-image-vector.jpg'
          }
          alt="profile"
        />

        <div>
          <p className={styles.label}>Requested by</p>
          <p className={styles.value}>
            {requestDetails?.Requester_Name || '-'}
          </p>
        </div>

        <div className={styles.divider} />

        <div>
          <p className={styles.label}>Requested on</p>
          <p className={styles.value}>{requestedDate}</p>
        </div>
      </div>

      <div
        className={styles.fileCard}>
        <div className={styles.left}>
          <FileWordOutlined />
          <div>
            <p className={styles.fileName}>{fileName}</p>
            <p className={styles.fileSize}>{fileSizeKB} KB</p>
          </div>
        </div>
        <EyeOutlined
            className={styles.EyeIcon}
            onClick={() => window.open(getBrowserUrl(fileUrl), '_blank')}
        />

      </div>


      {status === 'rejected' && (
        <div className={styles.rejectionBox}>
          <p className={styles.rejectTitle}>Rejection Reason</p>
          <p className={styles.rejectReason}>
            {approvalDetails.Comments || 'No reason provided'}
          </p>
        </div>
      )}

    </Drawer>
  );
};

export default ApprovalCardDetails;
