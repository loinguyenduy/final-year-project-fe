import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { doLogoutSuccess } from '../redux/authAction';
import { acquireAuthenticatedSocket, disconnectAllAuthenticatedSockets } from '../../chat/socket/chatSocket';

/*
Hook dùng để lắng nghe các sự kiện liên quan đến phiên đăng nhập của người dùng, bao gồm việc tài khoản bị 
vô hiệu hóa hoặc phiên bị thu hồi. Khi phát hiện các sự kiện này, hook sẽ thực hiện các hành động 
như đăng xuất người dùng, hiển thị thông báo cảnh báo và 
chuyển hướng người dùng đến trang đăng nhập.
*/
const useAccountSessionRealtime = () => {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.identity.token);
  const handled = useRef(false);

  useEffect(() => {
    if (!token) return undefined;
    let active = true;
    let lease;
    const invalidate = (payload = {}) => {
      if (handled.current) return;
      handled.current = true;
      disconnectAllAuthenticatedSockets();
      dispatch(doLogoutSuccess());
      toast.warning(payload.code === 'ACCOUNT_INACTIVE'
        ? 'Your account has been deactivated. Please contact support if you need help.'
        : 'Your session has been revoked. Please sign in again.');
      window.setTimeout(() => window.location.replace('/login'), 0);
    };
    const handleConnectError = (error) => {
      const code = error?.data?.code;
      if (['ACCOUNT_INACTIVE', 'PARTICIPANT_INACTIVE', 'SESSION_REVOKED'].includes(code)) invalidate({ code });
    };
    const handleLocalInvalidation = (event) => invalidate(event.detail || {});
    window.addEventListener('session:invalidated', handleLocalInvalidation);
    acquireAuthenticatedSocket(token).then((value) => {
      if (!active) { value.release(); return; }
      lease = value;
      lease.socket.on('ACCOUNT_DEACTIVATED', invalidate);
      lease.socket.on('connect_error', handleConnectError);
      if (!lease.socket.connected) lease.socket.connect();
    }).catch(() => {});
    return () => {
      active = false;
      window.removeEventListener('session:invalidated', handleLocalInvalidation);
      if (lease) {
        lease.socket.off('ACCOUNT_DEACTIVATED', invalidate);
        lease.socket.off('connect_error', handleConnectError);
        lease.release();
      }
    };
  }, [dispatch, token]);
};

export default useAccountSessionRealtime;
