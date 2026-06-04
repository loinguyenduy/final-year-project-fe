import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { FaCloudUploadAlt, FaCalendarAlt, FaMapMarkerAlt, FaTools, FaFileImage, FaTrash } from 'react-icons/fa';
import { getServicesApi, postJobApi } from '../../../services/jobService';
import '../styles/CreateJob.scss';

const CustomerCreateJobPage = () => {
    const navigate = useNavigate();
    const { account } = useSelector((state) => state.identity);
    const isVerified = account?.kyc_status === 'VERIFIED';

    const [services, setServices] = useState([]);
    const [selectedService, setSelectedService] = useState('');
    const [description, setDescription] = useState('');
    const [address, setAddress] = useState('');
    const [scheduleTime, setScheduleTime] = useState('');
    const [images, setImages] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);
    
    const [isLoadingServices, setIsLoadingServices] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchServices = async () => {
            try {
                const res = await getServicesApi();
                if (res && res.EC === 0) {
                    setServices(res.DT);
                } else {
                    toast.error(res.EM || "Failed to load services list");
                }
            } catch (error) {
                console.error(error);
                toast.error("Error loading services list");
            } finally {
                setIsLoadingServices(false);
            }
        };

        fetchServices();
    }, []);

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        
        // Limit check
        if (images.length + files.length > 5) {
            toast.warning("You can upload a maximum of 5 images.");
            return;
        }

        // File size check (max 5MB per file)
        for (let file of files) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error(`File ${file.name} is too large. Max size is 5MB.`);
                return;
            }
        }

        const newImages = [...images, ...files];
        setImages(newImages);

        // Previews
        const newPreviews = files.map(file => URL.createObjectURL(file));
        setImagePreviews([...imagePreviews, ...newPreviews]);
    };

    const removeImage = (index) => {
        const updatedImages = images.filter((_, i) => i !== index);
        const updatedPreviews = imagePreviews.filter((_, i) => i !== index);
        
        // Revoke URL memory
        URL.revokeObjectURL(imagePreviews[index]);

        setImages(updatedImages);
        setImagePreviews(updatedPreviews);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!isVerified) {
            toast.error("Your account must be KYC verified to post a job.");
            return;
        }

        if (!selectedService) {
            toast.error("Please select a service category.");
            return;
        }
        if (!description.trim()) {
            toast.error("Please enter a detailed description of the issue.");
            return;
        }
        if (!address.trim()) {
            toast.error("Please enter a service location.");
            return;
        }
        if (!scheduleTime) {
            toast.error("Please select a scheduled working time.");
            return;
        }

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('service_id', selectedService);
            formData.append('issue_description', description);
            formData.append('service_address', address);
            formData.append('scheduled_at', scheduleTime);
            
            images.forEach((file) => {
                formData.append('images', file);
            });

            const res = await postJobApi(formData);
            if (res && res.EC === 0) {
                toast.success(res.EM || "Job posted successfully!");
                navigate('/customer/my-jobs');
            } else {
                toast.error(res.EM || "Failed to post job");
            }
        } catch (error) {
            console.error(error);
            const errMsg = error?.response?.data?.EM || "Something went wrong while posting the job.";
            toast.error(errMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="create-job-container">
            {/* KYC Alert if not verified */}
            {!isVerified && (
                <div className="kyc-warning-banner mb-4">
                    <span className="warning-icon">⚠️</span>
                    <div className="warning-text">
                        <strong>KYC Verification Required:</strong> Your account status is currently <strong>{account?.kyc_status || 'UNVERIFIED'}</strong>. You must complete KYC verification in the Profile & KYC section before you can post jobs.
                    </div>
                </div>
            )}

            <div className="job-post-card form-card">
                <div className="card-header-custom mb-4">
                    <h4 className="title-text">Post a New Job Request</h4>
                    <p className="subtitle-text">Fill in the form to post your problem and find professional handymen</p>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Service Category Selection */}
                    <div className="form-group mb-4">
                        <label className="form-label fw-bold mb-2">
                            <FaTools className="me-2 text-primary" /> Service Category
                        </label>
                        {isLoadingServices ? (
                            <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
                        ) : (
                            <select 
                                className="form-select"
                                value={selectedService}
                                onChange={(e) => setSelectedService(e.target.value)}
                                required
                            >
                                <option value="">-- Choose a Category --</option>
                                {services.map((srv) => (
                                    <option key={srv.id} value={srv.id}>
                                        {srv.name}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Detailed Description */}
                    <div className="form-group mb-4">
                        <label className="form-label fw-bold mb-2">Description of the Issue</label>
                        <textarea
                            className="form-control"
                            rows="4"
                            placeholder="Detail what needs repair, signs of the damage, or any specific requirements..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                        />
                    </div>

                    {/* Service Location */}
                    <div className="form-group mb-4">
                        <label className="form-label fw-bold mb-2">
                            <FaMapMarkerAlt className="me-2 text-primary" /> Service Address
                        </label>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Enter the full address where the work should take place..."
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            required
                        />
                    </div>

                    {/* Scheduled Work Time */}
                    <div className="form-group mb-4">
                        <label className="form-label fw-bold mb-2">
                            <FaCalendarAlt className="me-2 text-primary" /> Working Appointment Time
                        </label>
                        <input
                            type="datetime-local"
                            className="form-control scheduled-input"
                            value={scheduleTime}
                            onChange={(e) => setScheduleTime(e.target.value)}
                            onKeyDown={(e) => e.preventDefault()} // Chặn nhập tay thủ công
                            required
                        />
                        <small className="text-muted mt-1 d-block">
                            * Please select the date and time using the calendar picker (typing manually is disabled).
                        </small>
                    </div>

                    {/* Upload Photos */}
                    <div className="form-group mb-4">
                        <label className="form-label fw-bold mb-2">
                            Job Status Photos (Max 5 images)
                        </label>
                        <div className="upload-container">
                            <label className={`upload-box ${images.length >= 5 ? 'disabled' : ''}`}>
                                <input
                                    type="file"
                                    multiple
                                    accept="image/png, image/jpeg, image/jpg"
                                    onChange={handleFileChange}
                                    disabled={images.length >= 5}
                                    style={{ display: 'none' }}
                                />
                                <FaCloudUploadAlt className="upload-icon text-muted" size={40} />
                                <span className="upload-text mt-2">Click to upload images</span>
                                <span className="upload-subtext">JPG, PNG format (Max 5MB each)</span>
                            </label>

                            {/* Previews */}
                            {imagePreviews.length > 0 && (
                                <div className="preview-list mt-3">
                                    {imagePreviews.map((preview, index) => (
                                        <div key={index} className="preview-item">
                                            <img src={preview} alt={`Preview ${index}`} className="preview-img" />
                                            <button
                                                type="button"
                                                className="btn-remove-preview"
                                                onClick={() => removeImage(index)}
                                            >
                                                <FaTrash size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Action Button */}
                    <button
                        type="submit"
                        className="btn btn-primary w-100 fw-bold btn-submit-job py-3"
                        disabled={isSubmitting || !isVerified}
                    >
                        {isSubmitting ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                Posting Job...
                            </>
                        ) : 'Post Job Request'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CustomerCreateJobPage;
