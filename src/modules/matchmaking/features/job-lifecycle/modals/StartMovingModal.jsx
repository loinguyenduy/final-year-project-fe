import React from 'react';
import LocationActionModal from './LocationActionModal';

const StartMovingModal = (props) => (
  <LocationActionModal
    {...props}
    actionLabel="Start moving"
    locatingLabel="Getting current location…"
    title="Start moving?"
    titleId="start-moving-title"
    description="Confirm only when you are ready and have started travelling to the customer’s service location."
  />
);

export default StartMovingModal;
