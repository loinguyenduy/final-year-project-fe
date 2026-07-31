import React, { useCallback, useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FaAward, FaShieldAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { doFetchProfileSuccess } from '../../../../identity/redux/authAction';
import { fetchProfileApi } from '../../../services/profileService';
import ProfileSidebar from '../components/ProfileSidebar';
import PersonalInfoCard from '../components/PersonalInfoCard';
import SkillsAndBioCard from '../components/SkillsAndBioCard';
import ServiceAreasCard from '../components/ServiceAreasCard';
import WorkTimesCard from '../components/WorkTimesCard';
import SecurityDocsTab from '../components/SecurityDocsTab';
import HandymanKycModal from '../../kyc/components/HandymanKycModal';
import ParticipantProfileReviews from '../../../../identity/components/ParticipantProfileReviews';
import '../styles/HandymanProfile.scss';

const HandymanProfilePage = () => {
    const dispatch = useDispatch();
    const { account } = useSelector(state => state.identity);
    const [activeTab, setActiveTab] = useState(0);
    const [showKycModal, setShowKycModal] = useState(false);

    const profile = account?.handyman_profile || {};
    const services = account?.services || [];
    const areas = account?.service_areas || [];
    const addresses = account?.saved_addresses || [];
    const canSubmitKyc = ['UNVERIFIED', 'REJECTED'].includes(account?.kyc_status);

    const refreshProfile = useCallback(async () => {
        try {
            const res = await fetchProfileApi();
            if (res && res.EC === 0) {
                dispatch(doFetchProfileSuccess(res.DT));
            }
        } catch {
            toast.error("Failed to refresh profile data.");
        }
    }, [dispatch]);

    useEffect(() => {
        refreshProfile();
    }, [refreshProfile]);

    return (
        <div className="handyman-profile-page">
            <div className="page-header">
                <div>
                    <h3>My Profile</h3>
                    <p>Manage your professional identity, skills and work preferences</p>
                </div>
                {canSubmitKyc && (
                    <button
                        type="button"
                        className="btn btn-primary fw-bold"
                        onClick={() => setShowKycModal(true)}
                    >
                        {account?.kyc_status === 'REJECTED' ? 'Resubmit KYC' : 'Upload KYC'}
                    </button>
                )}
            </div>

            <div className="row g-4">
                <div className="col-lg-4">
                    <ProfileSidebar account={account} profile={profile} />
                </div>

                <div className="col-lg-8">
                    <div className="profile-content">
                        <div className="custom-tabs">
                            <button
                                className={`tab-btn ${activeTab === 0 ? 'active' : ''}`}
                                onClick={() => setActiveTab(0)}
                            >
                                <FaAward className="me-2" />Overview
                            </button>
                            <button
                                className={`tab-btn ${activeTab === 1 ? 'active' : ''}`}
                                onClick={() => setActiveTab(1)}
                            >
                                Reviews
                            </button>
                            <button
                                className={`tab-btn ${activeTab === 2 ? 'active' : ''}`}
                                onClick={() => setActiveTab(2)}
                            >
                                <FaShieldAlt className="me-2" />Security & Docs
                            </button>
                        </div>

                        {activeTab === 0 && (
                            <>
                                <PersonalInfoCard
                                    account={account}
                                    addresses={addresses}
                                    onRefresh={refreshProfile}
                                />
                                <SkillsAndBioCard
                                    services={services}
                                    bio={profile.bio}
                                    onRefresh={refreshProfile}
                                />
                                <ServiceAreasCard
                                    areas={areas}
                                    onRefresh={refreshProfile}
                                />
                                <WorkTimesCard
                                    workTimes={account?.work_times || profile.preferred_work_times || []}
                                    onRefresh={refreshProfile}
                                />
                            </>
                        )}

                        {activeTab === 1 && <ParticipantProfileReviews userId={account.id} ratingSummary={account.rating_summary} />}

                        {activeTab === 2 && (
                            <SecurityDocsTab account={account} />
                        )}
                    </div>
                </div>
            </div>

            <HandymanKycModal
                show={showKycModal}
                onClose={() => setShowKycModal(false)}
                onSuccess={refreshProfile}
            />
        </div>
    );
};

export default HandymanProfilePage;
