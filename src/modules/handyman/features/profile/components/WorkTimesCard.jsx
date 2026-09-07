import React, { useState, useEffect } from 'react';
import { FaCheck } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { updateHandymanWorkTimesApi } from '../../../services/profileService';

const WORK_TIME_OPTIONS = [
    { value: 'MORNING', label: 'Morning', desc: '06:00 - 12:00' },
    { value: 'AFTERNOON', label: 'Afternoon', desc: '12:00 - 18:00' },
    { value: 'EVENING', label: 'Evening', desc: '18:00 - 22:00' },
    { value: 'WEEKEND', label: 'Weekend', desc: 'Sat & Sun' },
];

const WorkTimesCard = ({ workTimes, onRefresh }) => {
    const [selected, setSelected] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setSelected(Array.isArray(workTimes) ? workTimes : []);
    }, [workTimes]);

    const toggle = (value) => {
        setSelected(prev =>
            prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
        );
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const res = await updateHandymanWorkTimesApi(selected);
            if (res && res.EC === 0) {
                toast.success("Work times updated.");
                await onRefresh();
            } else {
                toast.error(res?.EM || "Failed to update work times.");
            }
        } catch (err) {
            toast.error(err?.EM || "An error occurred.");
        }
        setLoading(false);
    };

    return (
        <div className="content-card">
            <h6>Preferred Work Times</h6>

            <div className="work-times-list">
                {WORK_TIME_OPTIONS.map(opt => (
                    <label
                        key={opt.value}
                        className={`work-time-item ${selected.includes(opt.value) ? 'active' : ''}`}
                    >
                        <input
                            type="checkbox"
                            checked={selected.includes(opt.value)}
                            onChange={() => toggle(opt.value)}
                        />
                        <div className="work-time-info">
                            <span className="work-time-label">{opt.label}</span>
                            <span className="work-time-desc">{opt.desc}</span>
                        </div>
                        {selected.includes(opt.value) && (
                            <FaCheck className="work-time-check" />
                        )}
                    </label>
                ))}
            </div>

            <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-2">
                <p className="hint-text mb-0">
                    <span className="hint-icon" aria-hidden="true">💡</span>
                    Leave unchecked to be available at all times.
                </p>
                <button className="btn-save-sm" onClick={handleSave} disabled={loading}>
                    {loading ? 'Saving...' : 'Save Times'}
                </button>
            </div>
        </div>
    );
};

export default WorkTimesCard;
