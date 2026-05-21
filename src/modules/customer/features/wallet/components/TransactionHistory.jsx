import React from 'react';
import { FaArrowDown, FaArrowUp } from 'react-icons/fa';

const TransactionHistory = () => {
    // Mock Data
    const transactions = [
        {
            id: 'TX-1028',
            title: 'Wallet Deposit',
            date: '20/05/2026 10:15',
            amount: '+500,000₫',
            type: 'in', // 'in' for receive, 'out' for spend/escrow
            status: 'Completed',
            statusColor: 'success' // success, warning
        },
        {
            id: 'TX-1025',
            title: 'Deposit JOB-0041 (10%)',
            date: '20/05/2026 08:30',
            amount: '-85,000₫',
            type: 'out',
            status: 'In Escrow',
            statusColor: 'warning'
        },
        {
            id: 'TX-1022',
            title: 'Payment JOB-0041 (remaining)',
            date: '20/05/2026 09:00',
            amount: '-765,000₫',
            type: 'out',
            status: 'In Escrow',
            statusColor: 'warning'
        },
        {
            id: 'TX-1018',
            title: 'Refund JOB-0039 (cancelled)',
            date: '18/05/2026 14:00',
            amount: '+60,000₫',
            type: 'in',
            status: 'Completed',
            statusColor: 'success'
        },
        {
            id: 'TX-1015',
            title: 'Payment complete JOB-0038',
            date: '17/05/2026 11:00',
            amount: '-320,000₫',
            type: 'out',
            status: 'Completed',
            statusColor: 'success'
        },
        {
            id: 'TX-1010',
            title: 'Wallet Deposit',
            date: '15/05/2026 09:00',
            amount: '+1,000,000₫',
            type: 'in',
            status: 'Completed',
            statusColor: 'success'
        }
    ];

    return (
        <div className="wallet-card history-card">
            <h5 className="fw-bold mb-4">Transaction History</h5>
            
            <div className="transaction-list">
                {transactions.map((tx, idx) => (
                    <div key={idx} className="transaction-item">
                        <div className="d-flex align-items-center">
                            <div className={`tx-icon ${tx.type === 'in' ? 'bg-success-light text-success' : 'bg-danger-light text-danger'}`}>
                                {tx.type === 'in' ? <FaArrowDown /> : <FaArrowUp />}
                            </div>
                            <div className="ms-3">
                                <h6 className="m-0 fw-bold">{tx.title}</h6>
                                <small className="text-muted">{tx.date} • {tx.id}</small>
                            </div>
                        </div>
                        <div className="text-end">
                            <h6 className={`m-0 fw-bold ${tx.type === 'in' ? 'text-success' : 'text-danger'}`}>
                                {tx.amount}
                            </h6>
                            <span className={`status-badge ${tx.statusColor}`}>
                                {tx.status}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="text-center mt-4">
                <button className="btn btn-link text-primary text-decoration-none fw-bold">
                    View all transactions &gt;
                </button>
            </div>
        </div>
    );
};

export default TransactionHistory;
