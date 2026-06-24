import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { FaCloudUploadAlt, FaCalendarAlt, FaMapMarkerAlt, FaTools, FaTrash, FaMoneyBillWave, FaEdit, FaUserCircle, FaLocationArrow } from 'react-icons/fa';
import { getServicesApi, postJobApi, getProvincesApi, getWardsApi } from '../../../services/jobService';
import '../styles/CreateJob.scss';

const CustomerCreateJobPage = () => {
    const navigate = useNavigate();
    const { account } = useSelector((state) => state.identity);
    const isVerified = account?.kyc_status === 'VERIFIED';

    const [services, setServices] = useState([]);
    const [provinces, setProvinces] = useState([]);
    const [wards, setWards] = useState([]);

    const [selectedService, setSelectedService] = useState('');
    const [description, setDescription] = useState('');
    const [scheduleTime, setScheduleTime] = useState('');
    const [budgetMin, setBudgetMin] = useState('');
    const [budgetMax, setBudgetMax] = useState('');

    // Address states
    const [addressOption, setAddressOption] = useState(1);
    const [detailAddress, setDetailAddress] = useState('');
    const [selectedProvince, setSelectedProvince] = useState('');
    const [selectedWard, setSelectedWard] = useState('');
    const [gpsLat, setGpsLat] = useState(null);
    const [gpsLong, setGpsLong] = useState(null);
    const [isFetchingGps, setIsFetchingGps] = useState(false);
    const [gpsAddress, setGpsAddress] = useState(''); // Reverse geocoding result

    const [images, setImages] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);
    
    const [isLoadingServices, setIsLoadingServices] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [servicesRes, provincesRes] = await Promise.all([
                    getServicesApi(),
                    getProvincesApi()
                ]);
                if (servicesRes?.EC === 0) setServices(servicesRes.DT);
                if (provincesRes?.EC === 0) setProvinces(provincesRes.DT);
            } catch (error) {
                toast.error("Failed to load initial data.");
            } finally {
                setIsLoadingServices(false);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (selectedProvince) {
            const fetchWards = async () => {
                try {
                    const res = await getWardsApi(selectedProvince);
                    if (res?.EC === 0) setWards(res.DT);
                } catch (e) {
                    console.error("Error fetching wards", e);
                }
            };
            fetchWards();
        } else {
            setWards([]);
            setSelectedWard('');
        }
    }, [selectedProvince]);

    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser");
            return;
        }
        setIsFetchingGps(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                setGpsLat(lat);
                setGpsLong(lon);
                
                // Reverse geocoding
                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
                    const data = await res.json();
                    if (data && data.display_name) {
                        setGpsAddress(data.display_name);
                    } else {
                        setGpsAddress("Unknown address");
                    }
                } catch (err) {
                    console.error("Geocoding failed", err);
                    setGpsAddress("Unable to decode address");
                }
                
                toast.success("Location retrieved successfully!");
                setIsFetchingGps(false);
            },
            (error) => {
                toast.error("Failed to get location. Please allow location access or choose another option.");
                setAddressOption(1);
                setIsFetchingGps(false);
            }
        );
    };

    const handleOptionChange = (val) => {
        setAddressOption(val);
        if (val === 3 && gpsLat === null) {
            handleGetLocation();
        }
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (images.length + files.length > 5) {
            toast.warning("You can upload a maximum of 5 images.");
            return;
        }
        for (let file of files) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error(`File ${file.name} is too large. Max size is 5MB.`);
                return;
            }
        }
        const newImages = [...images, ...files];
        setImages(newImages);
        const newPreviews = files.map(file => URL.createObjectURL(file));
        setImagePreviews([...imagePreviews, ...newPreviews]);
    };

    const removeImage = (index) => {
        const updatedImages = images.filter((update, i) => i !== index);
        const updatedPreviews = imagePreviews.filter((update, i) => i !== index);
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
        if (!selectedService || !description.trim() || !scheduleTime) {
            toast.error("Please fill in all required fields.");
            return;
        }
        
        // Address validation before submitting
        if (addressOption === 1) {
            if (!detailAddress.trim() || !selectedProvince || !selectedWard) {
                toast.error("Please enter detail address, province and ward.");
                return;
            }
        } else if (addressOption === 3) {
            if (!gpsLat || !gpsLong) {
                toast.error("Please wait for location to be detected or choose another address option.");
                return;
            }
        }

        // Budget validation
        if (budgetMin && budgetMax) {
            if (Number(budgetMin) < 0) {
                toast.error("Minimum budget cannot be negative."); return;
            }
            if (Number(budgetMin) > Number(budgetMax)) {
                toast.error("Minimum budget cannot exceed maximum budget."); return;
            }
        }

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('service_id', selectedService);
            formData.append('issue_description', description);
            formData.append('scheduled_at', scheduleTime);
            formData.append('address_option', addressOption);
            
            if (budgetMin) formData.append('estimated_budget_min', budgetMin);
            if (budgetMax) formData.append('estimated_budget_max', budgetMax);

            if (addressOption === 1) {
                formData.append('detail_address', detailAddress);
                formData.append('province_code', selectedProvince);
                formData.append('ward_code', selectedWard);
            } else if (addressOption === 3) {
                formData.append('gps_lat', gpsLat);
                formData.append('gps_long', gpsLong);
            }
            
            images.forEach((file) => formData.append('images', file));

            const res = await postJobApi(formData);
            if (res && res.EC === 0) {
                toast.success(res.EM || "Job posted successfully!");
                navigate('/customer/my-jobs');
            } else {
                toast.error(res.EM || "Failed to post job");
            }
        } catch (error) {
            const errMsg = error?.response?.data?.EM || "Something went wrong while posting the job.";
            toast.error(errMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="create-job-container py-4">
            {!isVerified && (
                <div className="alert alert-warning d-flex align-items-center mb-4 shadow-sm border-warning">
                    <span className="fs-3 me-3">⚠️</span>
                    <div>
                        <strong className="d-block">KYC Verification Required</strong>
                        Your account status is currently <strong>{account?.kyc_status || 'UNVERIFIED'}</strong>. You must complete KYC verification in the Profile & KYC section before you can post jobs.
                    </div>
                </div>
            )}

            <div className="card shadow-sm border-0 job-post-card form-card">
                <div className="card-header bg-primary text-white p-4">
                    <h4 className="mb-1"><FaTools className="me-2" /> Post a New Job Request</h4>
                    <p className="mb-0 opacity-75">Fill in the form to post your problem and find professional handymen</p>
                </div>

                <div className="card-body p-4">
                    <form onSubmit={handleSubmit}>
                        {/* Service Category Selection */}
                        <div className="mb-4">
                            <label className="form-label fw-bold mb-2 text-dark">
                                Service Category
                            </label>
                            {isLoadingServices ? (
                                <div className="spinner-border spinner-border-sm ms-3 text-primary" role="status"></div>
                            ) : (
                                <select 
                                    className="form-select form-select-lg shadow-sm"
                                    value={selectedService}
                                    onChange={(e) => setSelectedService(e.target.value)}
                                    required
                                >
                                    <option value="">-- Choose a Category --</option>
                                    {services.map((srv) => (
                                        <option key={srv.id} value={srv.id}>{srv.name}</option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {/* Detailed Description */}
                        <div className="mb-4">
                            <label className="form-label fw-bold mb-2 text-dark">Description of the Issue</label>
                            <textarea
                                className="form-control shadow-sm"
                                rows="4"
                                placeholder="Detail what needs repair, signs of the damage, or any specific requirements..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                required
                            />
                        </div>

                        {/* Budget Fields */}
                        <div className="mb-4">
                            <label className="form-label fw-bold mb-2 text-dark">
                                <FaMoneyBillWave className="me-2 text-success" /> Desired Budget Range (Optional)
                            </label>
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <div className="input-group shadow-sm">
                                        <span className="input-group-text bg-light border-end-0">Min</span>
                                        <input type="number" min="0" step="1000" className="form-control border-start-0" placeholder="e.g. 100000" value={budgetMin} onChange={e => setBudgetMin(e.target.value)} />
                                        <span className="input-group-text bg-light">VND</span>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="input-group shadow-sm">
                                        <span className="input-group-text bg-light border-end-0">Max</span>
                                        <input type="number" min="0" step="1000" className="form-control border-start-0" placeholder="e.g. 500000" value={budgetMax} onChange={e => setBudgetMax(e.target.value)} />
                                        <span className="input-group-text bg-light">VND</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Address Selection Options */}
                        <div className="mb-4">
                            <label className="form-label fw-bold mb-3 text-dark">
                                <FaMapMarkerAlt className="me-2 text-danger" /> Service Address Option
                            </label>
                            
                            <div className="row g-3 mb-3">
                                <div className="col-md-4">
                                    <div className={`card h-100 cursor-pointer transition-all ${addressOption === 1 ? 'border-primary shadow' : 'border-light bg-light opacity-75'}`}
                                         onClick={() => handleOptionChange(1)} style={{cursor: 'pointer'}}>
                                        <div className="card-body text-center p-3">
                                            <FaEdit className={`fs-3 mb-2 ${addressOption === 1 ? 'text-primary' : 'text-muted'}`} />
                                            <h6 className={`fw-bold ${addressOption === 1 ? 'text-primary' : 'text-muted'}`}>Specific Address</h6>
                                            <small className="text-muted">Enter a custom location</small>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className={`card h-100 cursor-pointer transition-all ${addressOption === 2 ? 'border-primary shadow' : 'border-light bg-light opacity-75'}`}
                                         onClick={() => handleOptionChange(2)} style={{cursor: 'pointer'}}>
                                        <div className="card-body text-center p-3">
                                            <FaUserCircle className={`fs-3 mb-2 ${addressOption === 2 ? 'text-primary' : 'text-muted'}`} />
                                            <h6 className={`fw-bold ${addressOption === 2 ? 'text-primary' : 'text-muted'}`}>Profile Address</h6>
                                            <small className="text-muted">Use default saved address</small>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className={`card h-100 cursor-pointer transition-all ${addressOption === 3 ? 'border-primary shadow' : 'border-light bg-light opacity-75'}`}
                                         onClick={() => handleOptionChange(3)} style={{cursor: 'pointer'}}>
                                        <div className="card-body text-center p-3">
                                            <FaLocationArrow className={`fs-3 mb-2 ${addressOption === 3 ? 'text-primary' : 'text-muted'}`} />
                                            <h6 className={`fw-bold ${addressOption === 3 ? 'text-primary' : 'text-muted'}`}>Current GPS</h6>
                                            <small className="text-muted">Auto-detect via GPS</small>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Address Option Content */}
                            <div className="p-4 border rounded shadow-sm bg-white">
                                {addressOption === 1 && (
                                    <div className="row g-3">
                                        <div className="col-md-12">
                                            <label className="form-label text-muted small mb-1">House Number & Street</label>
                                            <input type="text" className="form-control" placeholder="E.g. 123 Nguyen Van Linh" value={detailAddress} onChange={e => setDetailAddress(e.target.value)} required={addressOption === 1} />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label text-muted small mb-1">Province/City</label>
                                            <select className="form-select" value={selectedProvince} onChange={e => setSelectedProvince(e.target.value)} required={addressOption === 1}>
                                                <option value="">-- Select Province --</option>
                                                {provinces.map(p => <option key={p.province_code} value={p.province_code}>{p.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label text-muted small mb-1">Ward/Commune</label>
                                            <select className="form-select" value={selectedWard} onChange={e => setSelectedWard(e.target.value)} disabled={!selectedProvince} required={addressOption === 1}>
                                                <option value="">-- Select Ward --</option>
                                                {wards.map(w => <option key={w.ward_code} value={w.ward_code}>{w.name}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                )}

                                {addressOption === 2 && (
                                    <div className="text-center py-3 text-muted">
                                        <FaUserCircle className="fs-1 mb-2 text-secondary opacity-50" />
                                        <p className="mb-0">Your default address saved in your profile will be used.</p>
                                    </div>
                                )}

                                {addressOption === 3 && (
                                    <div className="text-center py-3">
                                        {isFetchingGps ? (
                                            <div className="text-muted">
                                                <div className="spinner-border spinner-border-sm me-2 text-primary"></div>
                                                Fetching high-accuracy location...
                                            </div>
                                        ) : gpsLat && gpsLong ? (
                                            <div className="text-success text-start bg-success bg-opacity-10 p-3 rounded border border-success">
                                                <h6 className="fw-bold mb-1"><FaLocationArrow className="me-2" /> Location Acquired!</h6>
                                                <p className="mb-1 text-dark"><strong>Address:</strong> {gpsAddress || 'Loading address...'}</p>
                                                <small className="text-muted">Coordinates: {gpsLat.toFixed(5)}, {gpsLong.toFixed(5)}</small>
                                            </div>
                                        ) : (
                                            <div className="text-danger">
                                                <p className="mb-0">Waiting for location access permission...</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Scheduled Work Time */}
                        <div className="mb-4">
                            <label className="form-label fw-bold mb-2 text-dark">
                                <FaCalendarAlt className="me-2 text-info" /> Working Appointment Time
                            </label>
                            <input
                                type="datetime-local"
                                className="form-control form-control-lg shadow-sm"
                                value={scheduleTime}
                                onChange={(e) => setScheduleTime(e.target.value)}
                                onKeyDown={(e) => e.preventDefault()} 
                                required
                            />
                        </div>

                        {/* Upload Photos */}
                        <div className="mb-5">
                            <label className="form-label fw-bold mb-2 text-dark">Job Status Photos (Max 5 images)</label>
                            <div className="upload-container bg-light border border-dashed rounded p-4 text-center">
                                <label className={`upload-box w-100 ${images.length >= 5 ? 'disabled' : ''}`} style={{cursor: images.length >= 5 ? 'not-allowed' : 'pointer'}}>
                                    <input type="file" multiple accept="image/png, image/jpeg, image/jpg" onChange={handleFileChange} disabled={images.length >= 5} style={{ display: 'none' }} />
                                    <FaCloudUploadAlt className="text-primary mb-2" size={48} />
                                    <h6 className="fw-bold text-dark">Click to browse images</h6>
                                    <span className="text-muted small">JPG, PNG format (Max 5MB each)</span>
                                </label>

                                {imagePreviews.length > 0 && (
                                    <div className="d-flex gap-3 flex-wrap justify-content-center mt-4">
                                        {imagePreviews.map((preview, index) => (
                                            <div key={index} className="position-relative">
                                                <img src={preview} alt={`Preview ${index}`} className="rounded shadow-sm" style={{width: 100, height: 100, objectFit: 'cover'}} />
                                                <button type="button" className="btn btn-sm btn-danger position-absolute top-0 start-100 translate-middle rounded-circle shadow" onClick={(e) => { e.preventDefault(); removeImage(index); }} style={{width: 28, height: 28, padding: 0}}>
                                                    <FaTrash size={10} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary w-100 fw-bold py-3 fs-5 shadow" disabled={isSubmitting || !isVerified || (addressOption === 3 && (!gpsLat || !gpsLong))}>
                            {isSubmitting ? <><span className="spinner-border spinner-border-sm me-2"></span>Posting Job...</> : 'Post Job Request'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CustomerCreateJobPage;
