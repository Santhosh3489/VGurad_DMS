import React from 'react';
import { Modal } from 'antd';
import Lottie from 'lottie-react';
import successAnimation from '../../assets/Success Check.json';
import styles from '../Styles/ApproverConfirm.module.scss';

interface ApprovalConfirmModalProps {
  open: boolean;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

const ApprovalConfirmModal: React.FC<ApprovalConfirmModalProps> = ({
  open,
  onConfirm,
  onCancel
}) => {
  const [isApproved, setIsApproved] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  // Reset state whenever modal opens
  React.useEffect(() => {
    if (open) {
      setIsApproved(false);
      setLoading(false);
    }
  }, [open]);

  const handleConfirm = async () => {
    try {
      setLoading(true);
      await onConfirm();       
      setIsApproved(true);     
    } catch (error) {
      console.error('Approval failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsApproved(false);
    onCancel();
  };

 
  React.useEffect(() => {
    if (isApproved) {
      const timer = setTimeout(() => {
        handleClose();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isApproved]);

  return (
    <Modal
      open={open}
      footer={null}
      centered
      closable={isApproved}
      maskClosable={false}
      onCancel={handleClose}
      width={520}
      className={styles.confirmModal}
    >
      {!isApproved ? (
        <>
          <p className={styles.confirmText}>
            Are you sure you want to approve this document?
          </p>

          <div className={styles.modalActions}>
            <button
              className={styles.cancelBtn}
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </button>

            <button
              className={styles.confirmBtn}
              onClick={handleConfirm}
              disabled={loading}
            >
              {loading ? 'Approving...' : 'Confirm'}
            </button>
          </div>
        </>
      ) : (
        <div className={styles.successContent}>
          <Lottie
            animationData={successAnimation}
            loop={false}
            className={styles.animation}
          />

          <h2 className={styles.successTitle}>Approved</h2>
          <p className={styles.successSubtitle}>
            The document has been approved successfully.
          </p>
        </div>
      )}
    </Modal>
  );
};

export default ApprovalConfirmModal;
