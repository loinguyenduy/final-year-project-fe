import React, { useEffect, useState, useRef } from 'react';
import { FaClock, FaCheckCircle, FaExclamationTriangle, FaExternalLinkAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { getDepositSummaryApi, acceptBidWithWalletDepositApi } from '../../../services/jobService';
import ParticipantModal from '../../../../identity/components/ParticipantModal';

const HireConfirmModal = ({ jobId, bidId, handymanName, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [summary, setSummary] = useState(null);
    const [timeLeft, setTimeLeft] = useState(900); // 15 minutes in seconds
    const timerRef = useRef(null);

    // Fetch deposit summary on mount
    useEffect(() => {
        const fetchSummary = async () => {
            setLoading(true);
            try {
                const res = await getDepositSummaryApi(jobId, bidId);
                if (res && res.EC === 0) {
                    setSummary(res.DT);
                } else {
                    toast.error(res.EM || "Failed to retrieve deposit details.");
                    onClose();
                }
            } catch {
                toast.error("Error loading deposit summary.");
                onClose();
            } finally {
                setLoading(false);
            }
        };

        if (jobId && bidId) {
            fetchSummary();
        }
    }, [jobId, bidId, onClose]);

    // Countdown Timer logic
    useEffect(() => {
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    toast.warn("Payment session expired. The job has been reopened for you to select a handyman.", {
                        position: "top-center",
                        autoClose: 6000
                    });
                    onClose();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [onClose]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const formatCurrency = (val) => {
        if (!val) return '0 VND';
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
    };

    const handleConfirmPayment = async () => {
        setSubmitting(true);
        try {
            const res = await acceptBidWithWalletDepositApi(jobId, bidId);
            if (res && res.EC === 0) {
                toast.success("Deposit paid successfully! Job has been accepted.");
                if (onSuccess) {
                    await onSuccess();
                }
                onClose();
            } else {
                toast.error(res.EM || "Payment failed. Please try again.");
            }
        } catch {
            toast.error("An error occurred during payment.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <ParticipantModal className="hire-confirm-modal" title="Hire confirmation and deposit" description="Calculating the canonical deposit summary." onClose={onClose} size="deposit">
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status" />
                    <p className="mt-3 text-muted">Calculating deposit summary...</p>
                </div>
            </ParticipantModal>
        );
    }

    if (!summary) return null;

    const canPay = summary.can_pay_from_wallet;
    const missingAmount = summary.missing_amount;

    return (
        <ParticipantModal
            title={canPay ? "Secure selection deposit" : "Insufficient Wallet balance"}
            description={`Select ${handymanName || 'this handyman'} by placing the required deposit into protected escrow.`}
            onClose={onClose}
            closeDisabled={submitting}
            size="deposit"
            className="hire-confirm-modal"
        >
                <div className="modal-body">
                    {/* Timer Banner */}
                    <div className="timer-banner-wrapper mb-4">
                        <div className="timer-banner">
                            <FaClock className="timer-icon pulse-animation" />
                            <div className="timer-text">
                                <span className="timer-label">Remaining Reservation Time:</span>
                                <span className="timer-countdown">{formatTime(timeLeft)}</span>
                            </div>
                        </div>
                    </div>

                    {canPay ? (
                        /* Screen 1: Sufficient Balance - Confirm Selection */
                        <div className="confirm-payment-section">
                            <div className="info-alert mb-4">
                                <FaCheckCircle className="alert-icon text-success" />
                                <div className="alert-details">
                                    <strong>You are selecting Handyman:</strong>
                                    <span className="handyman-highlight ms-1">{handymanName}</span>
                                </div>
                            </div>

                            <div className="summary-payment-card mb-4">
                                <h5 className="summary-card-title mb-3">Billing Summary</h5>
                                <div className="summary-row">
                                    <span className="summary-label">Quoted Price:</span>
                                    <span className="summary-value font-medium">{formatCurrency(summary.proposed_price)}</span>
                                </div>
                                <div className="summary-row highlight-row">
                                    <span className="summary-label">Deposit Amount ({summary.deposit_rate_percent}%):</span>
                                    <span className="summary-value text-primary font-bold">{formatCurrency(summary.deposit_amount)}</span>
                                </div>
                                <hr className="summary-divider" />
                                <div className="summary-row">
                                    <span className="summary-label">Your Wallet Balance:</span>
                                    <span className="summary-value text-success">{formatCurrency(summary.wallet_balance)}</span>
                                </div>
                                <div className="summary-row">
                                    <span className="summary-label text-muted">Balance After Payment:</span>
                                    <span className="summary-value text-muted">{formatCurrency(summary.wallet_balance - summary.deposit_amount)}</span>
                                </div>
                            </div>

                            <p className="payment-disclaimer text-muted small mb-4">
                                * The deposit will be locked safely in the system's escrow wallet and will only be released to the handyman upon successful job completion.
                            </p>

                            <div className="modal-actions-row">
                                <button 
                                    className="btn btn-outline-secondary cancel-btn"
                                    onClick={onClose}
                                    disabled={submitting}
                                >
                                    Cancel Selection
                                </button>
                                <button 
                                    className="btn btn-primary pay-btn d-flex align-items-center justify-content-center"
                                    onClick={handleConfirmPayment}
                                    disabled={submitting}
                                >
                                    {submitting ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" />
                                            Processing...
                                        </>
                                    ) : (
                                        "Pay Deposit"
                                    )}
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* Screen 2: Insufficient Balance - Prompt Top Up */
                        <div className="insufficient-balance-section">
                            <div className="info-alert warning-alert mb-4">
                                <FaExclamationTriangle className="alert-icon text-warning animate-bounce" />
                                <div className="alert-details">
                                    <strong>Additional funds required:</strong>
                                    <span className="ms-1">You do not have enough balance to complete the selection.</span>
                                </div>
                            </div>

                            <div className="summary-payment-card error-themed mb-4">
                                <h5 className="summary-card-title mb-3">Balance Shortage details</h5>
                                <div className="summary-row">
                                    <span className="summary-label">Handyman Quoted Price:</span>
                                    <span className="summary-value">{formatCurrency(summary.proposed_price)}</span>
                                </div>
                                <div className="summary-row">
                                    <span className="summary-label">Deposit Amount ({summary.deposit_rate_percent}%):</span>
                                    <span className="summary-value font-medium">{formatCurrency(summary.deposit_amount)}</span>
                                </div>
                                <div className="summary-row">
                                    <span className="summary-label">Your Wallet Balance:</span>
                                    <span className="summary-value text-danger font-medium">{formatCurrency(summary.wallet_balance)}</span>
                                </div>
                                <hr className="summary-divider" />
                                <div className="summary-row shortage-row">
                                    <span className="summary-label font-bold text-dark">Amount Needed:</span>
                                    <span className="summary-value text-danger font-bold">{formatCurrency(missingAmount)}</span>
                                </div>
                            </div>

                            <p className="payment-suggestion text-muted small mb-4">
                                Click <strong>Top-up Wallet</strong> to open the top-up page in a new tab and add at least {formatCurrency(missingAmount)}. The selection countdown will remain active. Once finished, return here to complete your selection.
                            </p>

                            <div className="modal-actions-row">
                                <button 
                                    className="btn btn-outline-secondary cancel-btn"
                                    onClick={onClose}
                                >
                                    Back to Select Handyman
                                </button>
                                <button 
                                    className="btn btn-primary topup-btn d-flex align-items-center justify-content-center"
                                    onClick={() => window.open(`/customer/wallet?amount=${missingAmount}`, '_blank')}
                                >
                                    Top-up Wallet <FaExternalLinkAlt className="ms-2" size={11} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
        </ParticipantModal>
    );
};

export default HireConfirmModal;
