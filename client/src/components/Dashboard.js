import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from './Navbar';
import './Dashboard.css';

const Dashboard = ({ onLogout }) => {
    const navigate = useNavigate();
    const [step, setStep] = useState('epic'); 
    const [voterData, setVoterData] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [epicNo, setEpicNo] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
        }
    }, [navigate]);

    const verifyVoter = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            const res = await axios.post('/api/voters/verify', 
                { epicNo },
                { headers: { 'x-auth-token': token } }
            );
            setVoterData(res.data.voter);
            setLoading(false);
            setStep('face');
        } catch (err) {
            setError(err.response?.data?.message || 'Verification failed');
            setVoterData(null);
            setLoading(false);
        }
    };

    const handleFaceVerification = async () => {
        try {
            // TODO: Implement facial recognition
            setStep('approved');
        } catch (err) {
            setError('Face verification failed. Please try again.');
        }
    };

    const handleReset = () => {
        setStep('epic');
        setVoterData(null);
        setError('');
        setEpicNo('');
    };

    const handleLogout = () => {
        localStorage.clear();
        onLogout();
        navigate('/login');
    };

    return (
        <div className="dashboard-container">
            <Navbar onLogout={handleLogout} />
            
            <div className="verification-container">
                <div className="steps-indicator">
                    <div className={`step ${step === 'epic' ? 'active' : ''} ${step === 'face' || step === 'approved' ? 'completed' : ''}`}>
                        1. EPIC Number Verification
                    </div>
                    <div className={`step ${step === 'face' ? 'active' : ''} ${step === 'approved' ? 'completed' : ''}`}>
                        2. Face Verification
                    </div>
                    <div className={`step ${step === 'approved' ? 'active' : ''}`}>
                        3. Approval
                    </div>
                </div>

                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}

                {step === 'epic' && (
                    <div className="verification-step">
                        <h2>Step 1: EPIC Number Verification</h2>
                        <form onSubmit={verifyVoter}>
                            <div className="form-group">
                                <label>EPIC Number</label>
                                <input
                                    type="text"
                                    value={epicNo}
                                    onChange={(e) => setEpicNo(e.target.value)}
                                    placeholder="Enter EPIC Number"
                                    required
                                />
                            </div>
                            <button 
                                type="submit" 
                                className="verify-button"
                                disabled={loading}
                            >
                                {loading ? 'Verifying...' : 'Verify EPIC'}
                            </button>
                        </form>
                    </div>
                )}

                {step === 'face' && voterData && (
                    <div className="verification-step">
                        <h2>Step 2: Face Verification</h2>
                        <div className="voter-details">
                            <h3>Voter Details</h3>
                            <div className="details-grid">
                                <div className="detail-item">
                                    <label>Name:</label>
                                    <span>{voterData.name}</span>
                                </div>
                                <div className="detail-item">
                                    <label>EPIC No:</label>
                                    <span>{voterData.epicNo}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Age:</label>
                                    <span>{voterData.age}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Gender:</label>
                                    <span>{voterData.gender}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Address:</label>
                                    <span>{voterData.address}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Polling Station:</label>
                                    <span>{voterData.pollingStation}</span>
                                </div>
                            </div>
                            {voterData.photo && (
                                <div className="voter-photo">
                                    <img src={voterData.photo} alt="Voter" />
                                </div>
                            )}
                            <button 
                                onClick={handleFaceVerification}
                                className="verify-button"
                            >
                                Verify Face
                            </button>
                        </div>
                    </div>
                )}

                {step === 'approved' && (
                    <div className="verification-step">
                        <h2>Step 3: Verification Complete</h2>
                        <div className="success-message">
                            Voter verified successfully!
                        </div>
                        <button 
                            onClick={() => window.print()} 
                            className="print-button"
                        >
                            Print Verification Slip
                        </button>
                        <button 
                            onClick={handleReset}
                            className="reset-button"
                        >
                            Verify Another Voter
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
