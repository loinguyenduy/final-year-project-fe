import React, { useEffect, useState } from 'react';
import { FaTimes, FaStar, FaBalanceScale, FaClock } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { compareBidsApi } from '../../../services/jobService';
import '../styles/CustomerJobsComponents.scss';

const CompareBidsModal = ({ jobId, selectedBidIds, onClose, onAcceptBid }) => {
    const [loading, setLoading] = useState(true);
    const [comparisonData, setComparisonData] = useState([]);

    useEffect(() => {
        const fetchComparison = async () => {
            setLoading(true);
            try {
                const res = await compareBidsApi({ job_id: jobId, bid_ids: selectedBidIds });
                if (res && res.EC === 0) {
                    setComparisonData(res.DT || []);
                } else {
                    toast.error(res.EM || "Failed to load comparison data.");
                    onClose();
                }
            } catch {
                toast.error("Error fetching comparison data.");
                onClose();
            } finally {
                setLoading(false);
            }
        };

        if (jobId && selectedBidIds?.length > 0) {
            fetchComparison();
        }
    }, [jobId, selectedBidIds, onClose]);

    const formatCurrency = (val) => {
        if (!val) return '';
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
    };

    const formatEta = (dateStr) => {
        if (!dateStr) return 'TBD';
        const d = new Date(dateStr);
        const day = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const hour = d.getHours().toString().padStart(2, '0');
        const min = d.getMinutes().toString().padStart(2, '0');
        return `${day}/${month} ${hour}:${min}`;
    };

    const formatDuration = (hours) => {
        if (!hours) return 'TBD';
        const value = Number(hours);
        if (Number.isNaN(value)) return 'TBD';
        return `${value} ${value === 1 ? 'hour' : 'hours'}`;
    };

    if (!jobId || !selectedBidIds) return null;

    return (
        <div className="customer-modal-overlay" onClick={onClose}>
            <div className="customer-modal-content compare-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="modal-heading">
                        <span className="modal-kicker"><FaBalanceScale /> Bid comparison</span>
                        <h3>Choose with confidence</h3>
                        <p>Compare price, reliability, experience, verification, and timing before hiring.</p>
                    </div>
                    <button className="close-btn" onClick={onClose}>
                        <FaTimes />
                    </button>
                </div>
                
                <div className="modal-body">
                    {loading ? (
                        <div className="text-center p-5">
                            <div className="spinner-border text-primary" />
                            <p className="mt-3 text-muted">Analyzing bid data...</p>
                        </div>
                    ) : (
                        <div className="compare-table-container">
                            <table className="compare-table">
                                <thead>
                                    <tr>
                                        <th className="criteria-label">Criteria</th>
                                        {comparisonData.map((bid) => (
                                            <th key={bid.bid_id} className={`handyman-col ${bid.isBestChoice ? 'best-choice-col' : ''}`}>
                                                <div className="compare-avatar-wrapper">
                                                    {bid.handyman?.avatar_url ? (
                                                        <img src={bid.handyman.avatar_url} alt="Avatar" className={`compare-avatar ${bid.isBestChoice ? 'best' : ''}`} />
                                                    ) : (
                                                        <div className={`compare-avatar-placeholder ${bid.isBestChoice ? 'best' : ''}`}>
                                                            {bid.handyman?.full_name?.charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                    <div className="compare-name">{bid.handyman?.full_name}</div>
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="criteria-label">Recommendation</td>
                                        {comparisonData.map((bid) => (
                                            <td key={`eval-${bid.bid_id}`} className={bid.isBestChoice ? 'best-choice-col' : ''}>
                                                {bid.isBestChoice ? (
                                                    <span className="best-choice-badge">
                                                        <FaStar /> Best overall fit
                                                    </span>
                                                ) : (
                                                    <span className="text-muted">-</span>
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                    <tr>
                                        <td className="criteria-label">Match score</td>
                                        {comparisonData.map((bid) => (
                                            <td key={`match-${bid.bid_id}`} className={bid.isBestChoice ? 'best-choice-col' : ''}>
                                                <div className="compare-match">
                                                    <div className="match-bar-bg">
                                                        <div 
                                                            className="match-bar-fill" 
                                                            style={{ 
                                                                width: `${Math.min(bid.match_score, 100)}%`,
                                                                backgroundColor: bid.isBestChoice ? '#22c55e' : '#3b82f6'
                                                            }} 
                                                        />
                                                    </div>
                                                    <span className="match-text" style={{ color: bid.isBestChoice ? '#22c55e' : '#3b82f6' }}>
                                                        {bid.match_score}%
                                                    </span>
                                                </div>
                                            </td>
                                        ))}
                                    </tr>
                       
                                    <tr>
                                        <td className="criteria-label">Quoted price</td>
                                        {comparisonData.map((bid) => (
                                            <td key={`price-${bid.bid_id}`} className={bid.isBestChoice ? 'best-choice-col' : ''}>
                                                <div className="compare-price">{formatCurrency(bid.proposed_price)}</div>
                                            </td>
                                        ))}
                                    </tr>
                                    <tr>
                                        <td className="criteria-label">Reliability score</td>
                                        {comparisonData.map((bid) => (
                                            <td key={`score-${bid.bid_id}`} className={bid.isBestChoice ? 'best-choice-col' : ''}>
                                                <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>
                                                    <FaStar size={13} style={{ marginBottom: '3px' }}/> {bid.handyman?.rating_summary?.bayesian_rating || 'Developing'}
                                                </span>
                                            </td>
                                        ))}
                                    </tr>
                                    <tr>
                                        <td className="criteria-label">Total experience</td>
                                        {comparisonData.map((bid) => (
                                            <td key={`exp-${bid.bid_id}`} className={bid.isBestChoice ? 'best-choice-col' : ''}>
                                                <strong>{bid.handyman?.total_jobs_completed || 0}</strong> jobs
                                            </td>
                                        ))}
                                    </tr>
                                    <tr>
                                        <td className="criteria-label">Category experience</td>
                                        {comparisonData.map((bid) => (
                                            <td key={`spec-${bid.bid_id}`} className={bid.isBestChoice ? 'best-choice-col' : ''}>
                                                <strong>{bid.completed_same_service_jobs || 0}</strong> similar jobs
                                            </td>
                                        ))}
                                    </tr>
                                    <tr>
                                        <td className="criteria-label">Verification</td>
                                        {comparisonData.map((bid) => (
                                            <td key={`kyc-${bid.bid_id}`} className={bid.isBestChoice ? 'best-choice-col' : ''}>
                                                <span className={`compare-kyc level-${bid.handyman?.handyman_level?.toLowerCase() || 'c0'}`}>
                                                    {bid.handyman?.kyc_status || 'UNVERIFIED'} / {bid.handyman?.handyman_level || 'C0'}
                                                </span>
                                            </td>
                                        ))}
                                    </tr>
                                    <tr>
                                        <td className="criteria-label"><FaClock className="criteria-icon" /> Estimated arrival</td>
                                        {comparisonData.map((bid) => (
                                            <td key={`eta-${bid.bid_id}`} className={bid.isBestChoice ? 'best-choice-col' : ''}>
                                                {formatEta(bid.eta)}
                                            </td>
                                        ))}
                                    </tr>
                                    <tr>
                                        <td className="criteria-label"><FaClock className="criteria-icon" /> Estimated completion</td>
                                        {comparisonData.map((bid) => (
                                            <td key={`duration-${bid.bid_id}`} className={bid.isBestChoice ? 'best-choice-col' : ''}>
                                                {formatDuration(bid.estimated_duration_hours)}
                                            </td>
                                        ))}
                                    </tr>
                                    <tr>
                                        <td className="criteria-label" style={{ borderBottom: 'none' }}></td>
                                        {comparisonData.map((bid) => (
                                            <td key={`act-${bid.bid_id}`} className={bid.isBestChoice ? 'best-choice-col' : ''} style={{ borderBottom: 'none' }}>
                                                <button 
                                                    className={`hire-btn ${bid.isBestChoice ? 'best' : ''}`}
                                                    onClick={() => onAcceptBid(bid.bid_id)}
                                                >
                                                    {bid.isBestChoice ? <><FaStar style={{ marginBottom: '2px' }}/> Hire this handyman</> : 'Hire this handyman'}
                                                </button>
                                            </td>
                                        ))}
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CompareBidsModal;
