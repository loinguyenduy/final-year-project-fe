import React, { useState, useEffect } from 'react';
import { FaPlus, FaTimes, FaEdit, FaCheck } from 'react-icons/fa';
import { toast } from 'react-toastify';
import {
    getAllServicesApi,
    addHandymanServiceApi,
    removeHandymanServiceApi,
    updateHandymanBioApi
} from '../../../services/profileService';

const getSkillServiceId = (skill) => skill?.service_id || skill?.Service?.id || skill?.id;
const getSkillName = (skill) => skill?.Service?.name || skill?.name || 'Unknown';
const getSkillKey = (skill) => skill?.association_id || skill?.id || skill?.service_id;

const SkillsAndBioCard = ({ services, bio, onRefresh }) => {
    const [allServices, setAllServices] = useState([]);
    const [showAddSelect, setShowAddSelect] = useState(false);
    const [selectedService, setSelectedService] = useState('');
    const [skillLoading, setSkillLoading] = useState(false);
    const [removingId, setRemovingId] = useState(null);

    const [editingBio, setEditingBio] = useState(false);
    const [bioValue, setBioValue] = useState('');
    const [bioLoading, setBioLoading] = useState(false);

    useEffect(() => {
        getAllServicesApi().then(res => {
            if (res && res.EC === 0) setAllServices(res.DT || []);
        }).catch(() => {});
    }, []);

    const addedServiceIds = services.map(getSkillServiceId).filter(Boolean);
    const availableServices = allServices.filter(s => s.is_active && !addedServiceIds.includes(s.id));

    const handleAddService = async () => {
        if (!selectedService) return;
        setSkillLoading(true);
        try {
            const res = await addHandymanServiceApi(selectedService);
            if (res && res.EC === 0) {
                toast.success("Service added.");
                setSelectedService('');
                setShowAddSelect(false);
                await onRefresh();
            } else {
                toast.error(res?.EM || "Failed to add service.");
            }
        } catch (err) {
            toast.error(err?.EM || "An error occurred.");
        }
        setSkillLoading(false);
    };

    const handleRemoveService = async (serviceId) => {
        setRemovingId(serviceId);
        try {
            const res = await removeHandymanServiceApi(serviceId);
            if (res && res.EC === 0) {
                toast.success("Service removed.");
                await onRefresh();
            } else {
                toast.error(res?.EM || "Failed to remove service.");
            }
        } catch (err) {
            toast.error(err?.EM || "An error occurred.");
        }
        setRemovingId(null);
    };

    const handleStartEditBio = () => {
        setBioValue(bio || '');
        setEditingBio(true);
    };

    const handleSaveBio = async () => {
        if (!bioValue.trim()) {
            toast.error("Bio cannot be empty.");
            return;
        }
        setBioLoading(true);
        try {
            const res = await updateHandymanBioApi(bioValue.trim());
            if (res && res.EC === 0) {
                toast.success("Bio updated.");
                setEditingBio(false);
                await onRefresh();
            } else {
                toast.error(res?.EM || "Failed to update bio.");
            }
        } catch (err) {
            toast.error(err?.EM || "An error occurred.");
        }
        setBioLoading(false);
    };

    return (
        <div className="content-card">
            {/* Skills Section */}
            <div className="card-section-header">
                <h6>Expertise & Skills</h6>
                <button
                    className="btn-inline-add"
                    onClick={() => { setShowAddSelect(!showAddSelect); setSelectedService(''); }}
                >
                    <FaPlus className="me-1" />Add Skill
                </button>
            </div>

            <div className="tags-list">
                {services.length === 0 && (
                    <span className="text-muted small">No skills added yet.</span>
                )}
                {services.map(s => {
                    const serviceId = getSkillServiceId(s);
                    return (
                        <span key={getSkillKey(s)} className="tag tag-removable">
                            {getSkillName(s)}
                            <button
                                className="tag-remove-btn"
                                onClick={() => handleRemoveService(serviceId)}
                                disabled={!serviceId || removingId === serviceId}
                                title="Remove"
                            >
                                <FaTimes />
                            </button>
                        </span>
                    );
                })}
            </div>

            {showAddSelect && (
                <div className="add-skill-form">
                    <select
                        className="form-select form-select-sm"
                        value={selectedService}
                        onChange={e => setSelectedService(e.target.value)}
                    >
                        <option value="">-- Select a service to add --</option>
                        {availableServices.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                    <div className="d-flex gap-2 mt-2">
                        <button
                            className="btn btn-sm btn-light border"
                            onClick={() => { setShowAddSelect(false); setSelectedService(''); }}
                        >
                            Cancel
                        </button>
                        <button
                            className="btn-save-sm"
                            onClick={handleAddService}
                            disabled={!selectedService || skillLoading}
                        >
                            {skillLoading ? 'Adding...' : 'Add'}
                        </button>
                    </div>
                </div>
            )}

            <hr className="section-divider" />

            {/* Bio Section */}
            <div className="card-section-header">
                <h6>About Me</h6>
                {!editingBio && (
                    <button className="btn-inline-edit" onClick={handleStartEditBio}>
                        <FaEdit className="me-1" />Edit
                    </button>
                )}
            </div>

            {!editingBio ? (
                <p className="bio-text">
                    {bio || <span className="text-muted">No bio added yet. Tell clients about your experience and what makes you stand out.</span>}
                </p>
            ) : (
                <div className="edit-inline-form">
                    <textarea
                        className="form-control"
                        rows={4}
                        value={bioValue}
                        onChange={e => setBioValue(e.target.value)}
                        placeholder="Describe your experience, specializations, and what makes you stand out..."
                    />
                    <div className="d-flex gap-2 justify-content-end mt-2">
                        <button
                            className="btn btn-sm btn-light border"
                            onClick={() => setEditingBio(false)}
                            disabled={bioLoading}
                        >
                            <FaTimes className="me-1" />Cancel
                        </button>
                        <button
                            className="btn-save-sm"
                            onClick={handleSaveBio}
                            disabled={bioLoading}
                        >
                            <FaCheck className="me-1" />{bioLoading ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SkillsAndBioCard;
