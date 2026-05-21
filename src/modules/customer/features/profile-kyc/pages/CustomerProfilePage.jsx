import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getUserProfileApi } from '../../../../identity/services/profileService';
import { doFetchProfileSuccess } from '../../../../identity/redux/authAction';
import ProfileDetails from '../components/ProfileDetails';
import KycModal from '../components/KycModal';
import { toast } from 'react-toastify';
import '../styles/ProfileKyc.scss'; // Load CSS

const CustomerProfilePage = () => {
    const dispatch = useDispatch();
    const { account } = useSelector(state => state.identity);
    const [isLoading, setIsLoading] = useState(true);
    const [showKycModal, setShowKycModal] = useState(false);

    const syncProfile = async () => {
        try {
            let res = await getUserProfileApi();
            if (res && res.EC === 0) {
                dispatch(doFetchProfileSuccess(res.DT));
            }
        } catch (error) {
            console.error(error);
            toast.error("Cannot sync profile data.");
        }
        setIsLoading(false);
    };

    useEffect(() => {
        syncProfile();
    }, [dispatch]);

    // Mock Data for English UI
    const mockMetrics = {
        trustScoreStars: 4.2,
        totalContracts: 18,
        completedContracts: 17,
        completionRate: "94%"
    };

    if (isLoading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
                <div className="spinner-border text-primary" role="status"></div>
            </div>
        );
    }

    return (
        <div className="py-2">
            <ProfileDetails 
                account={account} 
                metrics={mockMetrics} 
                onOpenKycModal={() => setShowKycModal(true)} 
            />
            
            <KycModal 
                show={showKycModal} 
                onClose={() => setShowKycModal(false)} 
                onSuccess={syncProfile} // Gọi lại API lấy profile để cập nhật trạng thái PENDING
            />
        </div>
    );
};

export default CustomerProfilePage;