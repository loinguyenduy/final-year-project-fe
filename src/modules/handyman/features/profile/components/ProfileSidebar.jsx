import React from 'react';
import { FaAward, FaStar, FaShieldAlt, FaCheck } from 'react-icons/fa';

const ProfileSidebar = ({ account, profile }) => {
    const fullName = account?.full_name || 'N/A';
    const wallets = account?.wallets || [];
    const level = profile?.handyman_level || 'C1';
    const rating = account?.rating_summary;
    const bayesianScore = rating?.rating_status === 'AVAILABLE' ? rating.bayesian_rating : null;
    const totalJobs = account?.job_summary?.closed || 0;
    const isBondPaid = profile?.security_bond_status === 'PAID';
    const escrowBalance = wallets.find(w => w.wallet_type === 'HANDYMAN_ESCROW')?.available_balance || 0;

    const userInitials = fullName
        .split(' ')
        .map(n => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();

    const formatCurrency = (amount) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);

    return (
        <div className="profile-sidebar">
            <div className="avatar-wrapper">
                {userInitials}
                <div className="badge-icon"><FaAward /></div>
            </div>
            <h4>{fullName}</h4>
            <div className="subtitle">Official Partner</div>

            <div className="level-badge">
                <FaShieldAlt className="me-2" />Level {level}
            </div>

            <div className="rating-box">
                <div className="title">Reputation Score</div>
                {bayesianScore && <div className="stars"><FaStar /></div>}
                <div className="score">{bayesianScore || (rating?.rating_status === 'INSUFFICIENT_PRIOR_SAMPLE' ? 'Developing' : 'No reviews')}</div>
                <small>{rating?.review_count || 0} verified reviews</small>
            </div>

            <div className="stats-row">
                <div className="stat">
                    <strong>{totalJobs}</strong>
                    <span>Jobs Done</span>
                </div>
                <div className="stat">
                    <strong>—</strong>
                    <span>Success</span>
                </div>
                <div className="stat">
                    <strong>—</strong>
                    <span>Reviews</span>
                </div>
            </div>

            <div className={`bond-status ${isBondPaid ? 'active-bond' : ''}`}>
                <div className="label">Security Escrow Bond</div>
                <div className="amount-row">
                    <strong>{formatCurrency(escrowBalance)}</strong>
                    {isBondPaid ? (
                        <span className="badge-paid"><FaCheck className="me-1" />Bonded</span>
                    ) : (
                        <span className="badge-unpaid">Unbonded</span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfileSidebar;
