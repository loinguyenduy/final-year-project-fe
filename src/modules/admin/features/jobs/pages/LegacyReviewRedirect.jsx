import React, { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { LoadingState } from '../../../components/AdminStates';
import { getAdminReviewCase } from '../../../services/adminReviewService';

// Compatibility-only resolver for historical bookmarks. New flows must link directly to Admin Jobs.
const LegacyReviewRedirect = ({ list = false }) => {
  const { caseType, caseId } = useParams();
  const navigate = useNavigate();
  const started = useRef(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (list || started.current) return;
    started.current = true;
    getAdminReviewCase(caseType, caseId).then((response) => {
      const jobId = response?.DT?.job?.id;
      if (!jobId) throw new Error('Missing Job identity');
      const acceptanceCycle = response?.DT?.case?.acceptance_cycle || response?.DT?.job?.acceptance_cycle;
      const query = new URLSearchParams({ section: 'reviews', case_type: caseType, case_id: caseId });
      if (acceptanceCycle) query.set('cycle', String(acceptanceCycle));
      navigate(`/admin/jobs/${jobId}?${query.toString()}`, { replace: true });
    }).catch(() => setFailed(true));
  }, [caseId, caseType, list, navigate]);

  if (list) return <Navigate to="/admin/jobs?needs_review=true&sort=REVIEW_REQUIRED_FIRST" replace />;
  if (failed) return <Navigate to="/admin/jobs?needs_review=true&sort=REVIEW_REQUIRED_FIRST&legacy_case_unavailable=true" replace />;
  return <LoadingState message="Resolving legacy Review link..." />;
};

export default LegacyReviewRedirect;
