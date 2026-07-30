import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { FaCloudUploadAlt, FaTimes, FaShieldAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { submitHandymanKycApi } from '../../../services/handymanKycService';
import '../styles/HandymanKycModal.scss';

// 1. Định nghĩa bộ quy tắc bằng YUP (Validation Schema)
const schema = yup.object().shape({
    cccd_front: yup.mixed().required('ID Front is required'),
    cccd_back: yup.mixed().required('ID Back is required'),
    portrait: yup.mixed().required('Portrait photo is required'),
    cv: yup.mixed().required('CV is required'),
    certificate: yup.mixed().required('Professional Certificate is required'),
});

const HandymanKycModal = ({ show, onClose, onSuccess }) => {
    const [isLoading, setIsLoading] = useState(false);
    
    // State tĩnh chỉ dùng để render UI xem trước (Preview)
    const [previews, setPreviews] = useState({
        cccd_front: null, cccd_back: null, portrait: null, cv: null, certificate: null
    });

    // 2. Khởi tạo react-hook-form
    const { handleSubmit, formState: { errors }, setValue, trigger } = useForm({
        resolver: yupResolver(schema)
    });

    // Xử lý khi người dùng chọn file
    const handleFileChange = (e, fieldName) => {
        const file = e.target.files[0];
        if (file) {
            if (!['image/jpeg', 'image/png'].includes(file.type)) {
                toast.error('Only JPEG and PNG images are supported.');
                return;
            }
            // Giới hạn 5MB
            if (file.size > 5 * 1024 * 1024) {
                toast.error("File size cannot exceed 5MB.");
                return;
            }
            
            // Cập nhật giá trị vào react-hook-form
            setValue(fieldName, file);
            // Kích hoạt thư viện tự động xóa dòng chữ báo lỗi
            trigger(fieldName);

            // Cập nhật UI xem trước
            setPreviews(prev => ({ ...prev, [fieldName]: URL.createObjectURL(file) }));
        }
    };

    // 3. Hàm xử lý gửi API (Chỉ chạy khi Yup đã cho qua hết lỗi)
    const onSubmitForm = async (data) => {
        setIsLoading(true);
        const formData = new FormData();
        
        // Data lúc này chứa 5 file lấy từ react-hook-form
        formData.append("cccd_front", data.cccd_front);
        formData.append("cccd_back", data.cccd_back);
        formData.append("portrait", data.portrait);
        formData.append("cv", data.cv);
        formData.append("certificate", data.certificate);

        try {
            let res = await submitHandymanKycApi(formData);
            if (res && res.EC === 0) {
                toast.success("Professional KYC documents submitted successfully!");
                onSuccess(); // Gọi lại getProfile để load Level
                onClose();
            } else {
                toast.error(res.EM);
            }
        } catch (error) {
            toast.error(error?.EM || "Upload failed. Please try again.");
        }
        setIsLoading(false);
    };

    if (!show) return null;

    return (
        <div className="handyman-kyc-modal">
            <div className="modal-overlay" onClick={onClose}>
                {/* e.stopPropagation() ngăn click ra ngoài bị đóng form khi đang nhập */}
                <div className="modal-content-pro" onClick={(e) => e.stopPropagation()}>
                    
                    {/* HEADER */}
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <div className="d-flex align-items-center gap-2">
                            <FaShieldAlt size={24} color="#ea580c" />
                            <h4 className="fw-bold m-0 text-dark">Professional Identity Verification</h4>
                        </div>
                        <button className="btn btn-light rounded-circle p-2" onClick={onClose}>
                            <FaTimes />
                        </button>
                    </div>
                    
                    <p className="text-muted mb-4 small">
                        To unlock Job Bidding, please submit your legal identity and professional credentials. 
                        Your data is encrypted and securely stored.
                    </p>

                    {/* FORM - Sử dụng handleSubmit của react-hook-form */}
                    <form onSubmit={handleSubmit(onSubmitForm)}>
                        
                        {/* PHẦN 1: ĐỊNH DANH PHÁP LÝ */}
                        <div className="mb-4">
                            <h5 className="section-title">1. Legal Identity</h5>
                            <div className="row g-3">
                                {/* CCCD FRONT */}
                                <div className="col-md-4">
                                    <label className="fw-bold small text-secondary mb-1">ID Card (Front)</label>
                                    <div className={`upload-box ${errors.cccd_front ? 'has-error' : ''}`}>
                                        {previews.cccd_front ? (
                                            <img src={previews.cccd_front} alt="Front" />
                                        ) : (
                                            <>
                                                <FaCloudUploadAlt size={28} className="icon-cam mb-2" />
                                                <div className="small text-muted">Upload Front</div>
                                            </>
                                        )}
                                        {/* Input file bị đè lên trên và làm mờ hoàn toàn */}
                                        <input type="file" accept="image/jpeg,image/png" className="position-absolute top-0 start-0 w-100 h-100 opacity-0"
                                            style={{ cursor: 'pointer' }} 
                                            onChange={(e) => handleFileChange(e, 'cccd_front')} 
                                        />
                                    </div>
                                    {errors.cccd_front && <div className="error-text">{errors.cccd_front.message}</div>}
                                </div>

                                {/* CCCD BACK */}
                                <div className="col-md-4">
                                    <label className="fw-bold small text-secondary mb-1">ID Card (Back)</label>
                                    <div className={`upload-box ${errors.cccd_back ? 'has-error' : ''}`}>
                                        {previews.cccd_back ? (
                                            <img src={previews.cccd_back} alt="Back" />
                                        ) : (
                                            <>
                                                <FaCloudUploadAlt size={28} className="icon-cam mb-2" />
                                                <div className="small text-muted">Upload Back</div>
                                            </>
                                        )}
                                        <input type="file" accept="image/jpeg,image/png" className="position-absolute top-0 start-0 w-100 h-100 opacity-0"
                                            style={{ cursor: 'pointer' }} 
                                            onChange={(e) => handleFileChange(e, 'cccd_back')} 
                                        />
                                    </div>
                                    {errors.cccd_back && <div className="error-text">{errors.cccd_back.message}</div>}
                                </div>

                                {/* PORTRAIT SELFIE */}
                                <div className="col-md-4">
                                    <label className="fw-bold small text-secondary mb-1">Portrait Selfie</label>
                                    <div className={`upload-box ${errors.portrait ? 'has-error' : ''}`}>
                                        {previews.portrait ? (
                                            <img src={previews.portrait} alt="Portrait" style={{ objectFit: 'cover' }} />
                                        ) : (
                                            <>
                                                <FaCloudUploadAlt size={28} className="icon-cam mb-2" />
                                                <div className="small text-muted">Clear Face Photo</div>
                                            </>
                                        )}
                                        <input type="file" accept="image/jpeg,image/png" className="position-absolute top-0 start-0 w-100 h-100 opacity-0"
                                            style={{ cursor: 'pointer' }} 
                                            onChange={(e) => handleFileChange(e, 'portrait')} 
                                        />
                                    </div>
                                    {errors.portrait && <div className="error-text">{errors.portrait.message}</div>}
                                </div>
                            </div>
                        </div>

                        {/* PHẦN 2: HỒ SƠ NGHỀ NGHIỆP */}
                        <div className="mb-4">
                            <h5 className="section-title">2. Professional Credentials</h5>
                            <div className="row g-3">
                                {/* CV */}
                                <div className="col-md-6">
                                    <label className="fw-bold small text-secondary mb-1">Curriculum Vitae (CV)</label>
                                    <div className={`upload-box ${errors.cv ? 'has-error' : ''}`}>
                                        {previews.cv ? (
                                            <div className="doc-preview d-flex flex-column align-items-center justify-content-center bg-light">
                                                <img src={previews.cv} alt="CV"/>
                                                <small className="mt-2 text-success fw-bold">Attached</small>
                                            </div>
                                        ) : (
                                            <>
                                                <FaCloudUploadAlt size={28} className="icon-cam mb-2" />
                                                <div className="small text-muted">Upload CV image</div>
                                            </>
                                        )}
                                        <input type="file" accept="image/jpeg,image/png" className="position-absolute top-0 start-0 w-100 h-100 opacity-0"
                                            style={{ cursor: 'pointer' }} 
                                            onChange={(e) => handleFileChange(e, 'cv')} 
                                        />
                                    </div>
                                    {errors.cv && <div className="error-text">{errors.cv.message}</div>}
                                </div>

                                {/* CERTIFICATE */}
                                <div className="col-md-6">
                                    <label className="fw-bold small text-secondary mb-1">Vocational Certificate</label>
                                    <div className={`upload-box ${errors.certificate ? 'has-error' : ''}`}>
                                        {previews.certificate ? (
                                            <div className="doc-preview d-flex flex-column align-items-center justify-content-center bg-light">
                                                <img src={previews.certificate} alt="Certificate"/>
                                                <small className="mt-2 text-success fw-bold">Attached</small>
                                            </div>
                                        ) : (
                                            <>
                                                <FaCloudUploadAlt size={28} className="icon-cam mb-2" />
                                                <div className="small text-muted">Upload certificate image</div>
                                            </>
                                        )}
                                        <input type="file" accept="image/jpeg,image/png" className="position-absolute top-0 start-0 w-100 h-100 opacity-0"
                                            style={{ cursor: 'pointer' }} 
                                            onChange={(e) => handleFileChange(e, 'certificate')} 
                                        />
                                    </div>
                                    {errors.certificate && <div className="error-text">{errors.certificate.message}</div>}
                                </div>
                            </div>
                        </div>

                        {/* FOOTER BUTTONS */}
                        <div className="d-flex justify-content-end gap-3 mt-4 pt-3 border-top">
                            <button type="button" className="btn btn-light fw-bold px-4" onClick={onClose} disabled={isLoading}>
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary fw-bold px-5" style={{ backgroundColor: '#ea580c', borderColor: '#ea580c' }} disabled={isLoading}>
                                {isLoading ? (
                                    <span><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Uploading...</span>
                                ) : "Submit Profile"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default HandymanKycModal;
