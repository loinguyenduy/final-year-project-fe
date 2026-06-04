import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom"; // Thêm Hook điều hướng
import {
  FaFileAlt,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaShieldAlt,
  FaLock,
} from "react-icons/fa";
import KycStepper from "../components/KycStepper";
import HandymanKycModal from "../../kyc/components/HandymanKycModal";
import axiosInstance from "../../../../../core/api/axiosInstance";
import { doFetchProfileSuccess } from "../../../../identity/redux/authAction";
import "../styles/HandymanDashboard.scss";

const HandymanDashboardPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate(); // Khởi tạo navigate
  const { account } = useSelector((state) => state.identity);
  const [showKycModal, setShowKycModal] = useState(false);

  const currentLevel = account?.handyman_profile?.handyman_level || "C1";
  const kycStatus = account?.kyc_status || "UNVERIFIED";

  const fetchLatestProfile = async () => {
    try {
      let res = await axiosInstance.get("/identity/profile");
      if (res && res.EC === 0) {
        dispatch(doFetchProfileSuccess(res.DT));
      }
    } catch (error) {
      console.error("Failed to fetch latest profile", error);
    }
  };

  // --- C1 BLOCK (Giữ nguyên như đã làm) ---
  const renderC1VerificationBlock = () => {
    return (
      <div className="kyc-verification-block shadow-sm">
        <div className="doc-icon">
          <FaFileAlt size={32} />
        </div>
        <h4>Identity Verification</h4>
        <p className="desc">
          You need to complete your legal profile to become a verified
          professional.
        </p>

        <div className="req-list">
          <h6>Required Documents:</h6>
          <ul>
            <li>
              <FaCheckCircle /> ID Card (Front and Back)
            </li>
            <li>
              <FaCheckCircle /> Portrait Selfie (Holding ID Card)
            </li>
            <li>
              <FaCheckCircle /> Curriculum Vitae (CV)
            </li>
            <li>
              <FaCheckCircle /> Professional/Vocational Certificates
            </li>
          </ul>
        </div>

        {kycStatus === "UNVERIFIED" && (
          <button
            className="btn btn-primary px-5 py-2 fw-bold"
            style={{ backgroundColor: "#ea580c", borderColor: "#ea580c" }}
            onClick={() => setShowKycModal(true)}
          >
            Upload Documents
          </button>
        )}
        {kycStatus === "PENDING" && (
          <div className="alert alert-info d-flex align-items-center justify-content-center gap-2 border-0 bg-info bg-opacity-10 text-primary">
            <FaClock size={20} />
            <strong>Under Review.</strong> Your documents are being verified by
            our team (Estimated 1-2 days).
          </div>
        )}
        {kycStatus === "REJECTED" && (
          <>
            <div className="alert alert-danger d-flex align-items-center justify-content-center gap-2 border-0 bg-danger bg-opacity-10 text-danger mb-3">
              <FaExclamationTriangle size={20} />
              <strong>Rejected!</strong> Please check your documents and try
              again.
            </div>
            <button
              className="btn btn-danger px-5 py-2 fw-bold"
              onClick={() => setShowKycModal(true)}
            >
              Re-upload Documents
            </button>
          </>
        )}
      </div>
    );
  };

  // --- C2 BLOCK (MỚI THÊM) ---
  const renderC2BondingBlock = () => {
    return (
      <div className="bonding-block shadow-sm">
        <div className="header-section">
          <div className="shield-icon">
            <FaShieldAlt size={32} />
          </div>
          <h4>Security Bond</h4>
          <p>
            Deposit security bond to become an official partner and receive
            large jobs
          </p>
        </div>

        <div className="amount-box">
          <div className="label">Required Bond Amount</div>
          <div className="amount">2,000,000 ₫</div>

          <div className="info-grid">
            <div className="info-item">
              <small>Usage:</small>
              <strong>Quality Assurance</strong>
            </div>
            <div className="info-item">
              <small>Refund:</small>
              <strong>Upon account closure</strong>
            </div>
          </div>
        </div>

        <div className="benefits-box">
          <h6>Benefits of Bonding:</h6>
          <ul>
            <li>
              <FaCheckCircle /> Receive high-value jobs (&gt;500k)
            </li>
            <li>
              <FaCheckCircle /> Priority listing in the handyman directory
            </li>
            <li>
              <FaCheckCircle /> "Official Partner" Badge
            </li>
            <li>
              <FaCheckCircle /> Participate in monthly reward programs
            </li>
          </ul>
        </div>

        {/* Điều hướng sang trang Wallet */}
        <button
          className="btn btn-primary w-100 fw-bold py-3 fs-5"
          style={{ backgroundColor: "#ea580c", borderColor: "#ea580c" }}
          onClick={() => navigate("/handyman/wallet")}
        >
          $ Deposit 2,000,000 ₫ Now
        </button>
        <div className="text-center mt-2 small text-muted">
          Secure payment via VNPay, PayOS
        </div>

        <div className="security-note">
          <FaLock className="icon" size={24} />
          <p>
            <strong>Security Commitment</strong>
            <br />
            The security bond is stored in a separate Escrow Wallet and is used
            solely to guarantee job quality. You can withdraw this amount if you
            decide to stop working on the platform.
          </p>
        </div>
      </div>
    );
  };

  // --- C3 PLACEHOLDER ---
  const renderC3OfficialDashboard = () => {
    return (
      <div className="c3-placeholder">
        <FaCheckCircle size={64} color="#65a30d" className="mb-3" />
        <h3>Welcome to Official Partner Dashboard</h3>
        <p className="text-muted">
          You have successfully bonded and unlocked all features.
          <br />
          (The full dashboard UI will be implemented in the next step)
        </p>
      </div>
    );
  };

  return (
    <div className="handyman-dashboard">
      {/* Chỉ hiện Banner Welcome nếu chưa lên C3 */}
      {currentLevel !== "C3" && (
        <div className="welcome-banner">
          <h2>Welcome to Trusted Handyman!</h2>
          <p>Complete your onboarding steps to start receiving jobs.</p>
        </div>
      )}
      {/* Ẩn Stepper nếu đã lên C3 */}
      {currentLevel !== "C3" && <KycStepper currentLevel={currentLevel} />}

      {/* SWITCHER LOGIC */}
      {currentLevel === "C1" && renderC1VerificationBlock()}
      {currentLevel === "C2" && renderC2BondingBlock()}
      {currentLevel === "C3" && renderC3OfficialDashboard()}

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
