import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import {
  deleteBeforeEvidence as deleteBeforeEvidenceApi,
  listBeforeEvidence,
  uploadBeforeEvidence,
} from '../../../api/jobLifecycleApi';
import { INSPECTION_QUOTE_LIMITS } from '../constants/inspectionQuote.constants';
import { getFriendlyLifecycleError } from '../utils/jobLifecycleUi';

const createUploadId = () => (
  globalThis.crypto?.randomUUID?.()
  || `evidence-${Date.now()}-${Math.random().toString(16).slice(2)}`
);

const useBeforeEvidence = ({
  enabled,
  jobId,
  onCanonicalRefresh,
}) => {
  const [evidence, setEvidence] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [uploads, setUploads] = useState([]);
  const [deletingId, setDeletingId] = useState(null);
  const controllerRef = useRef(null);
  const mountedRef = useRef(true);
  const cleanupTimersRef = useRef(new Set());

  const updateUpload = useCallback((uploadId, changes) => {
    setUploads((current) => current.map((item) => (
      item.id === uploadId ? { ...item, ...changes } : item
    )));
  }, []);

  const removeUploadLater = useCallback((uploadId, previewUrl) => {
    const timer = window.setTimeout(() => {
      cleanupTimersRef.current.delete(timer);
      setUploads((current) => current.filter((item) => item.id !== uploadId));
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    }, 1200);
    cleanupTimersRef.current.add(timer);
  }, []);

  const refreshEvidence = useCallback(async ({ silent = false } = {}) => {
    if (!enabled || !jobId) return null;
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    if (!silent) setLoading(true);
    setLoadError(null);
    try {
      const response = await listBeforeEvidence(jobId, { signal: controller.signal });
      if (response?.EC !== 0) throw response;
      if (mountedRef.current) setEvidence(response.DT?.evidence || []);
      return response;
    } catch (error) {
      if (error?.name === 'CanceledError' || error?.name === 'AbortError') return null;
      if (mountedRef.current) {
        setLoadError(getFriendlyLifecycleError(error, 'Inspection photos could not be loaded.'));
      }
      return null;
    } finally {
      if (mountedRef.current && !silent) setLoading(false);
      if (controllerRef.current === controller) controllerRef.current = null;
    }
  }, [enabled, jobId]);

  useEffect(() => {
    mountedRef.current = true;
    if (enabled) void refreshEvidence();
    else {
      controllerRef.current?.abort();
      setEvidence([]);
      setLoadError(null);
    }
    return () => {
      mountedRef.current = false;
      controllerRef.current?.abort();
      cleanupTimersRef.current.forEach((timer) => window.clearTimeout(timer));
      cleanupTimersRef.current.clear();
    };
  }, [enabled, refreshEvidence]);

  const uploadFiles = useCallback(async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;

    const availableSlots = Math.max(
      0,
      INSPECTION_QUOTE_LIMITS.beforeEvidenceMaxFiles
        - evidence.length
        - uploads.filter((upload) => !['failed', 'uploaded'].includes(upload.state)).length,
    );
    if (availableSlots === 0) {
      toast.error(`A maximum of ${INSPECTION_QUOTE_LIMITS.beforeEvidenceMaxFiles} inspection photos is allowed.`);
      return;
    }

    const selectedFiles = files.slice(0, availableSlots);
    if (selectedFiles.length < files.length) {
      toast.info(`Only ${selectedFiles.length} photo(s) were added because the limit is ${INSPECTION_QUOTE_LIMITS.beforeEvidenceMaxFiles}.`);
    }

    const prepared = selectedFiles.map((file) => ({
      id: createUploadId(),
      file,
      name: file.name,
      previewUrl: URL.createObjectURL(file),
      progress: 0,
      state: 'selected',
      error: null,
    }));
    setUploads((current) => [...current, ...prepared]);

    for (const item of prepared) {
      if (!['image/jpeg', 'image/png'].includes(item.file.type)) {
        updateUpload(item.id, {
          state: 'failed',
          error: 'Only JPEG and PNG images are supported.',
        });
        continue;
      }
      if (item.file.size <= 0) {
        updateUpload(item.id, {
          state: 'failed',
          error: 'This image file is empty.',
        });
        continue;
      }
      if (item.file.size > INSPECTION_QUOTE_LIMITS.beforeEvidenceMaxSizeBytes) {
        updateUpload(item.id, {
          state: 'failed',
          error: 'This image is larger than 5 MB.',
        });
        continue;
      }

      updateUpload(item.id, { state: 'uploading', progress: 0, error: null });
      try {
        const response = await uploadBeforeEvidence(jobId, item.file, {
          onUploadProgress: (event) => {
            const total = Number(event.total);
            const loaded = Number(event.loaded);
            const progress = total > 0
              ? Math.min(100, Math.round((loaded / total) * 100))
              : 0;
            updateUpload(item.id, {
              progress,
              state: progress >= 100 ? 'processing' : 'uploading',
            });
          },
        });
        if (response?.EC !== 0) throw response;
        updateUpload(item.id, { state: 'processing', progress: 100 });
        await new Promise((resolve) => window.setTimeout(resolve, 80));
        const created = response.DT?.evidence;
        if (created && mountedRef.current) {
          setEvidence((current) => (
            current.some((entry) => entry.id === created.id)
              ? current
              : [...current, created]
          ));
        }
        updateUpload(item.id, {
          state: 'uploaded',
          progress: 100,
          evidenceId: created?.id || null,
        });
        await Promise.all([
          refreshEvidence({ silent: true }),
          onCanonicalRefresh?.({ silent: true }),
        ]);
        removeUploadLater(item.id, item.previewUrl);
      } catch (error) {
        const envelope = error?.response?.data || error || {};
        updateUpload(item.id, {
          state: 'failed',
          error: getFriendlyLifecycleError(envelope, 'This photo could not be uploaded.'),
        });
        if (['EVIDENCE_LOCKED', 'JOB_NOT_ARRIVED', 'ACCEPTANCE_CYCLE_INCONSISTENT'].includes(envelope.code)) {
          await onCanonicalRefresh?.({ silent: true });
        }
      }
    }
  }, [
    evidence.length,
    jobId,
    onCanonicalRefresh,
    refreshEvidence,
    removeUploadLater,
    updateUpload,
    uploads,
  ]);

  const removeFailedUpload = useCallback((uploadId) => {
    setUploads((current) => {
      const target = current.find((item) => item.id === uploadId);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return current.filter((item) => item.id !== uploadId);
    });
  }, []);

  const retryUpload = useCallback((uploadId) => {
    const target = uploads.find((item) => item.id === uploadId);
    if (!target?.file) return;
    removeFailedUpload(uploadId);
    void uploadFiles([target.file]);
  }, [removeFailedUpload, uploadFiles, uploads]);

  const deleteEvidence = useCallback(async (evidenceId) => {
    if (deletingId) return null;
    setDeletingId(evidenceId);
    try {
      const response = await deleteBeforeEvidenceApi(jobId, evidenceId);
      if (response?.EC !== 0) throw response;
      setEvidence((current) => current.filter((item) => item.id !== evidenceId));
      toast.success('Inspection photo deleted.');
      await Promise.all([
        refreshEvidence({ silent: true }),
        onCanonicalRefresh?.({ silent: true }),
      ]);
      return response;
    } catch (error) {
      const envelope = error?.response?.data || error || {};
      toast.error(getFriendlyLifecycleError(envelope, 'The inspection photo could not be deleted.'));
      if (['EVIDENCE_LOCKED', 'JOB_NOT_ARRIVED', 'ACCEPTANCE_CYCLE_INCONSISTENT'].includes(envelope.code)) {
        await onCanonicalRefresh?.({ silent: true });
      }
      return null;
    } finally {
      if (mountedRef.current) setDeletingId(null);
    }
  }, [deletingId, jobId, onCanonicalRefresh, refreshEvidence]);

  return {
    deleteEvidence,
    deletingId,
    evidence,
    loadError,
    loading,
    refreshEvidence,
    removeFailedUpload,
    retryUpload,
    uploadFiles,
    uploads,
  };
};

export default useBeforeEvidence;
