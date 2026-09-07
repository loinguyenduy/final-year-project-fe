import React, { useState, useEffect } from 'react';
import { FaMapMarkerAlt, FaPlus, FaTimes } from 'react-icons/fa';
import { toast } from 'react-toastify';
import {
    getProvincesApi,
    getWardsByProvinceApi,
    addHandymanServiceAreaApi,
    removeHandymanServiceAreaApi
} from '../../../services/profileService';

const ServiceAreasCard = ({ areas, onRefresh }) => {
    const [provinces, setProvinces] = useState([]);
    const [wards, setWards] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [selectedProvince, setSelectedProvince] = useState('');
    const [selectedWard, setSelectedWard] = useState('');
    const [areaLoading, setAreaLoading] = useState(false);
    const [removingId, setRemovingId] = useState(null);

    useEffect(() => {
        getProvincesApi().then(res => {
            if (res && res.EC === 0) setProvinces(res.DT || []);
        }).catch(() => {});
    }, []);

    useEffect(() => {
        if (selectedProvince) {
            setSelectedWard('');
            setWards([]);
            getWardsByProvinceApi(selectedProvince).then(res => {
                if (res && res.EC === 0) setWards(res.DT || []);
            }).catch(() => {});
        } else {
            setWards([]);
            setSelectedWard('');
        }
    }, [selectedProvince]);

    const handleAdd = async () => {
        if (!selectedProvince) {
            toast.error("Please select a province.");
            return;
        }
        setAreaLoading(true);
        try {
            const res = await addHandymanServiceAreaApi(selectedProvince, selectedWard || null);
            if (res && res.EC === 0) {
                toast.success("Service area added.");
                setSelectedProvince('');
                setSelectedWard('');
                setShowAddForm(false);
                await onRefresh();
            } else {
                toast.error(res?.EM || "Failed to add area.");
            }
        } catch (err) {
            toast.error(err?.EM || "An error occurred.");
        }
        setAreaLoading(false);
    };

    const handleRemove = async (areaId) => {
        setRemovingId(areaId);
        try {
            const res = await removeHandymanServiceAreaApi(areaId);
            if (res && res.EC === 0) {
                toast.success("Area removed.");
                await onRefresh();
            } else {
                toast.error(res?.EM || "Failed to remove area.");
            }
        } catch (err) {
            toast.error(err?.EM || "An error occurred.");
        }
        setRemovingId(null);
    };

    const handleCancelAdd = () => {
        setShowAddForm(false);
        setSelectedProvince('');
        setSelectedWard('');
    };

    const formatAreaLabel = (area) => {
        if (area.Ward?.name) {
            return `${area.Ward.name} • ${area.Province?.short_name || area.Province?.name || ''}`;
        }
        return `${area.Province?.name || area.province_code} (Whole city)`;
    };

    return (
        <div className="content-card">
            <div className="card-section-header">
                <div className="d-flex align-items-center gap-2">
                    <h6 className="mb-0">Service Areas</h6>
                    {areas.length > 0 && (
                        <span className="count-badge">{areas.length}</span>
                    )}
                </div>
                <button
                    className="btn-inline-add"
                    onClick={() => { setShowAddForm(!showAddForm); if (showAddForm) handleCancelAdd(); }}
                >
                    <FaPlus className="me-1" />Add Area
                </button>
            </div>

            <div className="tags-list mt-2">
                {areas.length === 0 && !showAddForm && (
                    <span className="text-muted small">No areas set — you will receive jobs from all locations.</span>
                )}
                {areas.map(area => (
                    <span key={area.id} className="tag tag-removable tag-area">
                        <FaMapMarkerAlt className="me-1 tag-icon" />
                        {formatAreaLabel(area)}
                        <button
                            className="tag-remove-btn"
                            onClick={() => handleRemove(area.id)}
                            disabled={removingId === area.id}
                            title="Remove area"
                        >
                            <FaTimes />
                        </button>
                    </span>
                ))}
            </div>

            {showAddForm && (
                <div className="add-area-form mt-3">
                    <div className="row g-3">
                        <div className="col-sm-6">
                            <label className="form-label">Province / City</label>
                            <select
                                className="form-select form-select-sm"
                                value={selectedProvince}
                                onChange={e => setSelectedProvince(e.target.value)}
                            >
                                <option value="">-- Select province --</option>
                                {provinces.map(p => (
                                    <option key={p.province_code} value={p.province_code}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-sm-6">
                            <label className="form-label">
                                Ward / Commune
                                <span className="text-muted ms-1" style={{ fontWeight: 400 }}>(optional)</span>
                            </label>
                            <select
                                className="form-select form-select-sm"
                                value={selectedWard}
                                onChange={e => setSelectedWard(e.target.value)}
                                disabled={!selectedProvince}
                            >
                                <option value="">-- Whole city --</option>
                                {wards.map(w => (
                                    <option key={w.ward_code} value={w.ward_code}>{w.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-12 d-flex gap-2 justify-content-end">
                            <button className="btn btn-sm btn-light border" onClick={handleCancelAdd}>
                                Cancel
                            </button>
                            <button
                                className="btn-save-sm"
                                onClick={handleAdd}
                                disabled={!selectedProvince || areaLoading}
                            >
                                {areaLoading ? 'Adding...' : 'Add Area'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <p className="hint-text mt-3 mb-0">
                <span className="hint-icon">💡</span>
                {areas.length === 0
                    ? 'Leave empty to receive job notifications from all areas.'
                    : 'Only jobs matching the selected service areas will be shown.'}
            </p>
        </div>
    );
};

export default ServiceAreasCard;
