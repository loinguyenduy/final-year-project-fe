import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { getUserProfileApi } from '../../../services/profileService';
import { FETCH_PROFILE_SUCCESS } from '../../../../identity/redux/authAction';
import WalletOverview from '../components/WalletOverview';
import WalletDeposit from '../components/WalletDeposit';
import TransactionHistory from '../components/TransactionHistory';
import '../styles/CustomerWallet.scss';

const CustomerWalletPage = () => {
    const dispatch = useDispatch();

    useEffect(() => {
        const syncProfile = async () => {
            try {
                const res = await getUserProfileApi();
                if (res && res.EC === 0) {
                    dispatch({ type: FETCH_PROFILE_SUCCESS, payload: res.DT });
                }
            } catch (error) {
                console.error("Failed to sync profile in wallet page", error);
            }
        };
        syncProfile();
    }, [dispatch]);

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
