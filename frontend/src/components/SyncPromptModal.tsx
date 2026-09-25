'use client';

import React from 'react';
import { useJobs } from '../context/JobContext';
import { CloudUpload, CheckCircle, XCircle } from 'lucide-react';

export const SyncPromptModal: React.FC = () => {
  const {
    isSyncModalOpen,
    guestJobsToSyncCount,
    user,
    confirmSyncGuestJobs,
    skipSyncGuestJobs,
  } = useJobs();

  if (!isSyncModalOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog">
        <div className="modal-icon-badge">
          <CloudUpload size={28} />
        </div>

        <div className="modal-title">Đồng bộ công việc vào tài khoản?</div>

        <div className="modal-desc">
          Bạn đang có <strong>{guestJobsToSyncCount} công việc</strong> đã tạo từ trước đến nay trên máy này.
          <br />
          <br />
          Bạn có muốn lưu toàn bộ dữ liệu này vào tài khoản Google <strong>{user?.email}</strong> để lưu trữ vĩnh viễn và xem được trên mọi thiết bị khác không?
        </div>

        <div className="modal-actions">
          <button className="btn-primary" onClick={confirmSyncGuestJobs}>
            <CheckCircle size={18} />
            <span>Đồng bộ tất cả ngay</span>
          </button>

          <button className="btn-secondary" onClick={skipSyncGuestJobs}>
            <XCircle size={18} />
            <span>Không, dùng tài khoản mới</span>
          </button>
        </div>
      </div>
    </div>
  );
};
