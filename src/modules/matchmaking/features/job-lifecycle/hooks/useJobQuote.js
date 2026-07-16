import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import {
  createQuoteDraft,
  getCurrentQuote,
  submitQuote,
  updateQuoteDraft,
} from '../../../api/jobLifecycleApi';
import { INSPECTION_QUOTE_LIMITS } from '../constants/inspectionQuote.constants';
import {
  calculateQuotePreview,
  combineDurationMinutes,
  parseUnsignedScaledDecimal,
  parseVndInteger,
  splitDurationMinutes,
} from '../utils/quoteDecimal';
import { getFriendlyLifecycleError } from '../utils/jobLifecycleUi';

const createItemId = () => (
  globalThis.crypto?.randomUUID?.()
  || `quote-item-${Date.now()}-${Math.random().toString(16).slice(2)}`
);

const emptyQuoteForm = () => ({
  problem_summary: '',
  inspection_notes: '',
  recommended_solution: '',
  duration_hours: '',
  duration_minutes: '',
  warranty_days: '',
  discount_amount: '0',
  variance_reason: '',
  variance_reason_text: '',
  items: [],
});

const quoteToForm = (quote) => {
  if (!quote) return emptyQuoteForm();
  const duration = splitDurationMinutes(quote.estimated_duration_minutes);
  return {
    problem_summary: quote.problem_summary || '',
    inspection_notes: quote.inspection_notes || '',
    recommended_solution: quote.recommended_solution || '',
    duration_hours: duration.hours,
    duration_minutes: duration.minutes,
    warranty_days: quote.warranty_days === null || quote.warranty_days === undefined
      ? ''
      : String(quote.warranty_days),
    discount_amount: quote.discount_amount || '0',
    variance_reason: quote.variance_reason || '',
    variance_reason_text: quote.variance_reason_text || '',
    items: (quote.items || []).map((item) => ({
      client_id: item.id || createItemId(),
      item_type: item.item_type || 'LABOUR',
      description: item.description || '',
      quantity: item.quantity || '',
      unit: item.unit || '',
      unit_price: item.unit_price || '',
    })),
  };
};

const serializeForm = (form) => JSON.stringify(form);

const buildDraftPayload = (form, expectedDraftRevision) => {
  const duration = combineDurationMinutes({
    hours: form.duration_hours,
    minutes: form.duration_minutes,
    maxMinutes: INSPECTION_QUOTE_LIMITS.durationMaxMinutes,
  });
  if (!duration.valid) return { valid: false, message: duration.message };

  const warrantyRaw = String(form.warranty_days ?? '').trim();
  let warranty = null;
  if (warrantyRaw) {
    if (!/^\d+$/.test(warrantyRaw)) {
      return { valid: false, message: 'Warranty days must be a whole number.' };
    }
    warranty = Number(warrantyRaw);
    if (!Number.isSafeInteger(warranty)
      || warranty < 0
      || warranty > INSPECTION_QUOTE_LIMITS.warrantyMaxDays) {
      return {
        valid: false,
        message: `Warranty must be between 0 and ${INSPECTION_QUOTE_LIMITS.warrantyMaxDays.toLocaleString('en-US')} days.`,
      };
    }
  }

  const textFields = [
    ['Problem summary', form.problem_summary],
    ['Inspection notes', form.inspection_notes],
    ['Recommended solution', form.recommended_solution],
  ];
  const tooLong = textFields.find(([, value]) => (
    String(value || '').trim().length > INSPECTION_QUOTE_LIMITS.reportTextMaxLength
  ));
  if (tooLong) {
    return {
      valid: false,
      message: `${tooLong[0]} must not exceed ${INSPECTION_QUOTE_LIMITS.reportTextMaxLength.toLocaleString('en-US')} characters.`,
    };
  }

  if (form.items.length > INSPECTION_QUOTE_LIMITS.quoteMaxItems) {
    return {
      valid: false,
      message: `A Quote can contain at most ${INSPECTION_QUOTE_LIMITS.quoteMaxItems} items.`,
    };
  }

  for (let index = 0; index < form.items.length; index += 1) {
    const item = form.items[index];
    if (!String(item.description || '').trim()) {
      return { valid: false, message: `Item ${index + 1} needs a description.` };
    }
    if (String(item.description).trim().length > INSPECTION_QUOTE_LIMITS.itemDescriptionMaxLength) {
      return { valid: false, message: `Item ${index + 1} description is too long.` };
    }
    if (!String(item.unit || '').trim()
      || String(item.unit).trim().length > INSPECTION_QUOTE_LIMITS.itemUnitMaxLength) {
      return { valid: false, message: `Item ${index + 1} needs a valid unit.` };
    }
    const quantity = parseUnsignedScaledDecimal(item.quantity, 3);
    if (quantity === null || quantity <= 0n) {
      return {
        valid: false,
        message: `Item ${index + 1} quantity must be greater than zero with at most three decimal places.`,
      };
    }
    if (parseVndInteger(item.unit_price) === null) {
      return { valid: false, message: `Item ${index + 1} unit price must be a VND integer.` };
    }
  }

  const preview = calculateQuotePreview({
    items: form.items,
    discountAmount: form.discount_amount,
  });
  if (!preview.valid) {
    return {
      valid: false,
      message: 'Discount must be a VND integer between zero and the current subtotal.',
    };
  }
  if (BigInt(preview.total) > BigInt(INSPECTION_QUOTE_LIMITS.quoteMaxAmount)) {
    return {
      valid: false,
      message: `Quote total must not exceed ${INSPECTION_QUOTE_LIMITS.quoteMaxAmount.toLocaleString('en-US')} VND.`,
    };
  }

  if (form.variance_reason === 'OTHER'
    && !String(form.variance_reason_text || '').trim()) {
    return { valid: false, message: 'Add a short explanation for the variance reason.' };
  }
  if (!form.variance_reason && String(form.variance_reason_text || '').trim()) {
    return { valid: false, message: 'Select a variance reason before adding its explanation.' };
  }
  if (String(form.variance_reason_text || '').trim().length
    > INSPECTION_QUOTE_LIMITS.varianceReasonTextMaxLength) {
    return { valid: false, message: 'Variance explanation must not exceed 500 characters.' };
  }

  return {
    valid: true,
    payload: {
      expected_draft_revision: expectedDraftRevision,
      problem_summary: String(form.problem_summary || '').trim() || null,
      inspection_notes: String(form.inspection_notes || '').trim() || null,
      recommended_solution: String(form.recommended_solution || '').trim() || null,
      estimated_duration_minutes: duration.value,
      warranty_days: warranty,
      discount_amount: String(form.discount_amount || '0').trim() || '0',
      items: form.items.map((item) => ({
        item_type: item.item_type,
        description: String(item.description || '').trim(),
        quantity: String(item.quantity || '').trim(),
        unit: String(item.unit || '').trim(),
        unit_price: String(item.unit_price || '').trim(),
      })),
      variance_reason: form.variance_reason || null,
      variance_reason_text: String(form.variance_reason_text || '').trim() || null,
    },
  };
};

