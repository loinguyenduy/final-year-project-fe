import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom"; 
import {
  FaFileAlt, FaCheckCircle, FaClock, FaExclamationTriangle, FaLock,
  FaStar, FaBriefcase, FaWallet, FaShieldAlt, FaCheckSquare,
  FaMapMarkerAlt, FaBell, FaChevronRight, FaUser, FaSearchDollar 
} from "react-icons/fa";
import KycStepper from "../components/KycStepper";
import HandymanKycModal from "../../kyc/components/HandymanKycModal";
import axiosInstance from "../../../../../core/api/axiosInstance";
import { doFetchProfileSuccess } from "../../../../identity/redux/authAction";
import "../styles/HandymanDashboard.scss";

const HandymanDashboardPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate(); 
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

  // --- C1 BLOCK ---
  const renderC1VerificationBlock = () => {
    return (
      <div className="kyc-verification-block shadow-sm">
        <div className="doc-icon"><FaFileAlt size={32} /></div>
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
        {kycStatus === "UNVERIFIED" && (
          <button className="btn btn-primary px-5 py-2 fw-bold" style={{ backgroundColor: "#ea580c", borderColor: "#ea580c" }} onClick={() => setShowKycModal(true)}>
            Upload Documents
          </button>
        )}
        {kycStatus === "PENDING" && (
          <div className="alert alert-info d-flex align-items-center justify-content-center gap-2 border-0 bg-info bg-opacity-10 text-primary">
            <FaClock size={20} />
            <strong>Under Review.</strong> Your documents are being verified by our team (Estimated 1-2 days).
          </div>
        )}
        {kycStatus === "REJECTED" && (
          <>
            <div className="alert alert-danger d-flex align-items-center justify-content-center gap-2 border-0 bg-danger bg-opacity-10 text-danger mb-3">
              <FaExclamationTriangle size={20} />
              <div>
                <strong>Rejected!</strong> {account?.kyc_rejection?.message || 'Please check your documents and try again.'}
                {account?.kyc_rejection?.reason_text && <div className="small mt-1"><strong>Reviewer note:</strong> {account.kyc_rejection.reason_text}</div>}
              </div>
            </div>
            <button className="btn btn-danger px-5 py-2 fw-bold" onClick={() => setShowKycModal(true)}>
              Re-upload Documents
            </button>
          </>
        )}
      </div>
    );
  };

  // --- C2 BLOCK ---
  const renderC2BondingBlock = () => {
    return (
      <div className="bonding-block shadow-sm">
        <div className="header-section">
          <div className="shield-icon"><FaShieldAlt size={32} /></div>
          <h4>Security Bond</h4>
          <p>Deposit security bond to become an official partner and receive large jobs</p>
        </div>
        <div className="amount-box">
          <div className="label">Required Bond Amount</div>
          <div className="amount">2,000,000 ₫</div>
          <div className="info-grid">
            <div className="info-item"><small>Usage:</small><strong>Quality Assurance</strong></div>
            <div className="info-item"><small>Refund:</small><strong>Upon account closure</strong></div>
          </div>
        </div>
        <div className="benefits-box">
          <h6>Benefits of Bonding:</h6>
          <ul>
            <li><FaCheckCircle /> Receive high-value jobs (&gt;500k)</li>
            <li><FaCheckCircle /> Priority listing in the handyman directory</li>
            <li><FaCheckCircle /> "Official Partner" Badge</li>
            <li><FaCheckCircle /> Participate in monthly reward programs</li>
          </ul>
        </div>
        <button className="btn btn-primary w-100 fw-bold py-3 fs-5" style={{ backgroundColor: "#ea580c", borderColor: "#ea580c" }} onClick={() => navigate("/handyman/wallet")}>
          $ Deposit 2,000,000 ₫ Now
        </button>
        <div className="text-center mt-2 small text-muted">Secure payment via PayOS</div>
        <div className="security-note">
          <FaLock className="icon" size={24} />
          <p>
            <strong>Security Commitment</strong><br />
            The security bond is stored in a separate Escrow Wallet and is used solely to guarantee job quality. You can withdraw this amount if you decide to stop working on the platform.
          </p>
        </div>
      </div>
    );
  };

  // --- C3 OFFICIAL DASHBOARD ---
  const renderC3OfficialDashboard = () => {
    const fullName = account?.full_name || 'Partner';
    const wallets = account?.wallets || [];
    const mainWallet = wallets.find(w => w.wallet_type === 'HANDYMAN_MAIN')?.balance || 0;
    const escrowWallet = wallets.find(w => w.wallet_type === 'HANDYMAN_ESCROW')?.balance || 0;

    const formatShortCurrency = (amount) => {
      if (amount >= 1000000) return (amount / 1000000).toFixed(1) + 'M ₫';
      if (amount >= 1000) return (amount / 1000).toFixed(0) + 'k ₫';
      return amount + ' ₫';
    };

    const mockData = {
      rating: 4.8, monthlyIncome: 8400000, activeJobs: 1, totalCompleted: 142, completionRate: '98.6%'
    };

    // MOCK DATA: Việc làm đang nhận
    const activeJobMock = { title: "Air Conditioner Repair (Not Cooling)", client: "Nguyen Van An", location: "Binh Thanh Dist.", price: "850,000 ₫", status: "In Progress" };

    // MOCK DATA: Việc làm mới
    const newJobsMock = [
      { id: 1, title: "Replace hallway light bulbs and install sockets", category: "Electrical", distance: "1.2km", time: "5 mins ago", priceRange: "150k - 250k", location: "Tan Phu Dist." },
      { id: 2, title: "Fix refrigerator not freezing", category: "Appliance", distance: "2.8km", time: "12 mins ago", priceRange: "400k - 800k", location: "Binh Thanh Dist." },
    ];

    return (
      <div className="c3-dashboard-wrapper">
        {/* TOP BANNER & STATS (Đã làm ở bước trước) */}
        <div className="top-welcome-banner">
          <div className="user-info">
            <h5>Welcome back,</h5>
            <h2>{fullName}</h2>
            <div className="rating-level">
              <div className="stars"><FaStar /><FaStar /><FaStar /><FaStar /><FaStar className="opacity-50" /></div>
              <span>{mockData.rating}</span><span className="level-badge">• KYC Level 3</span>
            </div>
          </div>
          <div className="income-info">
            <p>This Month's Income</p>
            <h2>{new Intl.NumberFormat('vi-VN').format(mockData.monthlyIncome)} ₫</h2>
            <small>+12% vs last month</small>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card"><div className="icon-wrapper job"><FaBriefcase size={20} /></div><h3>{mockData.activeJobs}</h3><div className="title">Active Jobs</div><p className="desc">Currently in progress</p></div>
          <div className="stat-card"><div className="icon-wrapper main"><FaWallet size={20} /></div><h3>{formatShortCurrency(mainWallet)}</h3><div className="title">Main Wallet</div><p className="desc">Available to withdraw</p></div>
          <div className="stat-card"><div className="icon-wrapper escrow"><FaShieldAlt size={20} /></div><h3>{formatShortCurrency(escrowWallet)}</h3><div className="title">Escrow Wallet</div><p className="desc">Bond & Guarantee Lock</p></div>
          <div className="stat-card"><div className="icon-wrapper total"><FaCheckSquare size={20} /></div><h3>{mockData.totalCompleted}</h3><div className="title">Total Completed</div><p className="desc">{mockData.completionRate} success rate</p></div>
        </div>

        {/* NỬA DƯỚI: THÔNG TIN VIỆC LÀM & TÁC VỤ */}
        <div className="row g-4 mt-2">
          
          {/* CỘT TRÁI (Công việc đang làm & Việc làm mới) */}
          <div className="col-lg-8 d-flex flex-column gap-4">
            
            {/* Active Job Banner */}
            <div className="active-job-banner">
              <div className="d-flex align-items-center gap-2 mb-2 text-warning fw-bold">
                <span className="live-dot"></span> You have an active job
              </div>
              <div className="d-flex justify-content-between align-items-end">
                <div>
                  <h4 className="text-dark fw-bold mb-1">{activeJobMock.title}</h4>
                  <p className="text-muted mb-0 small">Client: {activeJobMock.client} • {activeJobMock.location}</p>
                </div>
                <div className="text-end">
                  <span className="badge bg-warning text-dark mb-2">{activeJobMock.status}</span>
                  <h4 className="text-danger fw-bold m-0">{activeJobMock.price}</h4>
                  <a href="#" className="small text-decoration-none text-danger fw-bold">View details <FaChevronRight size={10}/></a>
                </div>
              </div>
            </div>

            {/* Job Feed */}
            <div className="job-feed-section shadow-sm">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-bold m-0"><FaBell className="text-danger me-2" /> New Jobs Near You <span className="badge bg-danger rounded-pill">8</span></h6>
                <a href="#" className="small text-danger text-decoration-none fw-bold">View all <FaChevronRight size={10}/></a>
              </div>
              <div className="job-list">
                {newJobsMock.map(job => (
                  <div className="job-card" key={job.id}>
                    <div className="d-flex justify-content-between">
                      <div>
                        <small className="text-muted">{job.category} • {job.distance}</small>
                        <h6 className="fw-bold mt-1 mb-2 text-dark">{job.title}</h6>
                        <small className="text-muted d-flex align-items-center gap-1"><FaMapMarkerAlt className="text-danger"/> {job.location} • {job.time}</small>
                      </div>
                      <div className="text-end d-flex flex-column justify-content-between">
                        <strong className="text-danger">{job.priceRange}</strong>
                        <button className="btn btn-sm text-white fw-bold px-3 mt-2" style={{ backgroundColor: '#ea580c' }}>Apply Now</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CỘT PHẢI (KYC & Quick Actions) */}
          <div className="col-lg-4 d-flex flex-column gap-4">
            
            {/* KYC Status Widget */}
            <div className="kyc-status-widget shadow-sm">
              <h6 className="fw-bold mb-3 text-dark">KYC Status</h6>
              <ul className="status-list">
                <li className="completed"><FaCheckCircle className="icon"/> Level 0: Basic Registration</li>
                <li className="completed"><FaCheckCircle className="icon"/> Level 1: ID Verified</li>
                <li className="completed"><FaCheckCircle className="icon"/> Level 2: Credentials Verified</li>
                <li className="completed"><FaCheckCircle className="icon"/> Level 3: 5 Trial Jobs</li>
              </ul>
              <div className="kyc-final-badge">
                <strong>KYC Fully Verified (Level 3)</strong>
                <small>You currently hold the highest trust badge</small>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions-widget shadow-sm">
              <h6 className="fw-bold mb-3 text-dark">Quick Actions</h6>
              <div className="action-list">
                <div className="action-item">
                  <div className="d-flex align-items-center gap-3"><div className="icon-box bg-primary bg-opacity-10 text-primary"><FaSearchDollar /></div><span className="fw-bold">Find New Jobs</span></div>
                  <FaChevronRight className="text-muted" size={12}/>
                </div>
                <div className="action-item" onClick={() => navigate('/handyman/wallet')} style={{ cursor: 'pointer' }}>
                  <div className="d-flex align-items-center gap-3"><div className="icon-box bg-success bg-opacity-10 text-success"><FaWallet /></div><span className="fw-bold">View Dual Wallet</span></div>
                  <FaChevronRight className="text-muted" size={12}/>
                </div>
                <div className="action-item">
                  <div className="d-flex align-items-center gap-3"><div className="icon-box bg-purple bg-opacity-10" style={{ color: '#6d28d9' }}><FaUser /></div><span className="fw-bold">My Profile</span></div>
                  <FaChevronRight className="text-muted" size={12}/>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="handyman-dashboard">
      {/* Ẩn Stepper nếu đã lên C3 */}
      {currentLevel !== 'C3' && <KycStepper currentLevel={currentLevel} />}

      {/* Chỉ hiện Banner Welcome nếu chưa lên C3 */}
      {currentLevel !== 'C3' && (
        <div className="welcome-banner">
          <h2>Welcome to Trusted Handyman!</h2>
          <p>Complete your onboarding steps to start receiving jobs.</p>
        </div>
      )}

      {/* Tùy theo currentLevel mà render ra giao diện tương ứng */}
      {currentLevel === 'C1' && renderC1VerificationBlock()}
      {currentLevel === 'C2' && renderC2BondingBlock()}
      {currentLevel === 'C3' && renderC3OfficialDashboard()}

      {/* Modal luôn sẵn sàng ẩn/hiện */}
      <HandymanKycModal show={showKycModal} onClose={() => setShowKycModal(false)} onSuccess={fetchLatestProfile} />
    </div>
  );
};

export default HandymanDashboardPage;
