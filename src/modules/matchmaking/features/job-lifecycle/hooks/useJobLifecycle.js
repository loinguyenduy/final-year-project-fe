import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import {
  cancelAcceptedByCustomer,
  cancelAcceptedByHandyman,
  confirmArrival as confirmArrivalApi,
  confirmLifecycleCancellation as confirmLifecycleCancellationApi,
  createArrivalRequest,
  createLifecycleCancellation as createLifecycleCancellationApi,
  getJobLifecycleDetails,
  rejectArrival as rejectArrivalApi,
  rejectLifecycleCancellation as rejectLifecycleCancellationApi,
  startMoving as startMovingApi,
} from '../../../api/jobLifecycleApi';
import { getFriendlyLifecycleError } from '../utils/jobLifecycleUi';
import { isLifecycleWorkspaceStatus } from '../utils/jobLifecycleNavigation';
import useJobLifecycleSocket from './useJobLifecycleSocket';

const createInitialState = () => ({
  details: null,
  detailsLoading: true,
  detailsError: null,
  syncError: null,
  activeMutation: null,
  cooldownDeadline: null,
  outsideStatus: null,
  activeModal: null,
});

const lifecycleReducer = (state, action) => {
  switch (action.type) {
    case 'DETAILS_LOADING':
      return { ...state, detailsLoading: true, detailsError: null };
    case 'DETAILS_SUCCESS':
      return {
        ...state,
        details: action.details,
        detailsLoading: false,
        detailsError: null,
        syncError: null,
        cooldownDeadline: action.cooldownDeadline,
      };
    case 'DETAILS_ERROR':
      return state.details
        ? { ...state, detailsLoading: false, syncError: action.message }
        : { ...state, detailsLoading: false, detailsError: action.message };
    case 'MUTATION_START':
      return { ...state, activeMutation: action.name, syncError: null };
    case 'MUTATION_END':
      return { ...state, activeMutation: null };
    case 'OUTSIDE_STATUS':
      return {
        ...state,
        outsideStatus: action.status || 'UNKNOWN',
        activeMutation: null,
        detailsLoading: false,
        activeModal: null,
      };
    case 'OPEN_MODAL':
      return state.activeMutation ? state : { ...state, activeModal: action.name };
    case 'CLOSE_MODAL':
      return state.activeMutation ? state : { ...state, activeModal: null };
    case 'FORCE_CLOSE_MODAL':
      return { ...state, activeModal: null };
    default:
      return state;
  }
};

const getEnvelope = (error) => error?.response?.data || error || {};

const STALE_CONFLICT_CODES = new Set([
  'INVALID_JOB_STATUS',
  'JOB_NOT_EN_ROUTE',
  'JOB_ALREADY_ARRIVED',
  'ARRIVAL_REQUEST_NOT_FOUND',
  'ARRIVAL_REQUEST_NOT_PENDING',
  'ACCEPTANCE_CYCLE_INCONSISTENT',
  'CANCELLATION_ALREADY_ACTIVE',
  'CANCELLATION_ALREADY_RESOLVED',
  'CANCELLATION_NOT_FOUND',
  'CANCELLATION_RESPONSE_CONFLICT',
  'CANCELLATION_COUNTERPARTY_REQUIRED',
  'INVALID_CANCELLATION_STATUS',
]);

