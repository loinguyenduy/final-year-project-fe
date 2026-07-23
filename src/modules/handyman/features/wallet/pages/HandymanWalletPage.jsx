import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { FaLock, FaUnlockAlt, FaWallet } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { getMyWalletsApi, topUpWalletApi } from '../../../services/walletService';
import ParticipantTransactionHistory from '../../../../fintech/components/ParticipantTransactionHistory';
import '../styles/HandymanWallet.scss';

const HandymanWalletPage = () => {
    const { account } = useSelector((state) => state.identity);
    const profile = account?.handyman_profile || {};
    const [wallets, setWallets] = useState([]);
    const [walletError, setWalletError] = useState('');
    const [amount, setAmount] = useState('');
    const [targetWallet, setTargetWallet] = useState('MAIN');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        let active = true;
        getMyWalletsApi()
            .then((response) => {
                if (active && response?.EC === 0) setWallets(response.DT?.wallets || []);
            })
            .catch(() => {
                if (active) setWalletError('Wallet balances could not be loaded.');
            });
        return () => { active = false; };
    }, []);

    const mainWallet = wallets.find((wallet) => wallet.wallet_type === 'HANDYMAN_MAIN');
    const escrowWallet = wallets.find((wallet) => wallet.wallet_type === 'HANDYMAN_ESCROW');
    const formatCurrency = (value) => new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(Number(value || 0));

    const handleTargetWalletChange = (type) => {
        setTargetWallet(type);
        setAmount(type === 'ESCROW' ? '2000000' : '');
    };

    const handleTopUp = async (event) => {
        event.preventDefault();
        if (!amount || Number.isNaN(Number(amount)) || Number(amount) <= 0) {
            toast.error('Please enter a valid amount.');
            return;
        }

        setIsLoading(true);
        try {
            const response = await topUpWalletApi({
                amount: Number(amount),
                payment_method: 'PAYOS',
                target_wallet: targetWallet,
            });
            if (response?.EC === 0) {
                toast.success('Redirecting to payment gateway...');
                window.location.href = response.DT;
            } else {
                toast.error(response?.EM || 'Top-up initialization failed.');
            }
        } catch (error) {
            toast.error(error?.EM || 'An error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="handyman-wallet-page">
            <div className="page-header">
                <h3>Dual Wallet</h3>
                <p>Main Wallet for earnings — Escrow Wallet for partnership guarantee</p>
            </div>
            {walletError && <div className="alert alert-warning" role="alert">{walletError}</div>}

            <div className="wallet-cards-container">
                <div className="wallet-card main-wallet">
                    <div className="card-top">
                        <div className="title-wrapper"><FaWallet /><span>Main Wallet</span></div>
                        <span className="badge-status">{mainWallet?.status || 'Unavailable'}</span>
                    </div>
                    <div className="balance-section">
                        <h2>{formatCurrency(mainWallet?.available_balance)}</h2>
                        <small>Ready to withdraw or use</small>
                    </div>
                    <div className="card-bottom">
                        <div className="stat-item"><span>Successful Incoming</span><strong>{formatCurrency(mainWallet?.total_incoming)}</strong></div>
                        <div className="stat-item"><span>Successful Outgoing</span><strong>{formatCurrency(mainWallet?.total_outgoing)}</strong></div>
                    </div>
                </div>

                <div className="wallet-card escrow-wallet">
                    <div className="card-top">
                        <div className="title-wrapper"><FaLock /><span>Escrow Wallet</span></div>
                        <span className="badge-status"><FaUnlockAlt className="me-1" /> {escrowWallet?.status || 'Unavailable'}</span>
                    </div>
                    <div className="balance-section">
                        <h2>{formatCurrency(escrowWallet?.available_balance)}</h2>
                        <small>Restricted wallet for security and job guarantees</small>
                    </div>
                    <div className="card-bottom">
                        <div className="stat-item"><span>Security Bond</span><strong>{profile.security_bond_status || 'UNPAID'}</strong></div>
                        <div className="stat-item"><span>Pending Entries</span><strong>{escrowWallet?.pending_transaction_count || 0}</strong></div>
                    </div>
                </div>
            </div>

            <div className="wallet-content-section">
                <div className="action-panel topup-form">
                    <h5 className="panel-title">Top Up Wallet</h5>
                    <form onSubmit={handleTopUp}>
                        <div className="mb-3">
                            <label className="form-label" htmlFor="target-wallet">Select Target Wallet</label>
                            <select id="target-wallet" className="form-select" value={targetWallet} onChange={(event) => handleTargetWalletChange(event.target.value)}>
                                <option value="MAIN">Main Wallet (Earnings & Fees)</option>
                                <option value="ESCROW">Escrow Wallet (Security Bond)</option>
                            </select>
                        </div>
                        <div className="mb-3">
                            <label className="form-label" htmlFor="topup-amount">Amount (VND)</label>
                            <input id="topup-amount" type="number" className="form-control mb-2" placeholder="Enter amount..." value={amount} onChange={(event) => setAmount(event.target.value)} disabled={targetWallet === 'ESCROW'} />
                            {targetWallet === 'MAIN' && (
                                <div className="quick-amounts">
                                    {[200000, 500000, 1000000, 2000000].map((quickAmount) => (
                                        <button type="button" key={quickAmount} onClick={() => setAmount(String(quickAmount))}>{quickAmount >= 1000000 ? `${quickAmount / 1000000}m` : `${quickAmount / 1000}k`}</button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="mb-4">
                            <span className="form-label">Payment Method</span>
                            <div className="payment-methods">
                                <label className="method-option selected">
                                    <input type="radio" name="payment" checked readOnly />
                                    <span><span className="method-name">PayOS</span><span className="method-desc">Quick QR Transfer (No fees)</span></span>
                                </label>
                            </div>
                        </div>
                        <button type="submit" className="btn btn-primary w-100 fw-bold py-2" style={{ backgroundColor: '#ea580c', borderColor: '#ea580c' }} disabled={isLoading}>
                            {isLoading ? 'Processing...' : 'Deposit Now'}
                        </button>
                    </form>
                </div>
                <div className="history-panel"><ParticipantTransactionHistory /></div>
            </div>
        </div>
    );
};

export default HandymanWalletPage;
