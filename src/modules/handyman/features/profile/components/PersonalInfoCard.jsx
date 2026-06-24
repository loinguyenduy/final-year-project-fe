import React, { useState, useEffect } from 'react';
import { FaLock, FaEdit, FaCheck, FaTimes } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { updateHandymanAddressApi, getProvincesApi, getWardsByProvinceApi } from '../../../services/profileService';

const PersonalInfoCard = ({ account, addresses, onRefresh }) => {
    const defaultAddress = addresses?.find(a => a.is_default) || addresses?.[0] || null;

    const [editingAddress, setEditingAddress] = useState(false);
    const [provinces, setProvinces] = useState([]);
    const [wards, setWards] = useState([]);
    const [selectedProvince, setSelectedProvince] = useState('');
    const [selectedWard, setSelectedWard] = useState('');
    const [detailAddress, setDetailAddress] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (editingAddress && provinces.length === 0) {
            getProvincesApi().then(res => {
                if (res && res.EC === 0) setProvinces(res.DT || []);
            }).catch(() => {});
        }
    }, [editingAddress]);

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

    const handleStartEdit = () => {
        if (defaultAddress) {
            setSelectedProvince(defaultAddress.province_code || '');
            setDetailAddress(defaultAddress.detail_address || '');
        }
        setEditingAddress(true);
    };

    const handleCancel = () => {
        setEditingAddress(false);
        setSelectedProvince('');
        setSelectedWard('');
        setDetailAddress('');
        setWards([]);
    };

    const handleSave = async () => {
        if (!selectedProvince || !selectedWard || !detailAddress.trim()) {
            toast.error("Please fill in province, ward, and street address.");
            return;
        }
        setLoading(true);
        try {
            const res = await updateHandymanAddressApi({
                province_code: selectedProvince,
                ward_code: selectedWard,
                detail_address: detailAddress.trim()
            });
            if (res && res.EC === 0) {
                toast.success("Address updated successfully.");
                handleCancel();
                await onRefresh();
            } else {
                toast.error(res?.EM || "Failed to update address.");
            }
        } catch (err) {
            toast.error(err?.EM || "An error occurred.");
        }
        setLoading(false);
    };

    const maskPhone = (phone) => {
        if (!phone) return 'Not updated';
        if (phone.length <= 6) return phone;
        return phone.substring(0, 3) + '****' + phone.substring(phone.length - 3);
    };

    return (
        <div className="content-card">
            <h6>Personal Information</h6>

            <div className="info-list">
                <div className="info-row">
                    <span className="info-label">Full Name</span>
                    <span className="info-value">{account?.full_name || '—'}</span>
                </div>
                <div className="info-row">
                    <span className="info-label">Email</span>
                    <span className="info-value">{account?.email || '—'}</span>
                </div>
                <div className="info-row">
                    <span className="info-label">Phone</span>
                    <span className="info-value">
                        <FaLock className="lock-icon me-1" />
                        {maskPhone(account?.phone_number)}
                    </span>
                </div>
                <div className="info-row info-row-address">
                    <span className="info-label">Address</span>
                    <div className="info-value-action">
                        <span className={defaultAddress ? '' : 'text-muted'}>
                            {defaultAddress?.full_address || 'Not set'}
                        </span>
                        {!editingAddress && (
                            <button className="btn-inline-edit" onClick={handleStartEdit}>
                                <FaEdit className="me-1" />Edit
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {editingAddress && (
                <div className="edit-inline-form mt-3">
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
                            <label className="form-label">Ward / Commune</label>
                            <select
                                className="form-select form-select-sm"
                                value={selectedWard}
                                onChange={e => setSelectedWard(e.target.value)}
                                disabled={!selectedProvince}
                            >
                                <option value="">-- Select ward --</option>
                                {wards.map(w => (
                                    <option key={w.ward_code} value={w.ward_code}>{w.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-12">
                            <label className="form-label">Street Address</label>
                            <input
                                type="text"
                                className="form-control form-control-sm"
                                placeholder="House number, street name..."
                                value={detailAddress}
                                onChange={e => setDetailAddress(e.target.value)}
                            />
                        </div>
                        <div className="col-12 d-flex gap-2 justify-content-end">
                            <button className="btn btn-sm btn-light border" onClick={handleCancel} disabled={loading}>
                                <FaTimes className="me-1" />Cancel
                            </button>
                            <button className="btn-save-sm" onClick={handleSave} disabled={loading}>
                                <FaCheck className="me-1" />{loading ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PersonalInfoCard;