const SOCKET_TOASTS = Object.freeze({
  JOB_EN_ROUTE: 'The handyman started travelling to the service location.',
  JOB_ARRIVAL_REQUESTED: 'The handyman sent an arrival request.',
  JOB_ARRIVAL_REJECTED: 'The customer did not confirm the arrival request.',
  JOB_ARRIVED: 'The customer confirmed the handyman’s arrival.',
  JOB_QUOTE_SUBMITTED: 'The final Quote was submitted.',
  JOB_QUOTE_ACCEPTED: 'The Customer accepted the final Quote.',
  JOB_QUOTE_REJECTED: 'The Customer rejected the final Quote and the Job was cancelled.',
  JOB_PAYMENT_REQUIRED: 'The accepted Quote is waiting for the remaining payment.',
  JOB_PAYMENT_COMPLETED: 'The remaining payment was completed.',
  JOB_IN_PROGRESS: 'The Contract is active and the Job is now In progress.',
  JOB_CANCELLATION_REQUESTED: 'A cancellation request is waiting for a response.',
  JOB_CANCELLATION_REVIEW_REQUIRED: 'A cancellation request now requires review.',
  JOB_CANCELLATION_REJECTED: 'The mutual cancellation request was declined and moved to review.',
  JOB_CANCELLED: 'The job was cancelled.',
  JOB_COMPLETION_REQUESTED: 'A work completion request is ready for review.',
  JOB_COMPLETION_REJECTED: 'The completion request was rejected.',
  JOB_COMPLETION_CONFIRMED: 'Work completion was confirmed.',
  JOB_WARRANTY_STARTED: 'The warranty period has started.',
  JOB_WARRANTY_CLAIM_CREATED: 'A warranty claim was submitted.',
  JOB_WARRANTY_REWORK_REQUIRED: 'Warranty rework is required.',
  JOB_WARRANTY_COMPLETION_REQUESTED: 'Warranty rework is ready for confirmation.',
  JOB_WARRANTY_REWORK_CONFIRMED: 'Warranty rework was confirmed.',
  JOB_WARRANTY_REWORK_REJECTED: 'Warranty rework was rejected.',
  JOB_WARRANTY_RELEASED: 'The warranty lifecycle and payment are complete.',
  JOB_COMPLETED: 'The job is complete.',
  REVIEW_CASE_UPDATED: 'An administrator reviewed this case. The latest status has been loaded.',
});

const getMutationSuccessMessage = (action, response) => {
  const code = response?.code;
  if (action === 'START_MOVING') {
    return code === 'EN_ROUTE_ALREADY_STARTED'
      ? 'The journey had already started. The latest job details were loaded.'
      : 'The journey has started.';
  }
  if (action === 'REQUEST_ARRIVAL') {
    if (code === 'ARRIVAL_REQUEST_EXISTS') {
      return 'An arrival request is already waiting for customer confirmation.';
    }
    if (code === 'JOB_ALREADY_ARRIVED') {
      return 'The customer has already confirmed your arrival.';
    }
    return 'The arrival request was sent.';
  }
  if (action === 'CONFIRM_ARRIVAL') {
    return code === 'ARRIVAL_ALREADY_CONFIRMED'
      ? 'This arrival request was already confirmed.'
      : 'The handyman’s arrival was confirmed.';
  }
  if (action === 'REJECT_ARRIVAL') {
    return code === 'ARRIVAL_ALREADY_REJECTED'
      ? 'This arrival request was already declined.'
      : 'The handyman was notified. The job remains En route.';
  }
  if (action === 'REQUEST_CANCELLATION') {
    if (code === 'CANCELLATION_ALREADY_EXISTS') {
      return 'The existing cancellation request was loaded.';
    }
    if (code === 'CANCELLATION_RESOLVED') return 'The job was cancelled under the current policy.';
    if (code === 'CANCELLATION_AWAITING_COUNTERPARTY') {
      return 'The cancellation request was sent to the other participant.';
    }
    return 'The cancellation request was sent for review.';
  }
  if (action === 'CONFIRM_CANCELLATION') {
    return code === 'CANCELLATION_ALREADY_CONFIRMED'
      ? 'This cancellation was already confirmed.'
      : 'The cancellation was confirmed.';
  }
  if (action === 'REJECT_CANCELLATION') {
    return code === 'CANCELLATION_ALREADY_REJECTED'
      ? 'This cancellation request was already declined.'
      : 'The request was declined and moved to review.';
  }
  return null;
};

