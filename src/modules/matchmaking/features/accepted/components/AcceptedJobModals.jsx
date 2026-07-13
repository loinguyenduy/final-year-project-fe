import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { FaTimes } from 'react-icons/fa';
import {
    cancelAcceptedJobByCustomerApi,
    cancelAcceptedJobByHandymanApi,
    startMovingApi
} from '../../../api/acceptedJobApi';

const REASON_CODES_CUSTOMER_REOPEN = [
    { code: 'SELECTED_WRONG_HANDYMAN', label: 'Selected the wrong handyman' },
    { code: 'HANDYMAN_NOT_SUITABLE', label: 'Handyman is not suitable' },
    { code: 'SCHEDULE_CONFLICT', label: 'Schedule conflict' },
    { code: 'CANNOT_CONTACT_HANDYMAN', label: 'Cannot contact the handyman' },
    { code: 'JOB_INFORMATION_CHANGED', label: 'Job information changed' },
    { code: 'OTHER', label: 'Other' },
];

const REASON_CODES_CUSTOMER_CANCEL = [
    { code: 'NO_LONGER_NEEDED', label: 'Service is no longer needed' },
    { code: 'SCHEDULE_CONFLICT', label: 'Schedule conflict' },
    { code: 'JOB_INFORMATION_CHANGED', label: 'Job information changed' },
    { code: 'OTHER', label: 'Other' },
];

const REASON_CODES_HANDYMAN_CANCEL = [
    { code: 'SCHEDULE_CONFLICT', label: 'Schedule conflict' },
    { code: 'OUTSIDE_EXPERTISE', label: 'Job is outside my expertise' },
    { code: 'MISSING_REQUIRED_TOOLS', label: 'Missing required tools' },
    { code: 'CANNOT_REACH_LOCATION', label: 'Cannot reach the location' },
    { code: 'CANNOT_CONTACT_CUSTOMER', label: 'Cannot contact the customer' },
    { code: 'PERSONAL_EMERGENCY', label: 'Personal emergency' },
    { code: 'JOB_INFORMATION_INACCURATE', label: 'Job information inaccurate' },
    { code: 'OTHER', label: 'Other' },
];

