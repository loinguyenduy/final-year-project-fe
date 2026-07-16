import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import {
    FaCalendarAlt,
    FaCheckCircle,
    FaCloudUploadAlt,
    FaCrosshairs,
    FaEdit,
    FaLocationArrow,
    FaMapMarkerAlt,
    FaMoneyBillWave,
    FaRedoAlt,
    FaTools,
    FaTrash,
    FaUserCircle
} from 'react-icons/fa';
import {
    geocodeAddressApi,
    getProvincesApi,
    getServicesApi,
    getWardsApi,
    postJobApi,
    reverseGeocodeApi
} from '../../../services/jobService';
import { getUserProfileApi } from '../../../services/profileService';
import LocationPickerMap from '../../../../matchmaking/components/LocationPickerMap';
import { getCurrentBrowserLocation } from '../../../../../core/utils/browserGeolocation';
import '../styles/CreateJob.scss';

const LOCATION_SOURCES = {
    CURRENT_GPS: 'CURRENT_GPS',
    GEOCODED_ADDRESS: 'GEOCODED_ADDRESS',
    PROFILE_ADDRESS: 'PROFILE_ADDRESS',
    MANUAL_MAP_PIN: 'MANUAL_MAP_PIN',
    ADDRESS_ONLY: 'ADDRESS_ONLY'
};

const hasCoordinates = (latitude, longitude) => (
    latitude !== null
    && longitude !== null
    && Number.isFinite(Number(latitude))
    && Number.isFinite(Number(longitude))
);

