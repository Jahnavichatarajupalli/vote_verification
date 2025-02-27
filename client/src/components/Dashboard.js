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

    // Check authentication on mount and when token changes
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
        localStorage.clear(); // Clear all localStorage items
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
                            <button type="submit" disabled={loading}>
                                {loading ? 'Verifying...' : 'Verify Voter'}
                            </button>
                        </form>
                    </div>
                )}

                {step === 'face' && (
                    <div className="verification-step">
                        <h2>Step 2: Face Verification</h2>
                        <div className="voter-info">
                            <h3>Voter Information:</h3>
                            <p><strong>Name:</strong> {voterData.name}</p>
                            <p><strong>EPIC Number:</strong> {voterData.epicNo}</p>
                            <p><strong>Age:</strong> {voterData.age}</p>
                            <p><strong>Address:</strong> {voterData.address}</p>
                            <p><strong>Polling Station:</strong> {voterData.pollingStation}</p>
                        </div>
                        <div className="camera-container">
                            <div className="camera-placeholder">Camera Feed Will Appear Here</div>
                            <button onClick={handleFaceVerification} className="verify-button">
                                Verify Face
                            </button>
                        </div>
                    </div>
                )}

                {step === 'approved' && (
                    <div className="verification-step approved">
                        <h2>Voter Verified Successfully!</h2>
                        <p>The voter has been verified and can proceed to vote.</p>
                        <button onClick={handleReset} className="reset-button">
                            Verify Next Voter
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
