import React from 'react';
import { FaAward, FaStar, FaShieldAlt, FaCheck } from 'react-icons/fa';

const ProfileSidebar = ({ account, profile }) => {
    const fullName = account?.full_name || 'N/A';
    const wallets = account?.wallets || [];
    const level = profile?.handyman_level || 'C1';
    const bayesianScore = parseFloat(profile?.bayesian_score || 5.0).toFixed(1);
    const totalJobs = profile?.total_jobs_completed || 0;
    const isBondPaid = profile?.security_bond_status === 'PAID';
    const escrowBalance = wallets.find(w => w.wallet_type === 'HANDYMAN_ESCROW')?.balance || 0;

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
                <div className="stars">
                    <FaStar /><FaStar /><FaStar /><FaStar /><FaStar className="opacity-50" />
                </div>
                <div className="score">{bayesianScore}</div>
                <small>Bayesian Algorithm</small>
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
