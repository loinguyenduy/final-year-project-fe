import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import axiosInstance from '../../../../../core/api/axiosInstance';
import { doFetchProfileSuccess } from '../../../redux/authAction';

const SocialLinkCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const role = useSelector(state => state.identity.account?.role);

    useEffect(() => {
        const linked = searchParams.get('linked');
        const error = searchParams.get('error');

        const handleCallback = async () => {
            if (error) {
                const errorMsg = decodeURIComponent(error).replace(/_/g, ' ');
                toast.error(`Failed to link account: ${errorMsg}`);
            } else if (linked) {
                try {
                    const res = await axiosInstance.get('/identity/profile');
                    if (res && res.EC === 0) dispatch(doFetchProfileSuccess(res.DT));
                } catch { /* ignore – toast still shows */ }
                const provider = linked.charAt(0).toUpperCase() + linked.slice(1);
                toast.success(`${provider} account linked successfully!`);
            }

            const roleUpper = role?.toUpperCase();
            if (roleUpper === 'HANDYMAN') {
                navigate('/handyman/profile', { replace: true });
            } else if (roleUpper === 'CUSTOMER') {
                navigate('/customer/profile', { replace: true });
            } else {
                navigate('/', { replace: true });
            }
        };

        handleCallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="d-flex justify-content-center align-items-center vh-100">
            <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
            </div>
            <h4 className="ms-3">Processing...</h4>
        </div>
    );
};

export default SocialLinkCallback;
