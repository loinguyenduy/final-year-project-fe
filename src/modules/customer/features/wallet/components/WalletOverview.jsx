import React from 'react';
import { FaWallet, FaLock, FaHistory } from 'react-icons/fa';

const WalletOverview = () => {
    return (
        <div className="wallet-overview mb-4">
            <div className="mb-4">
                <h3 className="fw-bold text-dark m-0">Digital Wallet</h3>
                <p className="text-muted">Manage balance, deposit/withdraw and track Escrow transactions</p>
            </div>

            <div className="row g-4">
                {/* Available Balance Card */}
                <div className="col-md-4">
                    <div className="overview-card primary-card">
                        <div className="card-header-icon">
                            <FaWallet />
                            <span className="ms-2">Available Balance</span>
                        </div>
                        <h2 className="balance-amount mt-3 mb-2">2,400,000₫</h2>
                        <span className="card-subtitle">Ready to use</span>
                    </div>
                </div>

                {/* Escrow Card */}
                <div className="col-md-4">
                    <div className="overview-card warning-card">
                        <div className="card-header-icon text-warning">
                            <FaLock />
                            <span className="ms-2 text-secondary">In Escrow</span>
                        </div>
                        <h2 className="balance-amount mt-3 mb-2 text-dark">850,000₫</h2>
                        <span className="card-subtitle text-warning">JOB-0041 in progress</span>
                    </div>
                </div>

                {/* Total Paid Card */}
                <div className="col-md-4">
                    <div className="overview-card light-card">
                        <div className="card-header-icon text-secondary">
                            <FaHistory />
                            <span className="ms-2">Total Paid</span>
                        </div>
                        <h2 className="balance-amount mt-3 mb-2 text-dark">5,170,000₫</h2>
                        <span className="card-subtitle text-secondary">18 transactions</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WalletOverview;
