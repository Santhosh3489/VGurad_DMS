import React, { useState } from 'react';
import { Modal, Input } from 'antd';
import styles from '../Styles/RejectCommentModal.module.scss';

interface RejectReasonModalProps {
  open: boolean;
  onSubmit: (reason: string) => void;
  onCancel: () => void;
}

const RejectReasonModal: React.FC<RejectReasonModalProps> = ({
  open,
  onSubmit,
  onCancel
}) => {
  const [reason, setReason] = useState('');

  const handleSubmit = () => {
    if (!reason.trim()) return;
    onSubmit(reason);
    setReason('');
  };

  const handleCancel = () => {
    setReason('');
    onCancel();
  };

  return (
    <Modal
      open={open}
      footer={null}
      centered
      closable={false}
      className={styles.rejectModal}
    >
      <h3 className={styles.title}>Reason for rejection <span style={{ color: "red"}}>*</span></h3>

      <Input.TextArea
        rows={5}
        placeholder="Enter the reason..."
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className={styles.textArea}
      />

      <div className={styles.footer}>
        <button className={styles.cancelBtn} onClick={handleCancel}>
          Cancel
        </button>

        <button
          className={styles.rejectBtn}
          disabled={!reason.trim()}
          onClick={handleSubmit}
        >
          Reject
        </button>
      </div>
    </Modal>
  );
};

export default RejectReasonModal;