const useJobQuote = ({
  enabled,
  jobId,
  onCanonicalRefresh,
}) => {
  const [quote, setQuote] = useState(null);
  const [form, setForm] = useState(emptyQuoteForm);
  const [savedFormSnapshot, setSavedFormSnapshot] = useState(serializeForm(emptyQuoteForm()));
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [formError, setFormError] = useState(null);
  const controllerRef = useRef(null);
  const mountedRef = useRef(true);

  const applyCanonicalQuote = useCallback((canonicalQuote) => {
    const nextForm = quoteToForm(canonicalQuote);
    setQuote(canonicalQuote);
    setForm(nextForm);
    setSavedFormSnapshot(serializeForm(nextForm));
    setFormError(null);
  }, []);

  const refreshQuote = useCallback(async ({ silent = false } = {}) => {
    if (!enabled || !jobId) return null;
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    if (!silent) setLoading(true);
    setLoadError(null);
    try {
      const response = await getCurrentQuote(jobId, { signal: controller.signal });
      if (response?.EC !== 0) throw response;
      if (mountedRef.current) applyCanonicalQuote(response.DT?.quote || null);
      return response;
    } catch (error) {
      if (error?.name === 'CanceledError' || error?.name === 'AbortError') return null;
      if (mountedRef.current) {
        setLoadError(getFriendlyLifecycleError(error, 'The current Quote could not be loaded.'));
      }
      return null;
    } finally {
      if (mountedRef.current && !silent) setLoading(false);
      if (controllerRef.current === controller) controllerRef.current = null;
    }
  }, [applyCanonicalQuote, enabled, jobId]);

  useEffect(() => {
    mountedRef.current = true;
    if (enabled) void refreshQuote();
    else {
      controllerRef.current?.abort();
      setQuote(null);
      setForm(emptyQuoteForm());
      setLoadError(null);
      setFormError(null);
    }
    return () => {
      mountedRef.current = false;
      controllerRef.current?.abort();
    };
  }, [enabled, refreshQuote]);

  const createDraft = useCallback(async () => {
    if (creating) return null;
    setCreating(true);
    setFormError(null);
    try {
      const response = await createQuoteDraft(jobId);
      if (response?.EC !== 0) throw response;
      applyCanonicalQuote(response.DT?.quote || null);
      toast.success(
        response.code === 'QUOTE_DRAFT_EXISTS'
          ? 'The existing Quote Draft was loaded.'
          : 'Quote Draft created.',
      );
      await onCanonicalRefresh?.({ silent: true });
      return response;
    } catch (error) {
      toast.error(getFriendlyLifecycleError(error, 'The Quote Draft could not be created.'));
      return null;
    } finally {
      if (mountedRef.current) setCreating(false);
    }
  }, [applyCanonicalQuote, creating, jobId, onCanonicalRefresh]);

  const updateField = useCallback((field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFormError(null);
  }, []);

  const addItem = useCallback(() => {
    setForm((current) => {
      if (current.items.length >= INSPECTION_QUOTE_LIMITS.quoteMaxItems) return current;
      return {
        ...current,
        items: [
          ...current.items,
          {
            client_id: createItemId(),
            item_type: 'LABOUR',
            description: '',
            quantity: '1',
            unit: 'job',
            unit_price: '0',
          },
        ],
      };
    });
    setFormError(null);
  }, []);

  const updateItem = useCallback((clientId, field, value) => {
    setForm((current) => ({
      ...current,
      items: current.items.map((item) => (
        item.client_id === clientId ? { ...item, [field]: value } : item
      )),
    }));
    setFormError(null);
  }, []);

  const removeItem = useCallback((clientId) => {
    setForm((current) => ({
      ...current,
      items: current.items.filter((item) => item.client_id !== clientId),
    }));
    setFormError(null);
  }, []);

  const saveDraft = useCallback(async () => {
    if (!quote || saving) return null;
    const normalized = buildDraftPayload(form, quote.draft_revision);
    if (!normalized.valid) {
      setFormError(normalized.message);
      return null;
    }

    setSaving(true);
    setFormError(null);
    try {
      const response = await updateQuoteDraft(jobId, quote.id, normalized.payload);
      if (response?.EC !== 0) throw response;
      applyCanonicalQuote(response.DT?.quote || null);
      toast.success('Quote Draft saved. Backend totals are now canonical.');
      await onCanonicalRefresh?.({ silent: true });
      return response;
    } catch (error) {
      const envelope = error?.response?.data || error || {};
      setFormError(getFriendlyLifecycleError(envelope, 'The Quote Draft could not be saved.'));
      if (envelope.code === 'QUOTE_DRAFT_REVISION_CONFLICT') {
        toast.info('A newer Draft was found. The canonical version is being loaded.');
        await Promise.all([
          refreshQuote({ silent: true }),
          onCanonicalRefresh?.({ silent: true }),
        ]);
      } else if ([
        'QUOTE_NOT_DRAFT',
        'JOB_NOT_ARRIVED',
        'QUOTE_LIFECYCLE_INCONSISTENT',
        'ACCEPTANCE_CYCLE_INCONSISTENT',
      ].includes(envelope.code)) {
        await onCanonicalRefresh?.({ silent: true });
      }
      return null;
    } finally {
      if (mountedRef.current) setSaving(false);
    }
  }, [
    applyCanonicalQuote,
    form,
    jobId,
    onCanonicalRefresh,
    quote,
    refreshQuote,
    saving,
  ]);

  const submitSavedDraft = useCallback(async ({ allowed }) => {
    if (!quote || submitting) return null;
    if (serializeForm(form) !== savedFormSnapshot) {
      setFormError('Save your Draft before submitting. Submit never saves changes automatically.');
      return null;
    }
    if (!allowed) {
      setFormError('The backend has not enabled Submit Quote. Save the Draft and complete the readiness requirements first.');
      return null;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      const response = await submitQuote(jobId, quote.id);
      if (response?.EC !== 0) throw response;
      if (response.DT?.quote) applyCanonicalQuote(response.DT.quote);
      toast.success(
        response.code === 'QUOTE_ALREADY_SUBMITTED'
          ? 'This Quote was already submitted.'
          : 'Quote submitted to the Customer.',
      );
      await onCanonicalRefresh?.({ silent: true });
      return response;
    } catch (error) {
      const envelope = error?.response?.data || error || {};
      setFormError(getFriendlyLifecycleError(envelope, 'The Quote could not be submitted.'));
      if ([
        'QUOTE_ALREADY_SUBMITTED',
        'QUOTE_NOT_DRAFT',
        'JOB_NOT_ARRIVED',
        'ACCEPTANCE_CYCLE_INCONSISTENT',
      ].includes(envelope.code)) {
        await onCanonicalRefresh?.({ silent: true });
      }
      return null;
    } finally {
      if (mountedRef.current) setSubmitting(false);
    }
  }, [
    applyCanonicalQuote,
    form,
    jobId,
    onCanonicalRefresh,
    quote,
    savedFormSnapshot,
    submitting,
  ]);

  const preview = useMemo(() => calculateQuotePreview({
    items: form.items,
    discountAmount: form.discount_amount,
  }), [form.discount_amount, form.items]);

  return {
    addItem,
    createDraft,
    creating,
    form,
    formError,
    hasUnsavedChanges: quote?.status === 'DRAFT'
      && serializeForm(form) !== savedFormSnapshot,
    loadError,
    loading,
    preview,
    quote,
    refreshQuote,
    removeItem,
    saveDraft,
    saving,
    setFormError,
    submitSavedDraft,
    submitting,
    updateField,
    updateItem,
  };
};

export default useJobQuote;
