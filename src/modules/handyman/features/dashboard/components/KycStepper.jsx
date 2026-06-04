import React from 'react';
import { FaCheck, FaExclamation, FaLock } from 'react-icons/fa';

const KycStepper = ({ currentLevel }) => {
    // Helper function xác định trạng thái của từng bước
    const getStepStatus = (stepLevel) => {
        const weights = { 'C0': 0, 'C1': 1, 'C2': 2, 'C3': 3 };
        const currentWeight = weights[currentLevel];
        const targetWeight = weights[stepLevel];

        if (currentWeight > targetWeight) return 'completed';
        if (currentWeight === targetWeight) return 'active';
        return 'locked';
    };

    const steps = [
        { level: 'C1', title: 'Email Verified', status: getStepStatus('C1') },
        { level: 'C2', title: 'KYC Verified', status: getStepStatus('C2') },
        { level: 'C3', title: 'Bonded Partner', status: getStepStatus('C3') }
    ];

    return (
        <div className="stepper-container">
            <div className="stepper-wrapper">
                {steps.map((step, index) => (
                    <div key={index} className="step-item">
                        <div className={`step-circle ${step.status}`}>
                            {step.status === 'completed' && <FaCheck />}
                            {step.status === 'active' && <FaExclamation />}
                            {step.status === 'locked' && <FaLock size={16} />}
                        </div>
                        <div className={`step-label ${step.status}-label`}>
                            <div>{step.level}</div>
                            <small>{step.title}</small>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default KycStepper;