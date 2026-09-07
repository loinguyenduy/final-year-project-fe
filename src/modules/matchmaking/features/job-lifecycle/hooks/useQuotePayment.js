import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import {
  acceptQuote as acceptQuoteApi,
  getContract,
  getPaymentSummary,
  payRemainingAmount,
  rejectQuote as rejectQuoteApi,
} from '../../../api/jobLifecycleApi';
import { getFriendlyLifecycleError } from '../utils/jobLifecycleUi';

const CANONICAL_CONFLICT_CODES = new Set([
  'QUOTE_RESPONSE_CONFLICT',
  'QUOTE_LIFECYCLE_CONFLICT',
  'QUOTE_NOT_ACCEPTED',
  'CANCELLATION_ALREADY_ACTIVE',
  'PAYMENT_STATE_INCONSISTENT',
  'FINANCIAL_DATA_INCONSISTENT',
  'PARTICIPANT_INACTIVE',
]);

const useQuotePayment = ({
  contractEnabled,
  jobId,
  onCanonicalRefresh,
  onCancelled,
  paymentEnabled,
}) => {
  const [payment, setPayment] = useState(null);
  const [contract, setContract] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [contractLoading, setContractLoading] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [contractError, setContractError] = useState(null);
  const [accepting, setAccepting] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [paying, setPaying] = useState(false);
  const [insufficientBalance, setInsufficientBalance] = useState(null);
  const paymentControllerRef = useRef(null);
  const contractControllerRef = useRef(null);
  const mountedRef = useRef(true);

  const refreshPayment = useCallback(async ({ silent = false } = {}) => {
    if (!paymentEnabled || !jobId) return null;
    paymentControllerRef.current?.abort();
    const controller = new AbortController();
    paymentControllerRef.current = controller;
    if (!silent) setPaymentLoading(true);
    setPaymentError(null);
    try {
      const response = await getPaymentSummary(jobId, { signal: controller.signal });
      if (response?.EC !== 0) throw response;
      if (mountedRef.current) setPayment(response.DT || null);
      return response;
    } catch (error) {
      if (error?.name === 'CanceledError' || error?.name === 'AbortError') return null;
      if (mountedRef.current) {
        setPaymentError(getFriendlyLifecycleError(error, 'Payment summary could not be loaded.'));
      }
      return null;
    } finally {
      if (mountedRef.current && !silent) setPaymentLoading(false);
      if (paymentControllerRef.current === controller) paymentControllerRef.current = null;
    }
  }, [jobId, paymentEnabled]);

  const refreshContract = useCallback(async ({ silent = false } = {}) => {
    if (!contractEnabled || !jobId) return null;
    contractControllerRef.current?.abort();
    const controller = new AbortController();
    contractControllerRef.current = controller;
    if (!silent) setContractLoading(true);
    setContractError(null);
    try {
      const response = await getContract(jobId, { signal: controller.signal });
      if (response?.EC !== 0) throw response;
      if (mountedRef.current) setContract(response.DT?.contract || null);
      return response;
    } catch (error) {
      if (error?.name === 'CanceledError' || error?.name === 'AbortError') return null;
      if (mountedRef.current) {
        setContractError(getFriendlyLifecycleError(error, 'The active Contract could not be loaded.'));
      }
      return null;
    } finally {
      if (mountedRef.current && !silent) setContractLoading(false);
      if (contractControllerRef.current === controller) contractControllerRef.current = null;
    }
  }, [contractEnabled, jobId]);

  useEffect(() => {
    mountedRef.current = true;
    if (paymentEnabled) void refreshPayment();
    else {
      paymentControllerRef.current?.abort();
      setPayment(null);
      setPaymentError(null);
    }
    return () => {
      mountedRef.current = false;
      paymentControllerRef.current?.abort();
    };
  }, [paymentEnabled, refreshPayment]);

  useEffect(() => {
    if (contractEnabled) void refreshContract();
    else {
      contractControllerRef.current?.abort();
      setContract(null);
      setContractError(null);
    }
    return () => contractControllerRef.current?.abort();
  }, [contractEnabled, refreshContract]);

  const refreshAfterConflict = useCallback(async (error) => {
    const envelope = error?.response?.data || error || {};
    if (CANONICAL_CONFLICT_CODES.has(envelope.code)) {
      await onCanonicalRefresh?.({ silent: true });
    }
    return envelope;
  }, [onCanonicalRefresh]);

  const acceptQuote = useCallback(async (quoteId) => {
    if (!quoteId || accepting) return null;
    setAccepting(true);
    setInsufficientBalance(null);
    try {
      const response = await acceptQuoteApi(jobId, quoteId);
      if (response?.EC !== 0) throw response;
      const data = response.DT || {};
      setPayment({
        job_id: data.job_id,
        quote_id: data.quote_id,
        acceptance_cycle: data.acceptance_cycle,
        currency: 'VND',
        quote_total_amount: data.quote_total_amount,
        deposit_amount: data.deposit_amount,
        remaining_amount: data.remaining_amount,
        status: 'PENDING',
        payment_completed_at: null,
      });
      toast.success(
        response.code === 'QUOTE_ALREADY_ACCEPTED'
          ? 'This Quote was already accepted. The latest payment details were loaded.'
          : 'Quote accepted. Review the remaining payment to activate the Contract.',
      );
      await onCanonicalRefresh?.({ silent: true });
      return response;
    } catch (error) {
      toast.error(getFriendlyLifecycleError(error, 'The Quote could not be accepted.'));
      await refreshAfterConflict(error);
      return null;
    } finally {
      if (mountedRef.current) setAccepting(false);
    }
  }, [accepting, jobId, onCanonicalRefresh, refreshAfterConflict]);

  const rejectQuote = useCallback(async (quoteId, payload) => {
    if (!quoteId || rejecting) return null;
    setRejecting(true);
    try {
      const response = await rejectQuoteApi(jobId, quoteId, payload);
      if (response?.EC !== 0) throw response;
      toast.success(
        response.code === 'QUOTE_ALREADY_REJECTED'
          ? 'This Quote was already rejected.'
          : 'Quote rejected. The Job was cancelled under the 70/30 deposit policy.',
      );
      onCancelled?.();
      return response;
    } catch (error) {
      toast.error(getFriendlyLifecycleError(error, 'The Quote could not be rejected.'));
      await refreshAfterConflict(error);
      return null;
    } finally {
      if (mountedRef.current) setRejecting(false);
    }
  }, [jobId, onCancelled, refreshAfterConflict, rejecting]);

  const completePayment = useCallback(async () => {
    if (paying) return null;
    setPaying(true);
    setInsufficientBalance(null);
    try {
      const response = await payRemainingAmount(jobId);
      if (response?.EC !== 0) throw response;
      if (response.DT?.payment) setPayment(response.DT.payment);
      if (response.DT?.contract) setContract(response.DT.contract);
      toast.success(
        response.code === 'PAYMENT_ALREADY_COMPLETED'
          ? 'Payment and the active Contract were already completed.'
          : 'Payment completed. The Contract is active and the Job is now In progress.',
      );
      await onCanonicalRefresh?.({ silent: true });
      return response;
    } catch (error) {
      const envelope = error?.response?.data || error || {};
      if (envelope.code === 'INSUFFICIENT_BALANCE') {
        setInsufficientBalance({
          requiredAmount: envelope.DT?.required_amount || null,
          missingAmount: envelope.DT?.missing_amount || null,
        });
      }
      toast.error(getFriendlyLifecycleError(envelope, 'The remaining payment could not be completed.'));
      await refreshAfterConflict(envelope);
      return null;
    } finally {
      if (mountedRef.current) setPaying(false);
    }
  }, [jobId, onCanonicalRefresh, paying, refreshAfterConflict]);

  return {
    acceptQuote,
    accepting,
    completePayment,
    contract,
    contractError,
    contractLoading,
    insufficientBalance,
    payment,
    paymentError,
    paymentLoading,
    paying,
    refreshContract,
    refreshPayment,
    rejectQuote,
    rejecting,
  };
};

export default useQuotePayment;