const useJobLifecycle = ({ jobId, accessToken, role }) => {
  const [state, dispatch] = useReducer(lifecycleReducer, undefined, createInitialState);
  const [clock, setClock] = useState(Date.now());
  const mountedRef = useRef(true);
  const fetchControllerRef = useRef(null);
  const fetchPromiseRef = useRef(null);
  const fetchQueuedRef = useRef(false);
  const actionInFlightRef = useRef(null);
  const refreshTimerRef = useRef(null);
  const seenEventsRef = useRef(new Set());
  const recentTransitionToastsRef = useRef(new Map());
  const cooldownRefreshRef = useRef(null);

  const refreshDetails = useCallback(async ({ silent = false } = {}) => {
    if (fetchPromiseRef.current) {
      fetchQueuedRef.current = true;
      return fetchPromiseRef.current;
    }

    if (!silent) dispatch({ type: 'DETAILS_LOADING' });
    const controller = new AbortController();
    fetchControllerRef.current = controller;

    const request = (async () => {
      try {
        const response = await getJobLifecycleDetails(jobId, { signal: controller.signal });
        if (response?.EC !== 0) throw response;
        if (!mountedRef.current) return response;

        if (!isLifecycleWorkspaceStatus(response.DT?.job?.status)) {
          dispatch({
            type: 'OUTSIDE_STATUS',
            status: response.DT?.job?.status || 'UNKNOWN',
          });
          return response;
        }

        const retryAfter = Number(response.DT?.arrival_policy?.retry_after_seconds);
        dispatch({
          type: 'DETAILS_SUCCESS',
          details: response.DT,
          cooldownDeadline: Number.isFinite(retryAfter) && retryAfter > 0
            ? Date.now() + (retryAfter * 1000)
            : null,
        });
        return response;
      } catch (error) {
        if (error?.name === 'CanceledError' || error?.name === 'AbortError') return null;
        const envelope = getEnvelope(error);
        if (envelope.code === 'INVALID_JOB_STATUS' && envelope.DT?.current_status) {
          dispatch({ type: 'OUTSIDE_STATUS', status: envelope.DT.current_status });
          return null;
        }
        if (mountedRef.current) {
          dispatch({
            type: 'DETAILS_ERROR',
            message: getFriendlyLifecycleError(
              envelope,
              'The job workspace could not be loaded.',
            ),
          });
        }
        return null;
      } finally {
        fetchPromiseRef.current = null;
        if (fetchControllerRef.current === controller) fetchControllerRef.current = null;
        if (fetchQueuedRef.current && mountedRef.current) {
          fetchQueuedRef.current = false;
          window.setTimeout(() => void refreshDetails({ silent: true }), 0);
        }
      }
    })();

    fetchPromiseRef.current = request;
    return request;
  }, [jobId]);

  const scheduleRefresh = useCallback(() => {
    if (refreshTimerRef.current) window.clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = window.setTimeout(() => {
      refreshTimerRef.current = null;
      void refreshDetails({ silent: true });
    }, 180);
  }, [refreshDetails]);

  useEffect(() => {
    mountedRef.current = true;
    void refreshDetails();
    return () => {
      mountedRef.current = false;
      fetchControllerRef.current?.abort();
      if (refreshTimerRef.current) window.clearTimeout(refreshTimerRef.current);
    };
  }, [refreshDetails]);

  const handleSocketEvent = useCallback((eventName, payload) => {
    const eventIdentity = payload?.arrival_request_id
      || payload?.cancellation_id
      || payload?.quote_id
      || payload?.completion_request_id
      || payload?.warranty_id
      || payload?.claim_id
      || payload?.warranty_completion_request_id
      || payload?.responded_at
      || payload?.arrived_at
      || payload?.started_at
      || payload?.status
      || 'event';
    const key = [
      eventName,
      payload?.job_id || jobId,
      payload?.acceptance_cycle || 'cycle',
      eventIdentity,
    ].join(':');

    if (!seenEventsRef.current.has(key)) {
      seenEventsRef.current.add(key);
      if (seenEventsRef.current.size > 80) {
        seenEventsRef.current = new Set([...seenEventsRef.current].slice(-40));
      }
      const transitionStatus = payload?.current_status || payload?.job_status || payload?.status || (
        eventName === 'JOB_QUOTE_REJECTED' ? 'CANCELLED' : null
      );
      const transitionKey = transitionStatus
        ? `${payload?.job_id || jobId}:${payload?.acceptance_cycle || 'cycle'}:${transitionStatus}`
        : null;
      const transitionSeenAt = transitionKey
        ? recentTransitionToastsRef.current.get(transitionKey)
        : null;
      const pairedTransitionDuplicate = transitionSeenAt
        && Date.now() - transitionSeenAt < 2500;
      if (transitionKey && !pairedTransitionDuplicate) {
        recentTransitionToastsRef.current.set(transitionKey, Date.now());
      }
      if (!(eventName === 'JOB_QUOTE_SUBMITTED' && role === 'HANDYMAN')
        && !pairedTransitionDuplicate) {
        toast.info(SOCKET_TOASTS[eventName] || 'The job was updated.');
      }
    }

    if (eventName === 'JOB_CANCELLED') {
      dispatch({ type: 'OUTSIDE_STATUS', status: 'CANCELLED' });
      return;
    }
    scheduleRefresh();
  }, [jobId, role, scheduleRefresh]);

  const socketConnectionState = useJobLifecycleSocket({
    accessToken,
    acceptanceCycle: state.details?.job?.acceptance_cycle,
    jobId,
    onEvent: handleSocketEvent,
    onReconnect: scheduleRefresh,
  });

  const handleMutationError = useCallback((error) => {
    const envelope = getEnvelope(error);
    toast.error(getFriendlyLifecycleError(envelope));

    if (envelope.code === 'INVALID_JOB_STATUS' && envelope.DT?.current_status) {
      dispatch({ type: 'OUTSIDE_STATUS', status: envelope.DT.current_status });
      return;
    }

    if (STALE_CONFLICT_CODES.has(envelope.code)) {
      dispatch({ type: 'FORCE_CLOSE_MODAL' });
      scheduleRefresh();
    }
  }, [scheduleRefresh]);

  const runMutation = useCallback(async ({
    name,
    request,
    resolveOutsideStatus,
    successMessage,
  }) => {
    if (actionInFlightRef.current) return null;
    actionInFlightRef.current = name;
    dispatch({ type: 'MUTATION_START', name });

    try {
      const response = await request();
      if (response?.EC !== 0) throw response;
      if (!mountedRef.current) return response;

      const message = typeof successMessage === 'function'
        ? successMessage(response)
        : successMessage || getMutationSuccessMessage(name, response);
      if (message) toast.success(message);

      const outsideStatus = resolveOutsideStatus?.(response);
      if (outsideStatus) {
        dispatch({ type: 'OUTSIDE_STATUS', status: outsideStatus });
      } else {
        await refreshDetails({ silent: true });
      }
      return response;
    } catch (error) {
      if (mountedRef.current) handleMutationError(error);
      return null;
    } finally {
      actionInFlightRef.current = null;
      if (mountedRef.current) dispatch({ type: 'MUTATION_END' });
    }
  }, [handleMutationError, refreshDetails]);

  const actions = useMemo(() => ({
    startMoving: (location) => runMutation({
      name: 'START_MOVING',
      request: () => startMovingApi(jobId, location),
    }),
    createArrival: (location) => runMutation({
      name: 'REQUEST_ARRIVAL',
      request: () => createArrivalRequest(jobId, location),
    }),
    confirmArrival: (requestId) => runMutation({
      name: 'CONFIRM_ARRIVAL',
      request: () => confirmArrivalApi(jobId, requestId),
    }),
    rejectArrival: (requestId, payload) => runMutation({
      name: 'REJECT_ARRIVAL',
      request: () => rejectArrivalApi(jobId, requestId, payload),
    }),
    cancelAcceptedCustomer: (payload) => runMutation({
      name: 'CANCEL_ACCEPTED',
      request: () => cancelAcceptedByCustomer(jobId, payload),
      successMessage: payload.action === 'REOPEN_BIDDING'
        ? 'The job returned to Bidding.'
        : 'The job was cancelled.',
      resolveOutsideStatus: () => (
        payload.action === 'REOPEN_BIDDING' ? 'BIDDING' : 'CANCELLED'
      ),
    }),
    cancelAcceptedHandyman: (payload) => runMutation({
      name: 'CANCEL_ACCEPTED',
      request: () => cancelAcceptedByHandyman(jobId, payload),
      successMessage: 'You withdrew from the job.',
      resolveOutsideStatus: () => 'BIDDING',
    }),
    createCancellation: (payload) => runMutation({
      name: 'REQUEST_CANCELLATION',
      request: () => createLifecycleCancellationApi(jobId, payload),
      resolveOutsideStatus: (response) => (
        response.code === 'CANCELLATION_RESOLVED' || response.DT?.status === 'RESOLVED'
          ? 'CANCELLED'
          : null
      ),
    }),
    confirmCancellation: (cancellationId) => runMutation({
      name: 'CONFIRM_CANCELLATION',
      request: () => confirmLifecycleCancellationApi(jobId, cancellationId),
      resolveOutsideStatus: () => 'CANCELLED',
    }),
    rejectCancellation: (cancellationId, payload) => runMutation({
      name: 'REJECT_CANCELLATION',
      request: () => rejectLifecycleCancellationApi(jobId, cancellationId, payload),
    }),
  }), [jobId, runMutation]);

  useEffect(() => {
    if (!state.cooldownDeadline) return undefined;
    const timer = window.setInterval(() => setClock(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [state.cooldownDeadline]);

  const cooldownSeconds = state.cooldownDeadline
    ? Math.max(0, Math.ceil((state.cooldownDeadline - clock) / 1000))
    : 0;

  useEffect(() => {
    if (!state.cooldownDeadline || cooldownSeconds > 0) return;
    if (cooldownRefreshRef.current === state.cooldownDeadline) return;
    cooldownRefreshRef.current = state.cooldownDeadline;
    void refreshDetails({ silent: true });
  }, [cooldownSeconds, refreshDetails, state.cooldownDeadline]);

  const job = state.details?.job;
  const hasJobCoordinates = job?.gps_lat !== null
    && job?.gps_lat !== undefined
    && job?.gps_long !== null
    && job?.gps_long !== undefined
    && Number.isFinite(Number(job.gps_lat))
    && Number.isFinite(Number(job.gps_long));

  const mutationState = useMemo(() => ({
    isStartingMoving: state.activeMutation === 'START_MOVING',
    isRequestingArrival: state.activeMutation === 'REQUEST_ARRIVAL',
    isConfirmingArrival: state.activeMutation === 'CONFIRM_ARRIVAL',
    isRejectingArrival: state.activeMutation === 'REJECT_ARRIVAL',
    isCancelling: ['CANCEL_ACCEPTED', 'REQUEST_CANCELLATION'].includes(state.activeMutation),
    isRespondingToCancellation: [
      'CONFIRM_CANCELLATION',
      'REJECT_CANCELLATION',
    ].includes(state.activeMutation),
    isAnyMutation: Boolean(state.activeMutation),
  }), [state.activeMutation]);

  return {
    ...state,
    actions,
    allowedActions: state.details?.allowed_actions || [],
    closeModal: () => dispatch({ type: 'CLOSE_MODAL' }),
    cooldownSeconds,
    hasJobCoordinates,
    mutationState,
    openModal: (name) => dispatch({ type: 'OPEN_MODAL', name }),
    exitWorkspace: (status) => dispatch({ type: 'OUTSIDE_STATUS', status }),
    refreshDetails,
    socketConnectionState,
  };
};

export default useJobLifecycle;
