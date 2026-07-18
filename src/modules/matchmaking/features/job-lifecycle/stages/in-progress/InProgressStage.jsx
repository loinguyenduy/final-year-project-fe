import React from 'react';
import { FaTools } from 'react-icons/fa';
import ContractReadOnlyView from '../../components/ContractReadOnlyView';
import { formatDateTime } from '../../utils/jobLifecycleUi';

const InProgressStage = ({ contractState, inProgressAt }) => (
  <section className="lifecycle-stage lifecycle-stage--inspection" aria-labelledby="in-progress-title">
    <div className="lifecycle-stage__heading">
      <span className="lifecycle-stage__icon lifecycle-stage__icon--success" aria-hidden="true">
        <FaTools />
      </span>
      <div>
        <span className="lifecycle-stage__eyebrow">In progress</span>
        <h2 id="in-progress-title">The service Contract is active</h2>
        <p>
          The agreed Quote is secured in escrow. This workspace currently provides
          the immutable Contract and participant Chat.
        </p>
      </div>
    </div>

    <dl className="lifecycle-request-facts lifecycle-request-facts--single">
      <div><dt>In progress since</dt><dd>{formatDateTime(inProgressAt)}</dd></div>
    </dl>

    {contractState.contractLoading && <p>Loading active Contract...</p>}
    {contractState.contractError && (
      <div className="lifecycle-notice lifecycle-notice--danger">{contractState.contractError}</div>
    )}
    <ContractReadOnlyView contract={contractState.contract} />
  </section>
);

export default InProgressStage;
