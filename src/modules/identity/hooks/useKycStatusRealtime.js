import { useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from '../../../core/api/axiosInstance';
import { acquireAuthenticatedSocket } from '../../chat/socket/chatSocket';
import { doFetchProfileSuccess } from '../redux/authAction';

const useKycStatusRealtime = () => {
  const dispatch = useDispatch();
  const { token, account } = useSelector((state) => state.identity);
  const seenEvents = useRef(new Set());

  const refreshProfile = useCallback(async () => {
    const response = await axios.get('/identity/profile');
    if (response?.EC === 0) dispatch(doFetchProfileSuccess(response.DT));
  }, [dispatch]);

  useEffect(() => {
    if (!token || !['CUSTOMER', 'HANDYMAN'].includes(account?.role)) return undefined;
    let active = true;
    let lease;
    const handleReviewed = (payload = {}) => {
      if (payload.event_id && seenEvents.current.has(payload.event_id)) return;
      if (payload.event_id) {
        seenEvents.current.add(payload.event_id);
        if (seenEvents.current.size > 100) seenEvents.current.delete(seenEvents.current.values().next().value);
      }
      void refreshProfile();
    };
    const handleFocus = () => void refreshProfile();

    void refreshProfile();
    window.addEventListener('focus', handleFocus);
    acquireAuthenticatedSocket(token).then((value) => {
      if (!active) {
        value.release();
        return;
      }
      lease = value;
      lease.socket.on('KYC_REVIEWED', handleReviewed);
      lease.socket.on('connect', refreshProfile);
      if (!lease.socket.connected) lease.socket.connect();
    }).catch(() => {
      // Profile refetch on focus remains available when realtime cannot connect.
    });

    return () => {
      active = false;
      window.removeEventListener('focus', handleFocus);
      if (lease) {
        lease.socket.off('KYC_REVIEWED', handleReviewed);
        lease.socket.off('connect', refreshProfile);
        lease.release();
      }
    };
  }, [account?.role, refreshProfile, token]);
};

export default useKycStatusRealtime;