export const CustomerCancellationModal = ({ show, onHide, jobId, actionType, onSuccess }) => {
    if (!show) return null;

    const [reasonCode, setReasonCode] = useState('');
    const [reasonText, setReasonText] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const isReopen = actionType === 'REOPEN_BIDDING';
    const title = isReopen ? 'Find Another Handyman?' : 'Cancel Job?';
    const description = isReopen 
        ? 'Your current selection will be cancelled, the deposit will be 100% refunded to your wallet, and the job will return to the bidding stage.'
        : 'The job will be closed and the deposit will be 100% refunded to your wallet.';
    
    const reasonCodes = isReopen ? REASON_CODES_CUSTOMER_REOPEN : REASON_CODES_CUSTOMER_CANCEL;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!reasonCode) {
            toast.warning('Please select a reason.');
            return;
        }
        if (reasonCode === 'OTHER' && !reasonText.trim()) {
            toast.warning('Please provide additional details.');
            return;
        }

        setSubmitting(true);
        try {
            const res = await cancelAcceptedJobByCustomerApi(jobId, {
                action: actionType,
                reason_code: reasonCode,
                reason_text: reasonText.trim() || undefined
            });

            if (res && res.EC === 0) {
                toast.success(isReopen ? 'Job is back to bidding stage.' : 'Job cancelled successfully.');
                onSuccess(actionType);
            } else {
                toast.error(res?.EM || 'Failed to process request.');
            }
        } catch (error) {
            toast.error('An error occurred while processing your request.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="customer-modal-overlay" onClick={() => !submitting && onHide()}>
            <div className="customer-modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{title}</h3>
                    <button className="close-btn" onClick={onHide} disabled={submitting}>
                        <FaTimes />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <p className="text-muted mb-4">{description}</p>
                        
                        <div className="form-group">
                            <label>Reason</label>
                            <select 
                                className="form-select"
                                value={reasonCode} 
                                onChange={(e) => setReasonCode(e.target.value)}
                                required
                                disabled={submitting}
                            >
                                <option value="">Select a reason...</option>
                                {reasonCodes.map(r => (
                                    <option key={r.code} value={r.code}>{r.label}</option>
                                ))}
                            </select>
                        </div>

                        {reasonCode === 'OTHER' && (
                            <div className="form-group">
                                <label>Additional Details <span className="text-danger">*</span></label>
                                <textarea
                                    className="form-control"
                                    rows={3}
                                    value={reasonText}
                                    onChange={(e) => setReasonText(e.target.value)}
                                    required
                                    disabled={submitting}
                                    placeholder="Please describe the reason..."
                                />
                            </div>
                        )}
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-outline-secondary" onClick={onHide} disabled={submitting}>
                            Back
                        </button>
                        <button 
                            className={`btn ${isReopen ? "btn-primary" : "btn-danger"}`} 
                            type="submit" 
                            disabled={submitting || !reasonCode || (reasonCode === 'OTHER' && !reasonText.trim())}
                        >
                            {submitting && <span className="spinner-border spinner-border-sm me-2" />}
                            {isReopen ? 'Confirm Find Another' : 'Confirm Cancel Job'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export const HandymanCancellationModal = ({ show, onHide, jobId, onSuccess }) => {
    if (!show) return null;

    const [reasonCode, setReasonCode] = useState('');
    const [reasonText, setReasonText] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!reasonCode) {
            toast.warning('Please select a reason.');
            return;
        }
        if (reasonCode === 'OTHER' && !reasonText.trim()) {
            toast.warning('Please provide additional details.');
            return;
        }

        setSubmitting(true);
        try {
            const res = await cancelAcceptedJobByHandymanApi(jobId, {
                reason_code: reasonCode,
                reason_text: reasonText.trim() || undefined
            });

            if (res && res.EC === 0) {
                toast.success('You have successfully withdrawn from this job.');
                onSuccess();
            } else {
                toast.error(res?.EM || 'Failed to process request.');
            }
        } catch (error) {
            toast.error('An error occurred while processing your request.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="customer-modal-overlay" onClick={() => !submitting && onHide()}>
            <div className="customer-modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Cannot continue this job?</h3>
                    <button className="close-btn" onClick={onHide} disabled={submitting}>
                        <FaTimes />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <p className="text-muted mb-4">
                            The job will return to the bidding stage. The customer will be fully refunded their deposit, and you will not be able to bid on this job again.
                        </p>
                        
                        <div className="form-group">
                            <label>Reason</label>
                            <select 
                                className="form-select"
                                value={reasonCode} 
                                onChange={(e) => setReasonCode(e.target.value)}
                                required
                                disabled={submitting}
                            >
                                <option value="">Select a reason...</option>
                                {REASON_CODES_HANDYMAN_CANCEL.map(r => (
                                    <option key={r.code} value={r.code}>{r.label}</option>
                                ))}
                            </select>
                        </div>

                        {reasonCode === 'OTHER' && (
                            <div className="form-group">
                                <label>Additional Details <span className="text-danger">*</span></label>
                                <textarea
                                    className="form-control"
                                    rows={3}
                                    value={reasonText}
                                    onChange={(e) => setReasonText(e.target.value)}
                                    required
                                    disabled={submitting}
                                    placeholder="Please describe the reason..."
                                />
                            </div>
                        )}
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-outline-secondary" onClick={onHide} disabled={submitting}>
                            Back
                        </button>
                        <button 
                            className="btn btn-danger" 
                            type="submit" 
                            disabled={submitting || !reasonCode || (reasonCode === 'OTHER' && !reasonText.trim())}
                        >
                            {submitting && <span className="spinner-border spinner-border-sm me-2" />}
                            Confirm Withdraw
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export const StartMovingModal = ({ show, onHide, jobId, onSuccess }) => {
    if (!show) return null;

    const [submitting, setSubmitting] = useState(false);
    const [gettingLocation, setGettingLocation] = useState(false);

    const handleConfirm = () => {
        setGettingLocation(true);
        setSubmitting(true);
        
        let apiCalled = false;

        const callApi = async (payload) => {
            if (apiCalled) return;
            apiCalled = true;
            
            try {
                const res = await startMovingApi(jobId, payload);
                if (res && res.EC === 0) {
                    toast.success('Successfully started moving! Drive safely.');
                    onSuccess();
                } else {
                    toast.error(res?.EM || 'Failed to start moving.');
                }
            } catch (error) {
                toast.error('An error occurred while updating status.');
            } finally {
                setSubmitting(false);
                setGettingLocation(false);
            }
        };

        if (navigator.geolocation) {
            // Setup timeout for GPS
            const timeoutId = setTimeout(() => {
                console.log("GPS timeout reached. Proceeding without coordinates.");
                callApi({});
            }, 5000);

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    clearTimeout(timeoutId);
                    callApi({
                        gps_lat: position.coords.latitude,
                        gps_long: position.coords.longitude
                    });
                },
                (error) => {
                    clearTimeout(timeoutId);
                    console.warn("Geolocation failed or denied:", error);
                    // Fallback to empty body
                    callApi({});
                },
                { enableHighAccuracy: false, timeout: 4500, maximumAge: 0 }
            );
        } else {
            callApi({});
        }
    };

    return (
        <div className="customer-modal-overlay" onClick={() => !submitting && onHide()}>
            <div className="customer-modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Start Moving?</h3>
                    <button className="close-btn" onClick={onHide} disabled={submitting}>
                        <FaTimes />
                    </button>
                </div>
                <div className="modal-body">
                    <p className="mb-0 text-muted">
                        Only confirm when you are ready and have actually started heading to the customer's location. The customer will be notified that you are "En Route".
                    </p>
                </div>
                <div className="modal-footer">
                    <button className="btn btn-outline-secondary" onClick={onHide} disabled={submitting}>
                        Cancel
                    </button>
                    <button className="btn btn-primary" onClick={handleConfirm} disabled={submitting}>
                        {submitting && <span className="spinner-border spinner-border-sm me-2" />}
                        {gettingLocation ? 'Getting location...' : 'Start Moving'}
                    </button>
                </div>
            </div>
        </div>
    );
};
