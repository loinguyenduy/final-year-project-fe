import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FaFileAlt, FaCheckCircle, FaClock, FaExclamationTriangle } from 'react-icons/fa';
import KycStepper from '../components/KycStepper';
import HandymanKycModal from '../../kyc/components/HandymanKycModal'; 
import axiosInstance from '../../../../../core/api/axiosInstance';
import { doFetchProfileSuccess } from '../../../../identity/redux/authAction';
import '../styles/HandymanDashboard.scss';

const HandymanDashboardPage = () => {
    const dispatch = useDispatch();
    const { account } = useSelector(state => state.identity);
    const [showKycModal, setShowKycModal] = useState(false);

    // Lấy thông tin từ Redux
    const currentLevel = account?.handyman_profile?.handyman_level || 'C1';
    const kycStatus = account?.kyc_status || 'UNVERIFIED';

    // Hàm gọi API đồng bộ lại Profile sau khi nộp hồ sơ KYC
    const fetchLatestProfile = async () => {
        try {
            // Giả định bạn có endpoint /identity/profile. Sửa lại nếu endpoint của bạn khác.
            let res = await axiosInstance.get("/identity/profile"); 
            if (res && res.EC === 0) {
                dispatch(doFetchProfileSuccess(res.DT));
            }
        } catch (error) {
            console.error("Failed to fetch latest profile", error);
        }
    };

    // --- CÁC KHỐI RENDER THEO LEVEL ---

    const renderC1VerificationBlock = () => {
        return (
            <div className="kyc-verification-block shadow-sm">
                <div className="doc-icon">
                    <FaFileAlt size={32} />
                </div>
                <h4>Identity Verification</h4>
                <p className="desc">You need to complete your legal profile to become a verified professional.</p>

                <div className="req-list">
                    <h6>Required Documents:</h6>
                    <ul>
                        <li><FaCheckCircle /> ID Card (Front and Back)</li>
                        <li><FaCheckCircle /> Portrait Selfie (Holding ID Card)</li>
                        <li><FaCheckCircle /> Curriculum Vitae (CV)</li>
                        <li><FaCheckCircle /> Professional/Vocational Certificates</li>
                    </ul>
                </div>

                {/* Xử lý UI dựa trên kyc_status */}
                {kycStatus === 'UNVERIFIED' && (
                    <button className="btn btn-primary px-5 py-2 fw-bold" style={{ backgroundColor: '#ea580c', borderColor: '#ea580c' }} onClick={() => setShowKycModal(true)}>
                        Upload Documents
                    </button>
                )}

                {kycStatus === 'PENDING' && (
                    <div className="alert alert-info d-flex align-items-center justify-content-center gap-2 border-0 bg-info bg-opacity-10 text-primary">
                        <FaClock size={20} />
                        <strong>Under Review.</strong> Your documents are being verified by our team (Estimated 1-2 days).
                    </div>
                )}

                {kycStatus === 'REJECTED' && (
                    <>
                        <div className="alert alert-danger d-flex align-items-center justify-content-center gap-2 border-0 bg-danger bg-opacity-10 text-danger mb-3">
                            <FaExclamationTriangle size={20} />
                            <strong>Rejected!</strong> Please check your documents and try again.
                        </div>
                        <button className="btn btn-danger px-5 py-2 fw-bold" onClick={() => setShowKycModal(true)}>
                            Re-upload Documents
                        </button>
                    </>
                )}
            </div>
        );
    };

    const renderC2BondingBlock = () => {
        return (
            <div className="text-center p-5">
                <h2>C2 Level: Bonding Step</h2>
                <p>You are now a Verified KYC Pro! Next step: Deposit 2,000,000 VND.</p>
                {/* Chúng ta sẽ làm chi tiết khối này ở thảo luận tiếp theo */}
            </div>
        );
    };

    return (
        <div className="handyman-dashboard">
            {/* STEPPER */}
            <KycStepper currentLevel={currentLevel} />

            {/* WELCOME BANNER */}
            <div className="welcome-banner">
                <h2>Welcome to Trusted Handyman!</h2>
                <p>Complete your identity verification to start receiving jobs.</p>
            </div>

            {/* CONTENT SWITCHER */}
            {currentLevel === 'C1' && renderC1VerificationBlock()}
            {currentLevel === 'C2' && renderC2BondingBlock()}
            {/* currentLevel === 'C3' -> Sẽ render Full Dashboard sau */}

            {/* MODAL KYC */}
            <HandymanKycModal 
                show={showKycModal} 
                onClose={() => setShowKycModal(false)} 
                onSuccess={fetchLatestProfile} 
            />
        </div>
    );
};

export default HandymanDashboardPage;