import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { getFriendlyLifecycleError } from '../utils/jobLifecycleUi';

const DEFAULT_MAX_FILES = 5;
const DEFAULT_MAX_SIZE_BYTES = 5 * 1024 * 1024;

const createUploadId = () => (
  globalThis.crypto?.randomUUID?.()
  || `evidence-${Date.now()}-${Math.random().toString(16).slice(2)}`
);

const isAbortError = (error) => (
  error?.name === 'CanceledError' || error?.name === 'AbortError'
);

const useEvidenceManager = ({
  countTowardsLimit = (items) => items.length,
  deleteEvidenceApi,
  enabled,
  errorFallback = 'Evidence photos could not be loaded.',
  jobId,
  maxFiles = DEFAULT_MAX_FILES,
  maxSizeBytes = DEFAULT_MAX_SIZE_BYTES,
  onCanonicalRefresh,
  successDeleteCopy = 'Evidence photo deleted.',
  uploadEvidenceApi,
  listEvidenceApi,
}) => {
  const [evidence, setEvidence] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [uploads, setUploads] = useState([]);
  const [deletingId, setDeletingId] = useState(null);
  const controllerRef = useRef(null);
  const mountedRef = useRef(true);
  const cleanupTimersRef = useRef(new Set());
  const evidenceRef = useRef(evidence);
  const uploadsRef = useRef(uploads);

  evidenceRef.current = evidence;
  uploadsRef.current = uploads;

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
    if (!enabled || !jobId || !listEvidenceApi) return null;
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    if (!silent) setLoading(true);
    setLoadError(null);
    try {
      const response = await listEvidenceApi(jobId, { signal: controller.signal });
      if (response?.EC !== 0) throw response;
      if (mountedRef.current) setEvidence(response.DT?.evidence || []);
      return response;
    } catch (error) {
      if (isAbortError(error)) return null;
      if (mountedRef.current) {
        setLoadError(getFriendlyLifecycleError(error, errorFallback));
      }
      return null;
    } finally {
      if (mountedRef.current && !silent) setLoading(false);
      if (controllerRef.current === controller) controllerRef.current = null;
    }
  }, [enabled, errorFallback, jobId, listEvidenceApi]);

  useEffect(() => {
    mountedRef.current = true;
    if (enabled) void refreshEvidence();
    else {
      controllerRef.current?.abort();
      setEvidence([]);
      setLoadError(null);
      setUploads((current) => {
        current.forEach((item) => item.previewUrl && URL.revokeObjectURL(item.previewUrl));
        return [];
      });
    }
    return () => {
      mountedRef.current = false;
      controllerRef.current?.abort();
    };
  }, [enabled, refreshEvidence]);

  useEffect(() => () => {
    cleanupTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    cleanupTimersRef.current.clear();
    uploadsRef.current.forEach((item) => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    });
  }, []);

  const uploadFiles = useCallback(async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length || !uploadEvidenceApi) return;

    const activeUploads = uploadsRef.current.filter(
      (upload) => !['failed', 'uploaded'].includes(upload.state),
    ).length;
    const availableSlots = Math.max(
      0,
      maxFiles - countTowardsLimit(evidenceRef.current) - activeUploads,
    );
    if (availableSlots === 0) {
      toast.error(`A maximum of ${maxFiles} new photos is allowed for this attempt.`);
      return;
    }

    const selectedFiles = files.slice(0, availableSlots);
    if (selectedFiles.length < files.length) {
      toast.info(`Only ${selectedFiles.length} photo(s) were added because this attempt allows ${maxFiles}.`);
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
        updateUpload(item.id, { state: 'failed', error: 'Only JPEG and PNG images are supported.' });
        continue;
      }
      if (item.file.size <= 0) {
        updateUpload(item.id, { state: 'failed', error: 'This image file is empty.' });
        continue;
      }
      if (item.file.size > maxSizeBytes) {
        updateUpload(item.id, { state: 'failed', error: 'This image is larger than 5 MB.' });
        continue;
      }

      updateUpload(item.id, { state: 'uploading', progress: 0, error: null });
      try {
        const response = await uploadEvidenceApi(jobId, item.file, {
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
        const created = response.DT?.evidence;
        if (created && mountedRef.current) {
          setEvidence((current) => (
            current.some((entry) => entry.id === created.id) ? current : [...current, created]
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
        if (Number(envelope.EC) === 409 || Number(error?.response?.status) === 409) {
          await Promise.all([
            refreshEvidence({ silent: true }),
            onCanonicalRefresh?.({ silent: true }),
          ]);
        }
      }
    }
  }, [
    countTowardsLimit,
    jobId,
    maxFiles,
    maxSizeBytes,
    onCanonicalRefresh,
    refreshEvidence,
    removeUploadLater,
    updateUpload,
    uploadEvidenceApi,
  ]);

  const removeFailedUpload = useCallback((uploadId) => {
    setUploads((current) => {
      const target = current.find((item) => item.id === uploadId);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return current.filter((item) => item.id !== uploadId);
    });
  }, []);

  const retryUpload = useCallback((uploadId) => {
    const target = uploadsRef.current.find((item) => item.id === uploadId);
    if (!target?.file) return;
    removeFailedUpload(uploadId);
    void uploadFiles([target.file]);
  }, [removeFailedUpload, uploadFiles]);

  const deleteEvidence = useCallback(async (evidenceId) => {
    if (deletingId || !deleteEvidenceApi) return null;
    setDeletingId(evidenceId);
    try {
      const response = await deleteEvidenceApi(jobId, evidenceId);
      if (response?.EC !== 0) throw response;
      setEvidence((current) => current.filter((item) => item.id !== evidenceId));
      toast.success(successDeleteCopy);
      await Promise.all([
        refreshEvidence({ silent: true }),
        onCanonicalRefresh?.({ silent: true }),
      ]);
      return response;
    } catch (error) {
      const envelope = error?.response?.data || error || {};
      toast.error(getFriendlyLifecycleError(envelope, 'The evidence photo could not be deleted.'));
      if (Number(envelope.EC) === 409 || Number(error?.response?.status) === 409) {
        await Promise.all([
          refreshEvidence({ silent: true }),
          onCanonicalRefresh?.({ silent: true }),
        ]);
      }
      return null;
    } finally {
      if (mountedRef.current) setDeletingId(null);
    }
  }, [
    deleteEvidenceApi,
    deletingId,
    jobId,
    onCanonicalRefresh,
    refreshEvidence,
    successDeleteCopy,
  ]);

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

export {
  DEFAULT_MAX_FILES,
  DEFAULT_MAX_SIZE_BYTES,
};
export default useEvidenceManager;
