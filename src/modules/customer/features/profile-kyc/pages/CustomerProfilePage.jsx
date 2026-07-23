import React, { useCallback, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {getUserProfileApi} from '../../../services/profileService';
import { doFetchProfileSuccess } from '../../../../identity/redux/authAction';
import ProfileDetails from '../components/ProfileDetails';
import KycModal from '../components/KycModal';
import { toast } from 'react-toastify';
import ParticipantProfileReviews from '../../../../identity/components/ParticipantProfileReviews';
import '../styles/ProfileKyc.scss'; 

const CustomerProfilePage = () => {
    const dispatch = useDispatch();
    const { account } = useSelector(state => state.identity);
    const [isLoading, setIsLoading] = useState(true);
    const [showKycModal, setShowKycModal] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');

    const syncProfile = useCallback(async () => {
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
    }, [dispatch]);

    useEffect(() => {
        syncProfile();
    }, [syncProfile]);

    if (isLoading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
                <div className="spinner-border text-primary" role="status"></div>
            </div>
        );
    }

    return (
        <div className="py-2">
            <div className="participant-profile-tabs" role="tablist" aria-label="Profile sections">
                {['overview', 'reviews', 'security'].map((tab) => <button key={tab} type="button" role="tab" aria-selected={activeTab === tab} className={activeTab === tab ? 'active' : ''} onClick={() => setActiveTab(tab)}>{tab[0].toUpperCase() + tab.slice(1)}</button>)}
            </div>
            {activeTab === 'reviews' ? <ParticipantProfileReviews userId={account.id} ratingSummary={account.rating_summary} /> : (
                <ProfileDetails
                    account={account}
                    section={activeTab}
                    onOpenKycModal={() => setShowKycModal(true)}
                    onRefresh={syncProfile}
                />
            )}
            
            <KycModal 
                show={showKycModal} 
                onClose={() => setShowKycModal(false)} 
                onSuccess={syncProfile} // Gọi lại API lấy profile để cập nhật trạng thái PENDING
            />
        </div>
    );
};

export default CustomerProfilePage;
