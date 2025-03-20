import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from './Navbar';
import VotingChart from './Chart';
import './Dashboard.css';
import { loadFaceApiModels, createFaceMatcher, startVideo, stopVideo, verifyFace } from '../utils/faceVerification';
import { validateEpicNumber } from '../utils/epicValidation';
import { VoiceMessages } from '../utils/speechUtils';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Dashboard = ({ onLogout }) => {
    const navigate = useNavigate();
    const [step, setStep] = useState('epic');
    const [voterData, setVoterData] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [epicNo, setEpicNo] = useState('');
    const [faceVerificationStarted, setFaceVerificationStarted] = useState(false);
    const [showChart, setShowChart] = useState(false);
    const videoRef = useRef(null);

    // Remove all speech-related state and functions since we want voice always on
    
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
        }

        // Load face-api models when component mounts
        loadFaceApiModels().catch(err => {
            console.error('Error loading face-api models:', err);
            setError('Failed to load face verification system');
        });

        // Cleanup function to stop video when component unmounts
        return () => {
            stopVideo();
        };
    }, [navigate]);

    const verifyVoter = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);
    
        const validation = validateEpicNumber(epicNo);
        if (!validation.isValid) {
            toast.error(validation.message);
            VoiceMessages.error(validation.message);
            setLoading(false);
            return;
        }
    
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post('/api/voters/verify', 
                { epicNo },
                { headers: { 'x-auth-token': token } }
            );
            setVoterData(res.data.voter);
            setLoading(false);
            setStep('face');
            toast.success('EPIC number verified successfully');
            VoiceMessages.success('EPIC number verified successfully');
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Verification failed';
            setVoterData(null);
            setLoading(false);
            
            if (errorMessage.includes('not found')) {
                toast.error('EPIC number not found');
                VoiceMessages.epicNotFound();
            } else if (errorMessage.includes('polling station')) {
                toast.error('Wrong polling station');
                VoiceMessages.wrongPollingStation();
            } else if (errorMessage.includes('already cast')) {
                toast.error('Voter has already cast their vote');
                VoiceMessages.duplicateVote();
            } else {
                toast.error(errorMessage);
                VoiceMessages.error(errorMessage);
            }
        }
    };

    const startFaceVerification = async () => {
        try {
            setError('');
            setLoading(true);
            setFaceVerificationStarted(true);
    
            await createFaceMatcher(voterData.photo);
            await startVideo(videoRef.current);
            
            const isVerified = await verifyFace(videoRef.current);
            
            if (isVerified) {
                try {
                    const token = localStorage.getItem('token');
                    await axios.post('/api/voters/mark-voted', 
                        { epicNo: voterData.epicNo },
                        { headers: { 'x-auth-token': token } }
                    );
                    
                    setStep('approved');
                    setSuccess('Voter verification successful!');
                } catch (err) {
                    const errorMessage = 'Error updating voter status: ' + (err.response?.data?.message || err.message);
                    toast.error(errorMessage);
                }
            }
            
            stopVideo();
            setFaceVerificationStarted(false);
            setLoading(false);
        } catch (err) {
            const errorMessage = 'Failed to start face verification: ' + err.message;
            toast.error(errorMessage);
            VoiceMessages.error(errorMessage);
            setLoading(false);
            setFaceVerificationStarted(false);
        }
    };

    const handleFaceVerification = async () => {
        try {
            setLoading(true);
            setError('');
            
            // toast.info('Starting face verification process');
            // VoiceMessages.success('Starting face verification process');
            const isMatch = await verifyFace(videoRef.current);
            
            if (isMatch) {
                stopVideo();
                setFaceVerificationStarted(false);
                
                try {
                    const token = localStorage.getItem('token');
                    await axios.post('/api/voters/mark-voted', 
                        { epicNo: voterData.epicNo },
                        { headers: { 'x-auth-token': token } }
                    );
                    
                    setStep('approved');
                    setSuccess('Voter verification successful!');
                    // toast.success('Voter verification successful!');
                    VoiceMessages.verificationSuccess();
                } catch (err) {
                    const errorMessage = 'Error updating voter status: ' + (err.response?.data?.message || err.message);
                    toast.error(errorMessage);
                }
            } else {
                toast.error('Face verification failed. Please try again.');
                VoiceMessages.verificationFailed();
            }
        } catch (err) {
            const errorMessage = 'Face verification error: ' + err.message;
            toast.error(errorMessage);
            VoiceMessages.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyNextVoter = () => {
        // Reset all states
        setVoterData(null);
        setStep('epic');
        setError('');
        setSuccess('');
        setFaceVerificationStarted(false);
        setLoading(false);
        if (videoRef.current && videoRef.current.srcObject) {
            stopVideo();
        }
        
        // Reset EPIC number
        setEpicNo('');
    };

    const handleReset = () => {
        stopVideo();
        setStep('epic');
        setVoterData(null);
        setError('');
        setEpicNo('');
        setFaceVerificationStarted(false);
    };

    const handleLogout = () => {
        stopVideo();
        localStorage.clear();
        onLogout();
        navigate('/login');
    };

    const toggleChart = () => {
        setShowChart(!showChart);
    };

    // Add this new function to handle navigation with chart closing
    const handleNavigation = (path) => {
        if (showChart) {
            setShowChart(false);
        }
        navigate(path);
    };

    // Update Navbar section
    return (
        <div className="dashboard-container">
            <Navbar onLogout={handleLogout} onNavigate={handleNavigation}>
                <div className="navbar-buttons">
                    <button 
                        onClick={toggleChart}
                        className="chart-toggle-button"
                    >
                        {showChart ? 'Hide Progress' : 'Show Progress'}
                    </button>
                </div>
            </Navbar>
            
            <div className="dashboard-content">
                {/* Chart Section */}
                {showChart && (
                    <div className="chart-section">
                        <VotingChart />
                        </div>
                    )}

                {/* Main Verification Section - This will only show when chart is hidden */}
                {!showChart && (
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
                        <div className="voter-card">
                            <div className="voter-info">
                                <h3>Voter Details</h3>
                                <div className="details-grid">
                                    <div className="detail-item"><label>Name:</label> <span>{voterData.name}</span></div>
                                    <div className="detail-item"><label>EPIC No:</label> <span>{voterData.epicNo}</span></div>
                                    <div className="detail-item"><label>Age:</label> <span>{voterData.age}</span></div>
                                    <div className="detail-item"><label>Gender:</label> <span>{voterData.gender}</span></div>
                                    <div className="detail-item"><label>Address:</label> <span>{voterData.address}</span></div>
                                    <div className="detail-item"><label>Polling Station:</label> <span>{voterData.pollingStation}</span></div>
                                </div>
                            </div>
                            {voterData.photo && (
                                <div className="voter-photo">
                                    <img src={voterData.photo} alt="Voter" />
                                </div>
                            )}
                        </div>
                        
                        <div className="face-verification-container">
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                style={{ width: '100%', maxWidth: '800px', height: 'auto', borderRadius: '8px' }}
                            />
                            
                            {!faceVerificationStarted ? (
                                <button 
                                    disabled={loading}
                                    onClick={startFaceVerification} 
                                    className="verify-button"
                                >
                                    Start Face Verification
                                </button>
                            ) : (
                                <button 
                                    onClick={handleFaceVerification} 
                                    className="verify-button"
                                    disabled={loading}
                                >
                                    {loading ? 'Verifying...' : 'Verify Face'}
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {step === 'approved' && (
                    <div className="verification-step">
                        <h2>Step 3: Approval</h2>
                        <div className="approval-message">
                                    <p>{success}</p>
                            <p>The voter can now proceed to cast their vote.</p>
                        </div>
                        <button 
                            className="verify-next-button"
                            onClick={handleVerifyNextVoter}
                        >
                            Verify Next Voter
                        </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
    
};

export default Dashboard;
