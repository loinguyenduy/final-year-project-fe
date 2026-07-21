import React from 'react';
import { FaArrowDown, FaArrowUp, FaWallet } from 'react-icons/fa';

const WalletOverview = ({ wallets = [] }) => {
    const mainWallet = wallets.find((wallet) => wallet.wallet_type === 'CUSTOMER_MAIN');
    const formatCurrency = (value) => new Intl.NumberFormat('vi-VN', {
        style: 'currency', currency: 'VND',
    }).format(Number(value || 0));

    return (
        <div className="wallet-overview mb-4">
            <div className="mb-4">
                <h3 className="fw-bold text-dark m-0">Digital Wallet</h3>
                <p className="text-muted">Manage balance, deposit and canonical transaction history</p>
            </div>
            <div className="row g-4">
                <div className="col-md-4">
                    <div className="overview-card primary-card">
                        <div className="card-header-icon"><FaWallet /><span className="ms-2">Available Balance</span></div>
                        <h2 className="balance-amount mt-3 mb-2">{formatCurrency(mainWallet?.available_balance)}</h2>
                        <span className="card-subtitle">Ready to use</span>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="overview-card warning-card">
                        <div className="card-header-icon text-warning"><FaArrowDown /><span className="ms-2 text-secondary">Successful Incoming</span></div>
                        <h2 className="balance-amount mt-3 mb-2 text-dark">{formatCurrency(mainWallet?.total_incoming)}</h2>
                        <span className="card-subtitle text-warning">Canonical ledger total</span>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="overview-card light-card">
                        <div className="card-header-icon text-secondary"><FaArrowUp /><span className="ms-2">Successful Outgoing</span></div>
                        <h2 className="balance-amount mt-3 mb-2 text-dark">{formatCurrency(mainWallet?.total_outgoing)}</h2>
                        <span className="card-subtitle text-secondary">{mainWallet?.successful_transaction_count || 0} successful entries</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WalletOverview;
