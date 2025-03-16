import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const requestOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await axios.post('/api/auth/request-otp', { email });
            setOtpSent(true);
        } catch (err) {
            console.error('OTP request error:', err);
            setError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const verifyOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await axios.post('/api/auth/verify-otp', { email, otp });
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('officerData', JSON.stringify(res.data.officer));

            // Update auth state and redirect
            onLogin();
            navigate('/dashboard');
        } catch (err) {
            console.error('OTP verification error:', err);
            setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
            localStorage.clear(); // Clear any partial data
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <h2>Login to Voter Verification System</h2>
                {error && <div className="error-message">{error}</div>}
                
                {!otpSent ? (
                    <form onSubmit={requestOTP}>
                        <div className="form-group">
                            <label>Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email"
                                required
                            />
                        </div>
                        <button 
                            type="submit" 
                            className="login-button"
                            disabled={loading}
                        >
                            {loading ? 'Sending OTP...' : 'Get OTP'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={verifyOTP}>
                        <div className="form-group">
                            <label>Enter OTP</label>
                            <input
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                placeholder="Enter 6-digit OTP"
                                pattern="[0-9]{6}"
                                maxLength="6"
                                required
                            />
                        </div>
                        <button 
                            type="submit" 
                            className="login-button"
                            disabled={loading}
                        >
                            {loading ? 'Verifying...' : 'Verify OTP'}
                        </button>
                        <button 
                            type="button" 
                            className="resend-button"
                            onClick={() => setOtpSent(false)}
                        >
                            Back to Email
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default Login;
