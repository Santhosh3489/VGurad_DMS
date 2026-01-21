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
}

const ApprovalCardDetails: React.FC<ApprovalCardDetailsProps> = ({
  open,
  onClose,
  approvalDetails
}) => {
  if (!approvalDetails) return null;

  const [openModal, setOpenModal] = React.useState(false);
  const [requestDetails, setRequestDetails] = React.useState<IRequestItem | null>(null);
  const [fileSizeKB, setFileSizeKB] = React.useState<string>('-');
  const [photoUrl, setPhotoUrl] = React.useState<string | null>(null);
  const [openApproveModal, setOpenApproveModal] = React.useState(false);
  const [openRejectModal, setOpenRejectModal] = React.useState(false);

  const openTrackProgressModal = () => setOpenModal(true);
  const closeTrackProgressModal = () => setOpenModal(false);

  const fileUrl = approvalDetails?.FileURL;
  const fileName = fileUrl
    ? decodeURIComponent(fileUrl.split('/').pop() || '')
    : '';

  
  React.useEffect(() => {
    if (!approvalDetails?.Requester_MailId) return;

    getUserProfilePhoto(approvalDetails.Requester_MailId)
      .then(setPhotoUrl);
  }, [approvalDetails]);

  
  React.useEffect(() => {
    if (!approvalDetails?.Requester_MailId) return;

    const loadRequestDetails = async () => {
      try {
        const data = await getUserRequestsWithDetails(
          approvalDetails.Requester_MailId
        );

        const matched = data.find(
          (req: IRequestItem) => req.RequestId === approvalDetails.RequestId
        );

        setRequestDetails(matched || null);
      } catch (error) {
        console.log('Error fetching request details', error);
      }
    };

    loadRequestDetails();
  }, [approvalDetails]);

 
  React.useEffect(() => {
    const loadFileSize = async () => {
      if (!approvalDetails?.FileURL) return;

      try {
        const sp = getSP();
        const file = await sp.web
          .getFileByServerRelativePath(approvalDetails.FileURL)();

        setFileSizeKB((parseInt(file.Length) / 1024).toFixed(2));
      } catch {
        setFileSizeKB('-');
      }
    };

    loadFileSize();
  }, [approvalDetails]);




  
  const handleApproveConfirm = async () => {  
    
    if (!approvalDetails) return;

    await approveDocument({
    requestId: approvalDetails.RequestId,
    approverName: approvalDetails.Assigned_UserName,
    approverEmail: approvalDetails.Assigned_MailId,
    approvalLevel: approvalDetails.Req_Level.replace(' Approval', '') as 'L1' | 'L2' | 'L3',
    action: 'Approve',
    comments: 'Approval completed'
  });

 // setOpenApproveModal(false); 
  //onClose();
}


const handleRejectSubmit = async (reason: string) => {
  await approveDocument({
    requestId: approvalDetails.RequestId,
    approverName: approvalDetails.Assigned_UserName,
    approverEmail: approvalDetails.Assigned_MailId,
    approvalLevel: approvalDetails.Req_Level.replace(' Approval', '') as 'L1' | 'L2' | 'L3',
    action: 'Reject',
    comments: reason
  });

  setOpenRejectModal(false);
  onClose(); 
};



  const requestedDate = DateFormatter.formatDate(approvalDetails?.Created);


  return (
    <Drawer
      title={fileName || 'Request details'}
      placement="right"
      width={580}
      onClose={onClose}
      open={open}
      footer={
        <div className={styles.footerActions}>
          <button className={styles.rejectBtn}
          onClick={() => setOpenRejectModal(true)}
          >
            Reject
          </button>

          <RejectCommentModal
              open={openRejectModal}
               onSubmit={handleRejectSubmit}
               onCancel={() => setOpenRejectModal(false)}
          />

          <button
            className={styles.approveBtn}
            onClick={() => setOpenApproveModal(true)}
          >
            Approve
          </button>

          <ApprovalConfirmModal
            open={openApproveModal}
            onConfirm={handleApproveConfirm}
            onCancel={() => setOpenApproveModal(false)}
          />
        </div>
      }
    >
      <div className={styles.toprow}>
           <button onClick={openTrackProgressModal} className={styles.viewStatus}>
               View Status
            </button> 
           {requestDetails && (
                  <TrackProgressModal
                  isOpen={openModal}
                  onClose={closeTrackProgressModal}
                  request={requestDetails}
                   />
            )}
        </div>

        <div className={styles.requesterDetails}>
        <div className={styles.left}>
           <img
           className={styles.avatar}
           src={photoUrl ?? 'https://static.vecteezy.com/system/resources/previews/026/619/142/original/default-avatar-profile-icon-of-social-media-user-photo-image-vector.jpg'}
           alt="profile"
           />
        <div >
             <p className={styles.label}>Requested by</p>
             <p className={styles.value}>{requestDetails?.Requester_Name || '-'}</p>
        </div>
        </div>

        <div className={styles.divider}></div>

        <div className={styles.right}>
          <p className={styles.label}>Requested on</p>
          <p className={styles.value}>{requestedDate}</p>
        </div>
    </div>


   <div
    className={styles.fileCard}
    onClick={() => window.open(fileUrl, '_blank')}
   >
    <div className={styles.left}>
    <div className={styles.wordIcon}>
      <FileWordOutlined />
    </div>

    <div>
      <p className={styles.fileName}>{fileName}</p>
      <p className={styles.fileSize}>{fileSizeKB} KB</p>
    </div>
    </div>

    <EyeOutlined className={styles.viewIcon} />
    </div>

    </Drawer>
  );
};



export default ApprovalCardDetails;

