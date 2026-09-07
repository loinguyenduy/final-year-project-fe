import React from 'react';
import { INSPECTION_QUOTE_LIMITS } from '../constants/inspectionQuote.constants';
import EvidenceManager from './EvidenceManager';

const BeforeEvidenceManager = (props) => (
  <EvidenceManager
    {...props}
    countMode="all"
    description="Add clear JPEG or PNG photos before submitting the Quote. Each photo is uploaded and processed separately."
    emptyCopy="No inspection photos have been added yet."
    eyebrow="Before evidence"
    maxFiles={INSPECTION_QUOTE_LIMITS.beforeEvidenceMaxFiles}
    title="Inspection photos"
  />
);

export default BeforeEvidenceManager;
