import { useCallback } from 'react';
import {
  deleteWorkEvidence,
  listWorkEvidence,
  uploadWorkEvidence,
} from '../../../api/jobLifecycleApi';
import useEvidenceManager from './useEvidenceManager';

const countUnlockedEvidence = (items) => items.filter((item) => !item.is_locked).length;

const useWorkEvidence = ({ enabled, jobId, onCanonicalRefresh, stage }) => {
  const listApi = useCallback(
    (currentJobId, options) => listWorkEvidence(currentJobId, stage, options),
    [stage],
  );
  const uploadApi = useCallback(
    (currentJobId, file, options) => uploadWorkEvidence(currentJobId, stage, file, options),
    [stage],
  );
  const deleteApi = useCallback(
    (currentJobId, evidenceId) => deleteWorkEvidence(currentJobId, stage, evidenceId),
    [stage],
  );

  return useEvidenceManager({
    countTowardsLimit: countUnlockedEvidence,
    deleteEvidenceApi: deleteApi,
    enabled,
    errorFallback: 'Work evidence could not be loaded.',
    jobId,
    listEvidenceApi: listApi,
    onCanonicalRefresh,
    successDeleteCopy: 'Evidence photo deleted.',
    uploadEvidenceApi: uploadApi,
  });
};

export default useWorkEvidence;