const CustomerCreateJobPage = () => {
    const navigate = useNavigate();
    const { account } = useSelector((state) => state.identity);
    const isVerified = account?.kyc_status === 'VERIFIED';
    const addressOptionRef = useRef(1);
    const locationRequestRef = useRef(0);
    const imagePreviewsRef = useRef([]);

    const [services, setServices] = useState([]);
    const [provinces, setProvinces] = useState([]);
    const [wards, setWards] = useState([]);
    const [defaultAddress, setDefaultAddress] = useState(null);

    const [selectedService, setSelectedService] = useState('');
    const [description, setDescription] = useState('');
    const [scheduleTime, setScheduleTime] = useState('');
    const [budgetMin, setBudgetMin] = useState('');
    const [budgetMax, setBudgetMax] = useState('');

    const [addressOption, setAddressOption] = useState(1);
    const [detailAddress, setDetailAddress] = useState('');
    const [selectedProvince, setSelectedProvince] = useState('');
    const [selectedWard, setSelectedWard] = useState('');
    const [gpsLat, setGpsLat] = useState(null);
    const [gpsLong, setGpsLong] = useState(null);
    const [gpsAccuracy, setGpsAccuracy] = useState(null);
    const [locationSource, setLocationSource] = useState(null);
    const [locationConfirmed, setLocationConfirmed] = useState(false);
    const [resolvedAddress, setResolvedAddress] = useState('');
    const [locationError, setLocationError] = useState('');
    const [showMap, setShowMap] = useState(false);
    const [isFetchingGps, setIsFetchingGps] = useState(false);
    const [isResolvingLocation, setIsResolvingLocation] = useState(false);

    const [images, setImages] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);
    const [isLoadingServices, setIsLoadingServices] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [servicesRes, provincesRes, profileRes] = await Promise.all([
                    getServicesApi(),
                    getProvincesApi(),
                    getUserProfileApi()
                ]);
                if (servicesRes?.EC === 0) setServices(servicesRes.DT || []);
                if (provincesRes?.EC === 0) setProvinces(provincesRes.DT || []);
                if (profileRes?.EC === 0) {
                    const addresses = profileRes.DT?.User_Addresses || [];
                    setDefaultAddress(addresses.find(item => item.is_default) || null);
                }
            } catch (error) {
                toast.error(error?.EM || 'Failed to load initial data.');
            } finally {
                setIsLoadingServices(false);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (selectedProvince) {
            getWardsApi(selectedProvince)
                .then(res => {
                    if (res?.EC === 0) setWards(res.DT || []);
                })
                .catch(() => {
                    setWards([]);
                    toast.error('Failed to load wards for the selected province.');
                });
        } else {
            setWards([]);
            setSelectedWard('');
        }
    }, [selectedProvince]);

    useEffect(() => {
        if (addressOption !== 2 || !defaultAddress) return;
        if (hasCoordinates(defaultAddress.gps_lat, defaultAddress.gps_long)) {
            setGpsLat(Number(defaultAddress.gps_lat));
            setGpsLong(Number(defaultAddress.gps_long));
            setLocationSource(LOCATION_SOURCES.PROFILE_ADDRESS);
            setResolvedAddress(defaultAddress.full_address || '');
            setShowMap(true);
        }
    }, [addressOption, defaultAddress]);

    useEffect(() => {
        imagePreviewsRef.current = imagePreviews;
    }, [imagePreviews]);

    useEffect(() => () => {
        imagePreviewsRef.current.forEach(preview => URL.revokeObjectURL(preview));
    }, []);

    const clearLocationState = () => {
        locationRequestRef.current += 1;
        setGpsLat(null);
        setGpsLong(null);
        setGpsAccuracy(null);
        setLocationSource(null);
        setLocationConfirmed(false);
        setResolvedAddress('');
        setLocationError('');
        setShowMap(false);
        setIsFetchingGps(false);
        setIsResolvingLocation(false);
    };

    const invalidateAddressLocation = () => {
        if (addressOption !== 1) return;
        clearLocationState();
    };

    const resolveCurrentGpsAddress = async (latitude, longitude, requestId) => {
        setIsResolvingLocation(true);
        try {
            const res = await reverseGeocodeApi(latitude, longitude);
            if (requestId !== locationRequestRef.current || addressOptionRef.current !== 3) return;

            if (res?.EC === 0 && res.DT?.service_address) {
                setResolvedAddress(res.DT.service_address);
                setLocationError('');
            } else {
                setResolvedAddress('');
                setLocationError('GPS was found, but the approximate address could not be loaded. You can still confirm the pin.');
            }
        } catch (error) {
            if (requestId !== locationRequestRef.current || addressOptionRef.current !== 3) return;
            setResolvedAddress('');
            setLocationError(
                error?.EM
                    ? `GPS was found, but the approximate address could not be loaded: ${error.EM}`
                    : 'GPS was found, but the approximate address could not be loaded. You can still confirm the pin.'
            );
        } finally {
            if (requestId === locationRequestRef.current && addressOptionRef.current === 3) {
                setIsResolvingLocation(false);
            }
        }
    };

    const handleGetLocation = async () => {
        if (addressOptionRef.current !== 3) return;

        const requestId = ++locationRequestRef.current;
        setIsFetchingGps(true);
        setLocationError('');
        setLocationConfirmed(false);
        setLocationSource(null);

        try {
            const location = await getCurrentBrowserLocation();
            if (requestId !== locationRequestRef.current || addressOptionRef.current !== 3) return;
            setGpsLat(location.gps_lat);
            setGpsLong(location.gps_long);
            setGpsAccuracy(location.gps_accuracy_meters);
            setLocationSource(LOCATION_SOURCES.CURRENT_GPS);
            setResolvedAddress('');
            setShowMap(true);
            toast.success('Location retrieved. Please verify the pin on the map.');
            void resolveCurrentGpsAddress(location.gps_lat, location.gps_long, requestId);
        } catch (error) {
            if (requestId !== locationRequestRef.current || addressOptionRef.current !== 3) return;
            const message = error?.code === 'GEOLOCATION_PERMISSION_DENIED'
                ? 'Location permission was denied. Retry, choose a pin manually, or use another address option.'
                : error?.code === 'GEOLOCATION_UNSUPPORTED'
                    ? 'Geolocation is not supported by your browser.'
                    : 'Unable to get your location before timeout. Please retry or choose a pin manually.';
            setLocationError(message);
            setShowMap(true);
        } finally {
            if (requestId === locationRequestRef.current && addressOptionRef.current === 3) {
                setIsFetchingGps(false);
            }
        }
    };

    const handleOptionChange = (value) => {
        if (value === addressOption) return;
        addressOptionRef.current = value;
        setAddressOption(value);
        clearLocationState();

        if (value === 2 && !defaultAddress) {
            setLocationError('No default profile address is available. Add one in Profile & KYC or choose another option.');
        }
        if (value === 3) {
            setTimeout(handleGetLocation, 0);
        }
    };

    const handleFindAddress = async () => {
        let payload;
        if (addressOption === 1) {
            if (!detailAddress.trim() || !selectedProvince || !selectedWard) {
                toast.error('Enter the street address, province and ward before searching.');
                return;
            }
            payload = {
                province_code: selectedProvince,
                ward_code: selectedWard,
                detail_address: detailAddress.trim()
            };
        } else if (addressOption === 2 && defaultAddress) {
            payload = {
                province_code: defaultAddress.province_code,
                ward_code: defaultAddress.ward_code,
                detail_address: defaultAddress.detail_address
            };
        } else {
            toast.error('No address is available to find on the map.');
            return;
        }

        const requestId = ++locationRequestRef.current;
        setIsResolvingLocation(true);
        setLocationError('');
        setLocationConfirmed(false);

        try {
            const res = await geocodeAddressApi(payload);
            if (requestId !== locationRequestRef.current) return;
            if (res?.EC !== 0) throw res;

            setGpsLat(Number(res.DT.gps_lat));
            setGpsLong(Number(res.DT.gps_long));
            setLocationSource(LOCATION_SOURCES.GEOCODED_ADDRESS);
            setResolvedAddress(res.DT.provider_address || res.DT.service_address || '');
            setShowMap(true);
        } catch (error) {
            if (requestId !== locationRequestRef.current) return;
            setGpsLat(null);
            setGpsLong(null);
            setLocationSource(null);
            setShowMap(true);
            setLocationError(error?.EM || 'No matching location was found. Try again or choose a pin manually.');
        } finally {
            if (requestId === locationRequestRef.current) setIsResolvingLocation(false);
        }
    };

    const handleMapLocationChange = ({ latitude, longitude }) => {
        locationRequestRef.current += 1;
        setGpsLat(latitude);
        setGpsLong(longitude);
        setLocationSource(LOCATION_SOURCES.MANUAL_MAP_PIN);
        setLocationConfirmed(false);
        setLocationError('');
        setIsResolvingLocation(false);
        setShowMap(true);
        if (addressOption === 3) setResolvedAddress('');
    };

    const handleConfirmLocation = async () => {
        if (!hasCoordinates(gpsLat, gpsLong) || !locationSource) {
            toast.error('Choose a pin on the map before confirming.');
            return;
        }

        if (addressOption !== 3) {
            setLocationConfirmed(true);
            toast.success('Service location confirmed.');
            return;
        }

        const requestId = ++locationRequestRef.current;
        setIsResolvingLocation(true);
        setLocationError('');
        try {
            const res = await reverseGeocodeApi(gpsLat, gpsLong);
            if (requestId !== locationRequestRef.current) return;
            setResolvedAddress(res?.EC === 0 && res.DT?.service_address
                ? res.DT.service_address
                : 'Selected map location');
        } catch {
            if (requestId !== locationRequestRef.current) return;
            setResolvedAddress('Selected map location');
        } finally {
            if (requestId === locationRequestRef.current) {
                setLocationConfirmed(true);
                setIsResolvingLocation(false);
                toast.success('Service location confirmed.');
            }
        }
    };

    const handleUseTextOnly = () => {
        if (![1, 2].includes(addressOption)) return;
        setGpsLat(null);
        setGpsLong(null);
        setLocationSource(LOCATION_SOURCES.ADDRESS_ONLY);
        setLocationConfirmed(false);
        setShowMap(false);
        setLocationError('');
        toast.info('The job will be posted with address text only and will not have a distance.');
    };

    const handleFileChange = (event) => {
        const files = Array.from(event.target.files);
        if (images.length + files.length > 5) {
            toast.warning('You can upload a maximum of 5 images.');
            return;
        }
        for (const file of files) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error(`File ${file.name} is too large. Max size is 5MB.`);
                return;
            }
        }
        setImages(previous => [...previous, ...files]);
        setImagePreviews(previous => [
            ...previous,
            ...files.map(file => URL.createObjectURL(file))
        ]);
    };

    const removeImage = (index) => {
        URL.revokeObjectURL(imagePreviews[index]);
        setImages(previous => previous.filter((_, itemIndex) => itemIndex !== index));
        setImagePreviews(previous => previous.filter((_, itemIndex) => itemIndex !== index));
    };

    const locationReady = locationSource === LOCATION_SOURCES.ADDRESS_ONLY
        || (hasCoordinates(gpsLat, gpsLong) && locationConfirmed);

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!isVerified) {
            toast.error('Your account must be KYC verified to post a job.');
            return;
        }
        if (!selectedService || !description.trim() || !scheduleTime) {
            toast.error('Please fill in all required fields.');
            return;
        }
        if (addressOption === 1 && (!detailAddress.trim() || !selectedProvince || !selectedWard)) {
            toast.error('Please enter detail address, province and ward.');
            return;
        }
        if (addressOption === 2 && !defaultAddress) {
            toast.error('No default profile address is available.');
            return;
        }
        if (!locationReady) {
            toast.error('Confirm the map pin or explicitly continue with address text only.');
            return;
        }

        if (budgetMin && budgetMax) {
            if (Number(budgetMin) < 0) {
                toast.error('Minimum budget cannot be negative.');
                return;
            }
            if (Number(budgetMin) > Number(budgetMax)) {
                toast.error('Minimum budget cannot exceed maximum budget.');
                return;
            }
        }

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('service_id', selectedService);
            formData.append('issue_description', description.trim());
            formData.append('scheduled_at', scheduleTime);
            formData.append('address_option', addressOption);
            formData.append('location_source', locationSource);
            formData.append('location_confirmed', String(locationConfirmed));

            if (budgetMin) formData.append('estimated_budget_min', budgetMin);
            if (budgetMax) formData.append('estimated_budget_max', budgetMax);
            if (addressOption === 1) {
                formData.append('detail_address', detailAddress.trim());
                formData.append('province_code', selectedProvince);
                formData.append('ward_code', selectedWard);
            }
            if (hasCoordinates(gpsLat, gpsLong)) {
                formData.append('gps_lat', String(gpsLat));
                formData.append('gps_long', String(gpsLong));
            }
            images.forEach(file => formData.append('images', file));

            const res = await postJobApi(formData);
            if (res?.EC === 0) {
                if (res.DT?.profile_coordinates_updated) {
                    toast.success('Job posted and your default profile address coordinates were updated.');
                } else {
                    toast.success(res.EM || 'Job posted successfully!');
                }
                navigate('/customer/my-jobs');
            } else {
                toast.error(res?.EM || 'Failed to post job.');
            }
        } catch (error) {
            toast.error(error?.EM || error?.response?.data?.EM || 'Something went wrong while posting the job.');
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
                        Your account status is currently <strong>{account?.kyc_status || 'UNVERIFIED'}</strong>. Complete KYC verification before posting jobs.
                    </div>
                </div>
            )}

            <div className="card shadow-sm border-0 job-post-card form-card">
                <div className="card-header bg-primary text-white p-4">
                    <h4 className="mb-1"><FaTools className="me-2" /> Post a New Job Request</h4>
                    <p className="mb-0 opacity-75">Describe the problem and confirm the exact service location.</p>
                </div>

                <div className="card-body p-4">
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label className="form-label fw-bold mb-2 text-dark">Service Category</label>
                            {isLoadingServices ? (
                                <div className="spinner-border spinner-border-sm ms-3 text-primary" role="status" />
                            ) : (
                                <select
                                    className="form-select form-select-lg shadow-sm"
                                    value={selectedService}
                                    onChange={event => setSelectedService(event.target.value)}
                                    required
                                >
                                    <option value="">-- Choose a Category --</option>
                                    {services.map(service => (
                                        <option key={service.id} value={service.id}>{service.name}</option>
                                    ))}
                                </select>
                            )}
                        </div>

                        <div className="mb-4">
                            <label className="form-label fw-bold mb-2 text-dark">Description of the Issue</label>
                            <textarea
                                className="form-control shadow-sm"
                                rows="4"
                                placeholder="Detail what needs repair, signs of damage, or any specific requirements..."
                                value={description}
                                onChange={event => setDescription(event.target.value)}
                                required
                            />
                        </div>

                        <div className="mb-4">
                            <label className="form-label fw-bold mb-2 text-dark">
                                <FaMoneyBillWave className="me-2 text-success" /> Desired Budget Range (Optional)
                            </label>
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <div className="input-group shadow-sm">
                                        <span className="input-group-text bg-light border-end-0">Min</span>
                                        <input type="number" min="0" step="1000" className="form-control border-start-0" placeholder="e.g. 100000" value={budgetMin} onChange={event => setBudgetMin(event.target.value)} />
                                        <span className="input-group-text bg-light">VND</span>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="input-group shadow-sm">
                                        <span className="input-group-text bg-light border-end-0">Max</span>
                                        <input type="number" min="0" step="1000" className="form-control border-start-0" placeholder="e.g. 500000" value={budgetMax} onChange={event => setBudgetMax(event.target.value)} />
                                        <span className="input-group-text bg-light">VND</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="form-label fw-bold mb-3 text-dark">
                                <FaMapMarkerAlt className="me-2 text-danger" /> Service Address Option
                            </label>

                            <div className="row g-3 mb-3">
                                {[
                                    { value: 1, icon: FaEdit, title: 'Specific Address', subtitle: 'Enter a custom location' },
                                    { value: 2, icon: FaUserCircle, title: 'Profile Address', subtitle: 'Use the default saved address' },
                                    { value: 3, icon: FaLocationArrow, title: 'Current GPS', subtitle: 'Detect and verify GPS' }
                                ].map(option => {
                                    const Icon = option.icon;
                                    const active = addressOption === option.value;
                                    return (
                                        <div className="col-md-4" key={option.value}>
                                            <button
                                                type="button"
                                                className={`card address-option-card h-100 w-100 ${active ? 'border-primary shadow active' : 'border-light bg-light opacity-75'}`}
                                                onClick={() => handleOptionChange(option.value)}
                                            >
                                                <span className="card-body text-center p-3">
                                                    <Icon className={`fs-3 mb-2 ${active ? 'text-primary' : 'text-muted'}`} />
                                                    <span className={`d-block fw-bold ${active ? 'text-primary' : 'text-muted'}`}>{option.title}</span>
                                                    <small className="text-muted">{option.subtitle}</small>
                                                </span>
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="p-4 border rounded shadow-sm bg-white location-section">
                                {addressOption === 1 && (
                                    <div className="row g-3">
                                        <div className="col-12">
                                            <label className="form-label text-muted small mb-1">House Number & Street</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="E.g. 123 Nguyen Van Linh"
                                                value={detailAddress}
                                                onChange={event => {
                                                    setDetailAddress(event.target.value);
                                                    invalidateAddressLocation();
                                                }}
                                                required
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label text-muted small mb-1">Province/City</label>
                                            <select
                                                className="form-select"
                                                value={selectedProvince}
                                                onChange={event => {
                                                    setSelectedProvince(event.target.value);
                                                    setSelectedWard('');
                                                    invalidateAddressLocation();
                                                }}
                                                required
                                            >
                                                <option value="">-- Select Province --</option>
                                                {provinces.map(province => (
                                                    <option key={province.province_code} value={province.province_code}>{province.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label text-muted small mb-1">Ward/Commune</label>
                                            <select
                                                className="form-select"
                                                value={selectedWard}
                                                onChange={event => {
                                                    setSelectedWard(event.target.value);
                                                    invalidateAddressLocation();
                                                }}
                                                disabled={!selectedProvince}
                                                required
                                            >
                                                <option value="">-- Select Ward --</option>
                                                {wards.map(ward => (
                                                    <option key={ward.ward_code} value={ward.ward_code}>{ward.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                )}

                                {addressOption === 2 && (
                                    <div className="profile-address-preview">
                                        <FaUserCircle className="fs-2 text-secondary opacity-50" />
                                        <div>
                                            <strong className="d-block text-dark">Default profile address</strong>
                                            <span className="text-muted">{defaultAddress?.full_address || 'No default address saved.'}</span>
                                        </div>
                                    </div>
                                )}

                                {addressOption === 3 && (
                                    <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap">
                                        <div>
                                            <strong className="d-block text-dark">Current GPS location</strong>
                                            <span className="text-muted small">
                                                {isFetchingGps
                                                    ? 'Requesting high-accuracy location...'
                                                    : 'GPS is only used as the initial pin. You must confirm it.'}
                                            </span>
                                        </div>
                                        <button type="button" className="btn btn-outline-primary btn-sm" onClick={handleGetLocation} disabled={isFetchingGps}>
                                            {isFetchingGps ? <span className="spinner-border spinner-border-sm me-2" /> : <FaRedoAlt className="me-2" />}
                                            Retry GPS
                                        </button>
                                    </div>
                                )}

                                {[1, 2].includes(addressOption) && locationSource !== LOCATION_SOURCES.ADDRESS_ONLY && (
                                    <div className="d-flex gap-2 flex-wrap mt-3">
                                        <button
                                            type="button"
                                            className="btn btn-outline-primary"
                                            onClick={handleFindAddress}
                                            disabled={isResolvingLocation || (addressOption === 2 && !defaultAddress)}
                                        >
                                            {isResolvingLocation ? <span className="spinner-border spinner-border-sm me-2" /> : <FaCrosshairs className="me-2" />}
                                            Find on map
                                        </button>
                                        <button type="button" className="btn btn-outline-secondary" onClick={() => setShowMap(true)}>
                                            Choose pin manually
                                        </button>
                                    </div>
                                )}

                                {locationError && (
                                    <div className="alert alert-warning mt-3 mb-0">
                                        <strong className="d-block">Location could not be resolved</strong>
                                        <span>{locationError}</span>
                                        {[1, 2].includes(addressOption) && (
                                            <div className="mt-2">
                                                <button type="button" className="btn btn-sm btn-outline-dark" onClick={handleUseTextOnly}>
                                                    Continue with address text only
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {locationSource === LOCATION_SOURCES.ADDRESS_ONLY && (
                                    <div className="alert alert-secondary mt-3 mb-0">
                                        This job will be posted without coordinates. It cannot show an accurate distance to handymen.
                                        <button type="button" className="btn btn-link btn-sm" onClick={handleFindAddress}>Try finding the location again</button>
                                    </div>
                                )}

                                {showMap && locationSource !== LOCATION_SOURCES.ADDRESS_ONLY && (
                                    <div className="mt-3">
                                        <LocationPickerMap
                                            latitude={gpsLat}
                                            longitude={gpsLong}
                                            onLocationChange={handleMapLocationChange}
                                        />

                                        {hasCoordinates(gpsLat, gpsLong) && (
                                            <div className="location-summary mt-3">
                                                <div>
                                                    <strong className="d-block">Selected coordinates</strong>
                                                    <span>{Number(gpsLat).toFixed(6)}, {Number(gpsLong).toFixed(6)}</span>
                                                    {gpsAccuracy !== null && (
                                                        <small className="d-block text-muted">GPS accuracy: approximately ±{Math.round(gpsAccuracy)} m</small>
                                                    )}
                                                    {isResolvingLocation && addressOption === 3 && (
                                                        <small className="d-block text-muted mt-1">Resolving approximate address...</small>
                                                    )}
                                                    {resolvedAddress && (
                                                        <small className="d-block text-muted mt-1">
                                                            {addressOption === 3 ? 'Approximate address' : 'Map result'}: {resolvedAddress}
                                                        </small>
                                                    )}
                                                </div>
                                                {locationConfirmed ? (
                                                    <span className="badge bg-success location-confirmed-badge">
                                                        <FaCheckCircle className="me-1" /> Confirmed
                                                    </span>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        className="btn btn-success"
                                                        onClick={handleConfirmLocation}
                                                        disabled={isResolvingLocation}
                                                    >
                                                        {isResolvingLocation && <span className="spinner-border spinner-border-sm me-2" />}
                                                        Confirm location
                                                    </button>
                                                )}
                                            </div>
                                        )}

                                        {addressOption === 2 && hasCoordinates(gpsLat, gpsLong) && !locationConfirmed && (
                                            <div className="alert alert-info profile-coordinate-notice mt-3 mb-0">
                                                <strong className="d-block">This also updates your default profile coordinates.</strong>
                                                Your saved address text, province and ward will not be changed.
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="form-label fw-bold mb-2 text-dark">
                                <FaCalendarAlt className="me-2 text-info" /> Working Appointment Time
                            </label>
                            <input
                                type="datetime-local"
                                className="form-control form-control-lg shadow-sm"
                                value={scheduleTime}
                                onChange={event => setScheduleTime(event.target.value)}
                                onKeyDown={event => event.preventDefault()}
                                required
                            />
                        </div>

                        <div className="mb-5">
                            <label className="form-label fw-bold mb-2 text-dark">Job Status Photos (Max 5 images)</label>
                            <div className="upload-container bg-light border border-dashed rounded p-4 text-center">
                                <label className={`upload-box w-100 ${images.length >= 5 ? 'disabled' : ''}`}>
                                    <input type="file" multiple accept="image/png, image/jpeg, image/jpg" onChange={handleFileChange} disabled={images.length >= 5} />
                                    <FaCloudUploadAlt className="text-primary mb-2" size={48} />
                                    <h6 className="fw-bold text-dark">Click to browse images</h6>
                                    <span className="text-muted small">JPG, PNG format (Max 5MB each)</span>
                                </label>

                                {imagePreviews.length > 0 && (
                                    <div className="d-flex gap-3 flex-wrap justify-content-center mt-4">
                                        {imagePreviews.map((preview, index) => (
                                            <div key={preview} className="position-relative">
                                                <img src={preview} alt={`Preview ${index + 1}`} className="rounded shadow-sm image-preview" />
                                                <button type="button" className="btn btn-sm btn-danger remove-image-button" onClick={() => removeImage(index)}>
                                                    <FaTrash size={10} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary w-100 fw-bold py-3 fs-5 shadow"
                            disabled={isSubmitting || !isVerified || !locationReady}
                        >
                            {isSubmitting
                                ? <><span className="spinner-border spinner-border-sm me-2" />Posting Job...</>
                                : 'Post Job Request'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CustomerCreateJobPage;
