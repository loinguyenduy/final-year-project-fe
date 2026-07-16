import React from 'react';
import { FaCheck } from 'react-icons/fa';
import { FULL_JOB_PROGRESS_STAGES } from '../utils/jobProgress';
import './JobProgressStepper.scss';

const normalizeStages = (stages) => (
  Array.isArray(stages) && stages.length > 0 ? stages : FULL_JOB_PROGRESS_STAGES
);

const JobProgressStepper = ({
  ariaLabel = 'Job progress',
  compact = false,
  currentStatus,
  stages,
}) => {
  const normalizedStages = normalizeStages(stages);
  const currentIndex = normalizedStages.findIndex((stage) => stage.status === currentStatus);
  const hasKnownStatus = currentIndex >= 0;
  const safeCurrentIndex = hasKnownStatus ? currentIndex : -1;
  const currentStage = hasKnownStatus ? normalizedStages[currentIndex] : null;
  const previousStage = hasKnownStatus && currentIndex > 0
    ? normalizedStages[currentIndex - 1]
    : null;
  const nextStage = hasKnownStatus && currentIndex < normalizedStages.length - 1
    ? normalizedStages[currentIndex + 1]
    : null;

  return (
    <nav
      className={[
        'job-progress-stepper',
        compact ? 'job-progress-stepper--compact' : '',
      ].filter(Boolean).join(' ')}
      aria-label={ariaLabel}
    >
      <ol className="job-progress-stepper__list">
        {normalizedStages.map((stage, index) => {
          const state = hasKnownStatus && index < safeCurrentIndex
            ? 'completed'
            : hasKnownStatus && index === safeCurrentIndex
              ? 'current'
              : 'pending';

          return (
            <li
              className={`job-progress-stepper__item job-progress-stepper__item--${state}`}
              key={stage.status}
              aria-current={state === 'current' ? 'step' : undefined}
            >
              <div className="job-progress-stepper__track" aria-hidden="true">
                {index > 0 && (
                  <span
                    className={[
                      'job-progress-stepper__connector',
                      hasKnownStatus && index <= safeCurrentIndex
                        ? 'job-progress-stepper__connector--completed'
                        : '',
                    ].filter(Boolean).join(' ')}
                  />
                )}
                <span className="job-progress-stepper__circle">
                  {state === 'completed' ? <FaCheck /> : index + 1}
                </span>
              </div>
              <span className="job-progress-stepper__label">{stage.label}</span>
            </li>
          );
        })}
      </ol>

      <div className="job-progress-stepper__compact-summary">
        {hasKnownStatus ? (
          <>
            <div className="job-progress-stepper__compact-meta">
              <span>Stage {safeCurrentIndex + 1} of {normalizedStages.length}</span>
              <strong>{currentStage.label}</strong>
            </div>
            <div
              className="job-progress-stepper__compact-bar"
              role="progressbar"
              aria-label={`${currentStage.label}, stage ${safeCurrentIndex + 1} of ${normalizedStages.length}`}
              aria-valuemin="1"
              aria-valuemax={normalizedStages.length}
              aria-valuenow={safeCurrentIndex + 1}
            >
              <span
                style={{
                  width: `${((safeCurrentIndex + 1) / normalizedStages.length) * 100}%`,
                }}
              />
            </div>
            <div className="job-progress-stepper__compact-neighbours" aria-hidden="true">
              <span>{previousStage ? `Previous: ${previousStage.label}` : 'First stage'}</span>
              <span>{nextStage ? `Next: ${nextStage.label}` : 'Final stage'}</span>
            </div>
          </>
        ) : (
          <p>Job progress is unavailable for this status.</p>
        )}
      </div>
    </nav>
  );
};

export default JobProgressStepper;
export { FULL_JOB_PROGRESS_STAGES };
