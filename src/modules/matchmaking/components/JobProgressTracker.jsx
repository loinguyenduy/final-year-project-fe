import React from 'react';
import { FaCheck } from 'react-icons/fa';
import './JobProgressTracker.scss';

const STEPS = [
    { status: 'POSTED', label: 'Posted' },
    { status: 'BIDDING', label: 'Bidding' },
    { status: 'ACCEPTED', label: 'Accepted' },
    { status: 'EN_ROUTE', label: 'En Route' },
    { status: 'ARRIVED', label: 'Arrived' },
    { status: 'IN_PROGRESS', label: 'In Progress' },
    { status: 'CLOSED', label: 'Completed' },
    { status: 'WARRANTY', label: 'Warranty' }
];

const JobProgressTracker = ({ currentStatus }) => {
    const currentStepIdx = STEPS.findIndex(s => s.status === currentStatus);

    return (
        <div className="job-progress-tracker-container">
            <div className="steps-container d-none d-md-flex">
                {STEPS.map((step, idx) => {
                    let stepClass = '';
                    if (idx < currentStepIdx) stepClass = 'completed';
                    else if (idx === currentStepIdx) stepClass = 'active';
                    return (
                        <div key={step.status} className={`step-item ${stepClass}`}>
                            <div className="step-circle">
                                {idx < currentStepIdx ? <FaCheck size={12} /> : idx + 1}
                            </div>
                            <span className="step-label">{step.label}</span>
                        </div>
                    );
                })}
            </div>
            {/* Mobile Progress (Simplified) */}
            <div className="d-flex d-md-none justify-content-center mt-3 small fw-medium text-primary bg-primary bg-opacity-10 py-2 rounded w-100">
                Stage {currentStepIdx !== -1 ? currentStepIdx + 1 : 1}/{STEPS.length} : {currentStepIdx !== -1 ? STEPS[currentStepIdx].label : currentStatus}
            </div>
        </div>
    );
};

export default JobProgressTracker;
export { STEPS };
