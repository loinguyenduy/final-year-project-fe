import { useCallback } from 'react';
import {
  deleteBeforeEvidence,
  listBeforeEvidence,
  uploadBeforeEvidence,
} from '../../../api/jobLifecycleApi';
import { INSPECTION_QUOTE_LIMITS } from '../constants/inspectionQuote.constants';
import useEvidenceManager from './useEvidenceManager';

const countAllEvidence = (items) => items.length;

const useBeforeEvidence = ({ enabled, jobId, onCanonicalRefresh }) => {
  const listApi = useCallback(
    (currentJobId, options) => listBeforeEvidence(currentJobId, options),
    [],
  );
  const uploadApi = useCallback(
    (currentJobId, file, options) => uploadBeforeEvidence(currentJobId, file, options),
    [],
  );
  const deleteApi = useCallback(
    (currentJobId, evidenceId) => deleteBeforeEvidence(currentJobId, evidenceId),
    [],
  );

  return useEvidenceManager({
    countTowardsLimit: countAllEvidence,
    deleteEvidenceApi: deleteApi,
    enabled,
    errorFallback: 'Inspection photos could not be loaded.',
    jobId,
    listEvidenceApi: listApi,
    maxFiles: INSPECTION_QUOTE_LIMITS.beforeEvidenceMaxFiles,
    maxSizeBytes: INSPECTION_QUOTE_LIMITS.beforeEvidenceMaxSizeBytes,
    onCanonicalRefresh,
    successDeleteCopy: 'Inspection photo deleted.',
    uploadEvidenceApi: uploadApi,
  });
};

export default useBeforeEvidence;
