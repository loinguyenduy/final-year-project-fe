import React, { useState } from 'react';
import { FaQrcode } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { topUpWalletApi } from '../../../services/walletService';

const WalletDeposit = () => {
    const [activeTab, setActiveTab] = useState('deposit');
    const [amount, setAmount] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const quickAmounts = [100000, 200000, 500000, 1000000];

    const handleAmountSelect = (val) => {
        setAmount(val.toString());
    };

    const formatCurrency = (val) => {
        if (!val) return '';
        const number = parseInt(val.replace(/[^0-9]/g, ''), 10);
        if (isNaN(number)) return '';
        return new Intl.NumberFormat('vi-VN').format(number);
    };

    const handleAmountChange = (e) => {
        const rawValue = e.target.value.replace(/[^0-9]/g, '');
        setAmount(rawValue);
    };

    const handleDeposit = async () => {
        if (!amount || parseInt(amount) <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }

        setIsLoading(true);
        try {
            const data = {
                amount: parseInt(amount),
                payment_method: 'PAYOS'
            };
            
            const res = await topUpWalletApi(data);
            if (res && res.EC === 0) {
                window.location.href = res.DT;
            } else {
                toast.error(res.EM || 'Failed to initialize payment');
                setIsLoading(false);
            }
        } catch (error) {
            toast.error(error?.response?.data?.EM || 'An error occurred during payment initialization');
            setIsLoading(false);
        }
    };

    return (
        <div className="wallet-card form-card">
            {/* Tabs */}
            <div className="custom-tabs mb-4">
                <button 
                    className={`tab-btn ${activeTab === 'deposit' ? 'active' : ''}`}
                    onClick={() => setActiveTab('deposit')}
                >
                    Deposit
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'withdraw' ? 'active' : ''}`}
                    onClick={() => setActiveTab('withdraw')}
                >
                    Withdraw
                </button>
            </div>

            {activeTab === 'withdraw' ? (
                <div className="text-center py-5">
                    <p className="text-muted">Withdrawal feature is coming soon.</p>
                </div>
            ) : (
                <div className="deposit-form">
                    {/* Amount Input */}
                    <div className="form-group mb-4">
                        <label className="fw-bold mb-2">Amount (VND)</label>
                        <input 
                            type="text" 
                            className="form-control amount-input" 
                            placeholder="Enter amount..."
                            value={formatCurrency(amount)}
                            onChange={handleAmountChange}
                        />
                        <div className="quick-amounts mt-3">
                            {quickAmounts.map((amt) => (
                                <button 
                                    key={amt} 
                                    className="quick-btn"
                                    onClick={() => handleAmountSelect(amt)}
                                >
                                    {amt >= 1000000 ? `${amt / 1000000}m` : `${amt / 1000}k`}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Payment Methods */}
                    <div className="form-group mb-4">
                        <label className="fw-bold mb-2">Payment Method</label>
                        <div className="payment-methods">
                            <div className="method-item selected">
                                <div className="d-flex align-items-center">
                                    <div className="method-icon bg-light text-primary">
                                        <FaQrcode />
                                    </div>
                                    <div className="ms-3">
                                        <h6 className="m-0 fw-bold">PayOS</h6>
                                        <small className="text-muted">Quick QR Transfer</small>
                                    </div>
                                </div>
                                <div className="radio-circle">
                                    <div className="inner-circle" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <button 
                        className="btn btn-primary w-100 fw-bold btn-deposit"
                        onClick={handleDeposit}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Processing...' : 'Deposit Now'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default WalletDeposit;
