import React, { useEffect, useState } from 'react';
import { getMyWalletsApi } from '../../../services/walletService';
import WalletOverview from '../components/WalletOverview';
import WalletDeposit from '../components/WalletDeposit';
import ParticipantTransactionHistory from '../../../../fintech/components/ParticipantTransactionHistory';
import '../styles/CustomerWallet.scss';

const CustomerWalletPage = () => {
    const [wallets, setWallets] = useState([]);

    useEffect(() => {
        const syncProfile = async () => {
            try {
                const res = await getMyWalletsApi();
                if (res && res.EC === 0) setWallets(res.DT.wallets || []);
            } catch (error) {
                console.error("Failed to sync profile in wallet page", error);
            }
        };
        syncProfile();
    }, []);

    return (
        <div className="customer-wallet-container py-2">
            <WalletOverview wallets={wallets} />

            <div className="row g-4">
                <div className="col-lg-5">
                    <WalletDeposit />
                </div>
                <div className="col-lg-7">
                    <ParticipantTransactionHistory />
                </div>
            </div>
        </div>
    );
};

export default CustomerWalletPage;
