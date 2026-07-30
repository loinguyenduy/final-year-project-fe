const DOCUMENT_LABELS = Object.freeze({
  CCCD_FRONT: 'Citizen ID — Front',
  CCCD_BACK: 'Citizen ID — Back',
  SELFIE: 'Identity selfie',
  CERTIFICATE: 'Professional certificate',
  CV: 'Curriculum vitae'
});

const getDocumentLabel = (type) => DOCUMENT_LABELS[type]
  || String(type || 'Document').replaceAll('_', ' ').toLowerCase().replace(/^./, (value) => value.toUpperCase());

export { getDocumentLabel };
