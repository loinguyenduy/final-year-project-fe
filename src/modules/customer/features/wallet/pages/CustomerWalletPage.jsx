import React from 'react';
import WalletOverview from '../components/WalletOverview';
import WalletDeposit from '../components/WalletDeposit';
import TransactionHistory from '../components/TransactionHistory';
import '../styles/CustomerWallet.scss';

const CustomerWalletPage = () => {
    return (
        <div className="customer-wallet-container py-2">
            <WalletOverview />
            
            <div className="row g-4">
                <div className="col-lg-5">
                    <WalletDeposit />
                </div>
                <div className="col-lg-7">
                    <TransactionHistory />
                </div>
            </div>
        </div>
    );
};

export default CustomerWalletPage;
