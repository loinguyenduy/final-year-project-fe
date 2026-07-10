import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { FaWallet, FaLock, FaUnlockAlt, FaArrowDown, FaArrowUp, FaMoneyBillWave } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { topUpWalletApi } from '../../../services/walletService';
import '../styles/HandymanWallet.scss';

const HandymanWalletPage = () => {
    // --- DATA TỪ REDUX ---
    const { account } = useSelector(state => state.identity);
    const wallets = account?.wallets || [];
    const profile = account?.handyman_profile || {};

    const mainWallet = wallets.find(w => w.wallet_type === 'HANDYMAN_MAIN');
    const escrowWallet = wallets.find(w => w.wallet_type === 'HANDYMAN_ESCROW');
    const securityBondAmount = profile.security_bond_status === 'PAID' ? 2000000 : 0;

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
    };

    // --- STATE CHO FORM NẠP TIỀN ---
    const [amount, setAmount] = useState('');
    const [targetWallet, setTargetWallet] = useState('MAIN'); // 'MAIN' hoặc 'ESCROW'
    const [isLoading, setIsLoading] = useState(false);

    // Xử lý khi đổi loại ví nạp
    const handleTargetWalletChange = (type) => {
        setTargetWallet(type);
        if (type === 'ESCROW') {
            setAmount('2000000'); // Force 2 triệu nếu là ví ký quỹ
        } else {
            setAmount('');
        }
    };

    // Hàm gọi API Nạp tiền
    const handleTopUp = async (e) => {
        e.preventDefault();
        
        if (!amount || isNaN(amount) || Number(amount) <= 0) {
            toast.error("Please enter a valid amount.");
            return;
        }

        setIsLoading(true);
        try {
            const payload = {
                amount: Number(amount),
                payment_method: 'PAYOS',
                target_wallet: targetWallet
            };

            let res = await topUpWalletApi(payload);
            
            if (res && res.EC === 0) {
                // Backend trả về link thanh toán trong res.DT
                toast.success("Redirecting to payment gateway...");
                window.location.href = res.DT; 
            } else {
                toast.error(res.EM || "Top-up initialization failed.");
            }
        } catch (error) {
            toast.error(error?.EM || "An error occurred.");
        }
        setIsLoading(false);
    };

    // Dữ liệu Fake cho Lịch sử giao dịch
    const mockTransactions = [
        { id: 1, type: 'BOND_LOCK', title: 'Security Bond (Escrow)', date: '01/01/2026 08:00', amount: -2000000 },
        { id: 2, type: 'JOB_FEE', title: 'System Fee (Job-0041)', date: '20/05/2026 14:30', amount: -85000 },
        { id: 3, type: 'TOP_UP', title: 'Wallet Top-up (PayOS)', date: '15/05/2026 09:00', amount: 500000 },
    ];

    return (
        <div className="handyman-wallet-page">
            <div className="page-header">
                <h3>Dual Wallet</h3>
                <p>Main Wallet for earnings — Escrow Wallet for partnership guarantee</p>
            </div>

            {/* --- KHU VỰC 1: DUAL WALLET CARDS (Giữ nguyên như cũ) --- */}
            <div className="wallet-cards-container">
                {/* 1. THẺ VÍ CHÍNH */}
                <div className="wallet-card main-wallet">
                    <div className="card-top">
                        <div className="title-wrapper"><FaWallet /><span>Main Wallet</span></div>
                        <span className="badge-status">Active</span>
                    </div>
                    <div className="balance-section">
                        <h2>{formatCurrency(mainWallet?.balance)}</h2>
                        <small>Ready to withdraw or use</small>
                    </div>
                    <div className="card-bottom">
                        <div className="stat-item"><span>Monthly Income</span><strong>{formatCurrency(0)}</strong></div>
                        <div className="stat-item"><span>System Fee (10%)</span><strong>{formatCurrency(0)}</strong></div>
                    </div>
                </div>

                {/* 2. THẺ VÍ KÝ QUỸ */}
                <div className="wallet-card escrow-wallet">
                    <div className="card-top">
                        <div className="title-wrapper"><FaLock /><span>Escrow Wallet</span></div>
                        <span className="badge-status"><FaUnlockAlt className="me-1"/> Locked</span>
                    </div>
                    <div className="balance-section">
                        <h2>{formatCurrency(escrowWallet?.balance)}</h2>
                        <small>Locked — Cannot be withdrawn freely</small>
                    </div>
                    <div className="card-bottom">
                        <div className="stat-item"><span>Security Bond</span><strong>{formatCurrency(securityBondAmount)}</strong></div>
                        <div className="stat-item"><span>Job Guarantee Lock</span><strong>{formatCurrency(0)}</strong></div>
                    </div>
                </div>
            </div>

            {/* --- KHU VỰC 2: FORM NẠP TIỀN & LỊCH SỬ GIAO DỊCH --- */}
            <div className="wallet-content-section">
                
                {/* CỘT TRÁI: FORM NẠP TIỀN */}
                <div className="action-panel topup-form">
                    <h5 className="panel-title">Top Up Wallet</h5>
                    <form onSubmit={handleTopUp}>
                        
                        {/* Chọn Ví */}
                        <div className="mb-3">
                            <label className="form-label">Select Target Wallet</label>
                            <select 
                                className="form-select" 
                                value={targetWallet}
                                onChange={(e) => handleTargetWalletChange(e.target.value)}
                            >
                                <option value="MAIN">Main Wallet (Earnings & Fees)</option>
                                <option value="ESCROW">Escrow Wallet (Security Bond)</option>
                            </select>
                        </div>

                        {/* Nhập số tiền */}
                        <div className="mb-3">
                            <label className="form-label">Amount (VND)</label>
                            <input 
                                type="number" 
                                className="form-control mb-2" 
                                placeholder="Enter amount..." 
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                disabled={targetWallet === 'ESCROW'} // Khóa nếu là ví ký quỹ
                            />
                            {targetWallet === 'MAIN' && (
                                <div className="quick-amounts">
                                    <button type="button" onClick={() => setAmount(200000)}>200k</button>
                                    <button type="button" onClick={() => setAmount(500000)}>500k</button>
                                    <button type="button" onClick={() => setAmount(1000000)}>1m</button>
                                    <button type="button" onClick={() => setAmount(2000000)}>2m</button>
                                </div>
                            )}
                        </div>

                        {/* Chọn Cổng Thanh Toán */}
                        <div className="mb-4">
                            <label className="form-label">Payment Method</label>
                            <div className="payment-methods">
                                <label className="method-option selected">
                                    <input type="radio" name="payment" checked readOnly />
                                    <div>
                                        <div className="method-name">PayOS</div>
                                        <div className="method-desc">Quick QR Transfer (No fees)</div>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            className="btn btn-primary w-100 fw-bold py-2" 
                            style={{ backgroundColor: '#ea580c', borderColor: '#ea580c' }}
                            disabled={isLoading}
                        >
                            {isLoading ? "Processing..." : "Deposit Now"}
                        </button>
                    </form>
                </div>

                {/* CỘT PHẢI: LỊCH SỬ GIAO DỊCH (FAKE DATA) */}
                <div className="history-panel">
                    <h5 className="panel-title">Recent Transactions</h5>
                    <div className="history-list">
                        {mockTransactions.map(tx => (
                            <div className="history-item" key={tx.id}>
                                <div className={`icon-box ${tx.amount > 0 ? 'in' : (tx.type === 'BOND_LOCK' ? 'lock' : 'out')}`}>
                                    {tx.amount > 0 ? <FaArrowUp /> : (tx.type === 'BOND_LOCK' ? <FaLock /> : <FaArrowDown />)}
                                </div>
                                <div className="tx-info">
                                    <h6>{tx.title}</h6>
                                    <small>{tx.date}</small>
                                </div>
                                <div className={`tx-amount ${tx.amount > 0 ? 'positive' : 'negative'}`}>
                                    {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default HandymanWalletPage;
