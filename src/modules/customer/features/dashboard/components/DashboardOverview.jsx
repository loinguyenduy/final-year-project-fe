import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaRobot, FaBriefcase, FaWallet, FaStar, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import '../styles/DashboardOverview.scss';

const DashboardOverview = ({ account, metrics, recentJobs, notifications }) => {
    const navigate = useNavigate();
    
    // Extract real balance from user's account data
    const mainWallet = account?.wallets?.find(w => w.wallet_type === 'CUSTOMER_MAIN');
    const realBalance = mainWallet ? parseFloat(mainWallet.balance).toLocaleString('en-US') : '0';

    return (
        <div className="dashboard-overview">
            {/* 1. WELCOME BANNER */}
            <div className="welcome-banner">
                <div>
                    <span className="small text-white text-opacity-75">Good afternoon,</span>
                    <h3 className="fw-bold m-0 mt-1">{account?.full_name || 'Loading...'}</h3>
                    <div className="d-flex align-items-center gap-2 mt-2">
                        <div className="trust-stars">
                            <FaStar /><FaStar /><FaStar /><FaStar /><span className="text-white text-opacity-50"><FaStar /></span>
                        </div>
                        <span className="small fw-bold">{metrics.trustScoreStars} • Trust Score</span>
                    </div>
                </div>
                <div className="text-end">
                    <p className="small text-white text-opacity-75 mb-0">Completion Rate</p>
                    <h2 className="fw-bold display-6 m-0 font-monospace">{metrics.trustRate}</h2>
                    <small className="small text-white text-opacity-50">17/18 contracts</small>
                </div>
            </div>

            {/* 2. METRICS CARDS */}
            <div className="row g-3">
                <div className="col-md-3 col-6">
                    <div className="card metric-card">
                        <h2 className="text-dark">{metrics.activeJobs}</h2>
                        <small className="text-muted fw-bold mt-1">Active Jobs</small>
                    </div>
                </div>
                <div className="col-md-3 col-6">
                    <div className="card metric-card">
                        <h2 className="text-primary">{realBalance} ₫</h2>
                        <small className="text-muted fw-bold mt-1">Available Balance</small>
                    </div>
                </div>
                <div className="col-md-3 col-6">
                    <div className="card metric-card">
                        <h2 className="text-warning">{metrics.warrantyJobs}</h2>
                        <small className="text-muted fw-bold mt-1">In Warranty</small>
                    </div>
                </div>
                <div className="col-md-3 col-6">
                    <div className="card metric-card">
                        <h2 className="text-success">{metrics.completedJobs}</h2>
                        <small className="text-muted fw-bold mt-1">Total Completed</small>
                    </div>
                </div>
            </div>

            {/* 3. QUICK ACTIONS & RECENT JOBS */}
            <div className="row g-4">
                {/* Left Col: Quick Actions */}
                <div className="col-lg-4 col-12">
                    <div className="card border-0 shadow-sm p-4 h-100 bg-white rounded-3 quick-actions">
                        <h6 className="fw-bold text-dark mb-3">Quick Actions</h6>
                        <div className="d-flex flex-column">
                            <button onClick={() => navigate('/customer/ai-diagnosis')} className="action-btn">
                                <FaRobot className="text-primary" size={18} />
                                <div>
                                    <span className="title">AI Diagnosis & Post</span>
                                    <span className="desc">Chat AI — Create repair request</span>
                                </div>
                            </button>
                            <button onClick={() => navigate('/customer/my-jobs')} className="action-btn">
                                <FaBriefcase className="text-secondary" size={18} />
                                <div>
                                    <span className="title">View Jobs</span>
                                    <span className="desc">2 jobs pending action</span>
                                </div>
                            </button>
                            <button onClick={() => navigate('/customer/wallet')} className="action-btn">
                                <FaWallet className="text-success" size={18} />
                                <div>
                                    <span className="title">Top Up Wallet</span>
                                    <span className="desc">Prepare for escrow deposit</span>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Col: Recent Jobs */}
                <div className="col-lg-8 col-12">
                    <div className="card border-0 shadow-sm p-4 bg-white rounded-3 recent-jobs">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h6 className="fw-bold text-dark m-0">Recent Jobs</h6>
                            <button onClick={() => navigate('/customer/my-jobs')} className="btn btn-link text-decoration-none small p-0 fw-bold">View all &gt;</button>
                        </div>
                        <div className="d-flex flex-column">
                            {recentJobs.map((job, idx) => (
                                <div key={idx} className="job-item">
                                    <div className="d-flex align-items-center gap-3">
                                        <div className="p-2 bg-white rounded-3 border text-secondary"><FaBriefcase /></div>
                                        <div>
                                            <span className="fw-bold d-block text-dark small">{job.title}</span>
                                            <small className="text-muted" style={{ fontSize: '12px' }}>Pro: {job.handyman} • {job.time}</small>
                                        </div>
                                    </div>
                                    <div className="text-end">
                                        <span className="fw-bold text-dark d-block small">{job.price.toLocaleString('en-US')} ₫</span>
                                        <span className={`badge bg-${job.statusClass} bg-opacity-10 text-${job.statusClass} border border-${job.statusClass} border-opacity-25 mt-1`} style={{ fontSize: '11px' }}>
                                            {job.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* 4. NOTIFICATIONS */}
            <div className="card border-0 shadow-sm p-4 bg-white rounded-3">
                <h6 className="fw-bold text-dark mb-3">Latest Notifications</h6>
                <div className="d-flex flex-column gap-2">
                    {notifications.map((notif, idx) => (
                        <div key={idx} className="d-flex align-items-center gap-3 py-2 border-bottom border-light">
                            {notif.type === 'success' && <FaCheckCircle className="text-success flex-shrink-0" />}
                            {notif.type === 'info' && <FaRobot className="text-primary flex-shrink-0" />}
                            {notif.type === 'warning' && <FaExclamationTriangle className="text-warning flex-shrink-0" />}
                            <div className="flex-grow-1">
                                <span className="text-dark small d-block fw-medium">{notif.text}</span>
                                <small className="text-muted" style={{ fontSize: '11px' }}>{notif.time}</small>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 5. PROCESS STEPS */}
            <div className="card border-0 shadow-sm p-4 bg-white rounded-3 process-steps">
                <h6 className="fw-bold text-dark mb-4 text-center text-md-start">5-Stage Transaction Protection Process</h6>
                <div className="row text-center g-3 justify-content-center">
                    {[
                        { step: 1, title: 'Diagnose & Post', desc: 'AI assists in identifying issues', color: '#2563eb' },
                        { step: 2, title: 'Bidding & Deposit', desc: 'Pros bid, 10% escrow deposit', color: '#a855f7' },
                        { step: 3, title: 'En-route & Quote', desc: 'Pro arrives, confirms via OTP', color: '#ea580c' },
                        { step: 4, title: 'Execution & Escrow', desc: '3-stage evidence upload', color: '#0d9488' },
                        { step: 5, title: 'Warranty & Settle', desc: '80/20 automatic disbursement', color: '#16a34a' },
                    ].map((st, i) => (
                        <div key={i} className="col-md col-sm-4 col-6 px-2 step-item">
                            <div className="circle" style={{ backgroundColor: st.color }}>
                                {st.step}
                            </div>
                            <span className="fw-bold d-block text-dark mb-1" style={{ fontSize: '13px' }}>{st.title}</span>
                            <span className="text-muted d-block" style={{ fontSize: '11px' }}>{st.desc}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DashboardOverview;