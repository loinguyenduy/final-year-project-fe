import { useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from '../../../core/api/axiosInstance';
import { acquireAuthenticatedSocket } from '../../chat/socket/chatSocket';
import { doFetchProfileSuccess } from '../redux/authAction';

/*
Hook dùng để lắng nghe các sự kiện liên quan đến trạng thái KYC của người dùng. 
Khi phát hiện các sự kiện này, hook sẽ thực hiện các hành động
*/
const useKycStatusRealtime = () => {
  const dispatch = useDispatch();
  const { token, account } = useSelector((state) => state.identity);
  const seenEvents = useRef(new Set());

  // Refresh thông tin hồ sơ người dùng từ API và cập nhật vào Redux store 
  const refreshProfile = useCallback(async () => {
    const response = await axios.get('/identity/profile');
    if (response?.EC === 0) dispatch(doFetchProfileSuccess(response.DT));
  }, [dispatch]);

  // Hook để lắng nghe các sự kiện realtime liên quan đến trạng thái KYC
  useEffect(() => {
    if (!token || !['CUSTOMER', 'HANDYMAN'].includes(account?.role)) return undefined;
    let active = true;
    let lease;
    let hasConnected = false;
    const handleReviewed = (payload = {}) => {
      if (payload.event_id && seenEvents.current.has(payload.event_id)) return;
      if (payload.event_id) {
        seenEvents.current.add(payload.event_id);
        if (seenEvents.current.size > 100) seenEvents.current.delete(seenEvents.current.values().next().value);
      }
      void refreshProfile();
    };
    const handleFocus = () => void refreshProfile();
    // Hàm xử lý khi socket kết nối thành công. Nếu đây là lần kết nối đầu tiên, nó sẽ không làm gì cả.
    const handleConnect = () => {
      if (!hasConnected) {
        hasConnected = true;
        return;
      }
      void refreshProfile();
    };

    void refreshProfile();
    window.addEventListener('focus', handleFocus);
    // Tái tạo một socket đã xác thực dựa trên token và lắng nghe các sự kiện realtime từ server
    acquireAuthenticatedSocket(token).then((value) => {
      if (!active) {
        value.release();
        return;
      }
      // Lưu trữ lease của socket đã xác thực và thiết lập các sự kiện lắng nghe
      lease = value;
      hasConnected = lease.socket.connected;
      // Lắng nghe sự kiện KYC_REVIEWED từ server để cập nhật trạng thái KYC  
      lease.socket.on('KYC_REVIEWED', handleReviewed);
      // Lắng nghe sự kiện connect để refresh profile khi socket kết nối lại
      lease.socket.on('connect', handleConnect); 
      if (!lease.socket.connected) lease.socket.connect();
    }).catch(() => {
      // Profile refetch on focus remains available when realtime cannot connect.
    });

    return () => {
      active = false;
      window.removeEventListener('focus', handleFocus);
      if (lease) {
        lease.socket.off('KYC_REVIEWED', handleReviewed);
        lease.socket.off('connect', handleConnect);
        lease.release();
      }
    };
  }, [account?.role, refreshProfile, token]);
};

export default useKycStatusRealtime;
