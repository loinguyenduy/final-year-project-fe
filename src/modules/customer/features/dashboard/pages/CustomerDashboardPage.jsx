import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getUserProfileApi } from '../../../services/profileService';
import { doFetchProfileSuccess } from '../../../../identity/redux/authAction';
import DashboardOverview from '../components/DashboardOverview';
import { toast } from 'react-toastify';

const CustomerDashboardPage = () => {
    const dispatch = useDispatch();
    const { account } = useSelector((state) => state.identity);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const syncProfile = async () => {
            try {
                let res = await getUserProfileApi();
                if (res && res.EC === 0) {
                    dispatch(doFetchProfileSuccess(res.DT));
                } else {
                    toast.error(res.EM);
                }
            } catch (error) {
                console.log(error);
                toast.error("Cannot sync user profile metrics.");
            }
            setIsLoading(false);
        };
        syncProfile();
    }, [dispatch]);

    // English Mock Data
    const mockMetrics = {
        activeJobs: 2,
        warrantyJobs: 1,
        completedJobs: 17,
        trustRate: "94%",
        trustScoreStars: 4.2
    };

    const mockRecentJobs = [
        { id: 'JOB-0042', title: 'AC not cooling', handyman: 'Le Van Tung', time: 'Today 14:30', price: 850000, status: 'In Progress', statusClass: 'warning' },
        { id: 'JOB-0041', title: 'Kitchen sink leaking', handyman: 'Pham Duc Hung', time: '3 days ago', price: 320000, status: 'In Warranty', statusClass: 'info' },
        { id: 'JOB-0039', title: 'Burnt electrical outlet', handyman: 'Nguyen The Manh', time: '8 days ago', price: 450000, status: 'Completed', statusClass: 'success' },
    ];

    const mockNotifications = [
        { text: 'Handyman Le Van Tung has started the job', time: '5 mins ago', type: 'info' },
        { text: 'Job JOB-0038 has passed the warranty period', time: '2 hours ago', type: 'success' },
        { text: 'Remember to rate handyman Pham Duc Hung (5 days left)', time: 'Yesterday', type: 'warning' },
    ];

    if (isLoading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
                <div className="spinner-border text-primary" role="status"></div>
            </div>
        );
    }

    return (
        <DashboardOverview 
            account={account}
            metrics={mockMetrics}
            recentJobs={mockRecentJobs}
            notifications={mockNotifications}
        />
    );
};

export default CustomerDashboardPage;