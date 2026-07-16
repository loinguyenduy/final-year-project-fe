import React from 'react';
import LocationActionModal from './LocationActionModal';

const ArrivalRequestModal = (props) => (
  <LocationActionModal
    {...props}
    actionLabel="Send arrival request"
    locatingLabel="Checking location at arrival…"
    title="Have you arrived?"
    titleId="arrival-request-title"
    description="A fresh location will be recorded and the customer will be asked to confirm your arrival."
  />
);

export default ArrivalRequestModal;
