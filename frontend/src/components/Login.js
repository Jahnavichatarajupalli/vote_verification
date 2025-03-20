import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './Login.css';

const Login = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [timer, setTimer] = useState(60);
    const navigate = useNavigate();

    useEffect(() => {
        let interval;
        if (otpSent && timer > 0) {
            interval = setInterval(() => {
                setTimer((prevTimer) => prevTimer - 1);
            }, 1000);
        } else {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [otpSent, timer]);

    const requestOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await axios.post('/api/auth/request-otp', { email });
            setOtpSent(true);
            setTimer(60); // Reset timer
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
            toast.success('Login successful!');
        } catch (err) {
            console.error('OTP verification error:', err);
            setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
            localStorage.clear(); // Clear any partial data
        } finally {
            setLoading(false);
        }
    };

    const handleResendOTP = async () => {
        setOtp('');
        await requestOTP(new Event('submit')); // Trigger OTP request
    };

    return (
        <div className='total'>
        <div className="login-container">
            <div className="login-box">
                <h2>Login to VoteAI</h2>
                {error && <div className="error-message">{error}</div>}
                
                {!otpSent ? (
                    <form onSubmit={requestOTP}>
                        <div className="form-group">
                            <label>Email Address:</label>
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
                        <div className="otp-resend">
                        <p>Time Remaining: {timer}s</p>
                        <button type="button" className="resend-button" onClick={handleResendOTP} disabled={timer > 0}>
                            Resend OTP
                        </button>
                        </div>
                        <button type="submit" className="login-button" disabled={loading}>
                            {loading ? 'Verifying...' : 'Verify OTP'}
                        </button>
                    </form>
                )}
            </div>
        </div>
        </div>
    );
};

export default Login;
