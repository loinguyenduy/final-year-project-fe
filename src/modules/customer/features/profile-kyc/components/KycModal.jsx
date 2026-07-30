import React, { useState } from 'react';
import { FaCloudUploadAlt, FaTimes, FaExclamationCircle } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { submitCustomerKycApi } from '../../../services/customerKycService'; 

const KycModal = ({ show, onClose, onSuccess }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [files, setFiles] = useState({ cccd_front: null, cccd_back: null, portrait: null });
    const [previews, setPreviews] = useState({ cccd_front: "", cccd_back: "", portrait: "" });

    const handleFileChange = (e, fieldName) => {
        const file = e.target.files[0];
        if (file) {
            if (!['image/jpeg', 'image/png'].includes(file.type)) {
                toast.error('Only JPEG and PNG images are supported.');
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                toast.error("File size cannot exceed 5MB.");
                return;
            }
            setFiles(prev => ({ ...prev, [fieldName]: file }));
            setPreviews(prev => ({ ...prev, [fieldName]: URL.createObjectURL(file) }));
        }
    };

    if (!show) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!files.cccd_front || !files.cccd_back || !files.portrait) {
            toast.error("Please upload all 3 required images.");
            return;
        }

        setIsLoading(true);
        const formData = new FormData();
        formData.append("cccd_front", files.cccd_front);
        formData.append("cccd_back", files.cccd_back);
        formData.append("portrait", files.portrait);

        try {
            let res = await submitCustomerKycApi(formData);
            if (res && res.EC === 0) {
                toast.success("Identity documents submitted successfully!");
                onSuccess(); // Gọi callback để refresh profile
                onClose();   // Đóng modal
            } else {
                toast.error(res.EM);
            }
        } catch (error) {
            toast.error(error?.EM || "An error occurred.");
        }
        setIsLoading(false);
    };

    return (
        <div className="custom-modal-overlay">
            <div className="custom-modal-content">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h4 className="fw-bold m-0">Identity Verification (KYC)</h4>
                    <button className="btn btn-light border-0 rounded-circle p-2" onClick={onClose}>
                        <FaTimes />
                    </button>
                </div>

                <div className="alert alert-danger d-flex align-items-center gap-2 border-0 bg-opacity-10 text-danger mb-4">
                    <FaExclamationCircle size={20} />
                    <span style={{ fontSize: '14px' }}>Please upload original, clear photos of your National ID. Blurry or cropped images will be rejected.</span>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="row g-4 mb-4">
                        {/* ID Front */}
                        <div className="col-md-6">
                            <label className="fw-bold small text-secondary mb-2">1. ID Card (Front)</label>
                            <div className="upload-box">
                                {previews.cccd_front ? (
                                    <img src={previews.cccd_front} alt="Front" />
                                ) : (
                                    <>
                                        <FaCloudUploadAlt size={32} className="text-muted mb-2" />
                                        <div className="small text-muted">Click or drag image</div>
                                    </>
                                )}
                                <input type="file" accept="image/jpeg,image/png" className="position-absolute top-0 start-0 w-100 h-100 opacity-0" style={{ cursor: 'pointer' }} onChange={(e) => handleFileChange(e, 'cccd_front')} />
                            </div>
                        </div>

                        {/* ID Back */}
                        <div className="col-md-6">
                            <label className="fw-bold small text-secondary mb-2">2. ID Card (Back)</label>
                            <div className="upload-box">
                                {previews.cccd_back ? (
                                    <img src={previews.cccd_back} alt="Back" />
                                ) : (
                                    <>
                                        <FaCloudUploadAlt size={32} className="text-muted mb-2" />
                                        <div className="small text-muted">Click or drag image</div>
                                    </>
                                )}
                                <input type="file" accept="image/jpeg,image/png" className="position-absolute top-0 start-0 w-100 h-100 opacity-0" style={{ cursor: 'pointer' }} onChange={(e) => handleFileChange(e, 'cccd_back')} />
                            </div>
                        </div>

                        {/* Selfie */}
                        <div className="col-12">
                            <label className="fw-bold small text-secondary mb-2">3. Portrait Selfie</label>
                            <div className="upload-box">
                                {previews.portrait ? (
                                    <img src={previews.portrait} alt="Portrait" style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover' }} />
                                ) : (
                                    <>
                                        <FaCloudUploadAlt size={32} className="text-muted mb-2" />
                                        <div className="small text-muted">Upload a clear selfie showing your face</div>
                                    </>
                                )}
                                <input type="file" accept="image/jpeg,image/png" className="position-absolute top-0 start-0 w-100 h-100 opacity-0" style={{ cursor: 'pointer' }} onChange={(e) => handleFileChange(e, 'portrait')} />
                            </div>
                        </div>
                    </div>

                    <div className="d-flex justify-content-end gap-3 mt-4">
                        <button type="button" className="btn btn-light fw-bold px-4" onClick={onClose} disabled={isLoading}>Cancel</button>
                        <button type="submit" className="btn btn-primary fw-bold px-5" disabled={isLoading}>
                            {isLoading ? "Processing..." : "Submit Documents"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default KycModal;
