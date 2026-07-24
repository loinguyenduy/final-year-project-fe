import { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { logoutUserApi } from '../services/authService';
import { doLogoutSuccess } from '../redux/authAction';
import { disconnectAllAuthenticatedSockets } from '../../chat/socket/chatSocket';

const MOBILE_QUERY = '(max-width: 991px)';

const useParticipantShell = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.matchMedia(MOBILE_QUERY).matches);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(MOBILE_QUERY);
    const update = () => {
      setIsMobile(media.matches);
      if (!media.matches) setDrawerOpen(false);
    };
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => setDrawerOpen(false), [location.pathname, location.search]);

  useEffect(() => {
    if (!drawerOpen || !isMobile) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setDrawerOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [drawerOpen, isMobile]);

  const toggleNavigation = useCallback(() => {
    if (isMobile) setDrawerOpen((value) => !value);
    else setCollapsed((value) => !value);
  }, [isMobile]);

  const logout = useCallback(async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logoutUserApi();
    } catch {
      // Local logout still completes when the server session cannot be reached.
    } finally {
      setDrawerOpen(false);
      disconnectAllAuthenticatedSockets();
      dispatch(doLogoutSuccess());
      window.location.replace('/');
    }
  }, [dispatch, loggingOut]);

  return {
    collapsed,
    drawerOpen,
    isMobile,
    loggingOut,
    closeDrawer: () => setDrawerOpen(false),
    toggleNavigation,
    logout,
  };
};

export default useParticipantShell;
