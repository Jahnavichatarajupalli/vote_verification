import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import VoterList from './VoterList';
import './Navbar.css';

const Navbar = ({ onLogout }) => {
    const navigate = useNavigate();
    const { status } = useParams();
    const [stats, setStats] = useState(null);
    const [error, setError] = useState('');
    const [showVoterList, setShowVoterList] = useState(false);
    const [voterListType, setVoterListType] = useState(null);
    const [voters, setVoters] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    navigate('/login');
                    return;
                }

                console.log('Fetching stats with token:', token);
                const response = await fetch('http://localhost:5000/api/voters/statistics', {
                    headers: {
                        'x-auth-token': token,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to fetch statistics');
                }

                const data = await response.json();
                console.log('Received stats:', data);
                setStats(data);
                setError('');
            } catch (err) {
                console.error('Error fetching stats:', err);
                if (err.message.includes('token')) {
                    navigate('/login');
                } else {
                    setError(err.message || 'Failed to load statistics');
                    setStats(null);
                }
            }
        };

        fetchStats();

        const interval = setInterval(fetchStats, 30000);
        return () => clearInterval(interval);
    }, [navigate]);

    const fetchVoters = async (status) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const response = await fetch(`http://localhost:5000/api/voters/${status}`, {
                headers: {
                    'x-auth-token': token,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch voters');
            }

            const data = await response.json();
            setVoters(data);
            setShowVoterList(true);
            setVoterListType(status);
            setError('');
        } catch (err) {
            console.error('Error fetching voters:', err);
            if (err.message.includes('token')) {
                navigate('/login');
            } else {
                setError(err.message || 'Failed to load voters list');
                setVoters([]);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleStatClick = (type) => {
        navigate(`/voters/${type}`);
    };

    const handleLogout = () => {
        localStorage.clear(); // Clear all localStorage items
        if (onLogout) {
            onLogout();
        }
        navigate('/login');
    };

    const getVoterListTitle = () => {
        switch (voterListType) {
            case 'voted':
                return 'Voters Who Have Voted';
            case 'non-voted':
                return 'Voters Yet to Vote';
            case 'all':
                return 'All Registered Voters';
            default:
                return 'Voter List';
        }
    };

    return (
        <>
            <nav className="navbar">
                <div className="navbar-brand">
                    <h1>Voter Verification System</h1>
                </div>
                <div className="navbar-stats">
                    {error ? (
                        <span className="error">{error}</span>
                    ) : loading ? (
                        <span>Loading statistics...</span>
                    ) : stats ? (
                        <>
                            <div className="stat-item">
                                <span className="stat-label">Polling Station:</span>
                                <span className="stat-value">{stats.pollingStation}</span>
                            </div>
                            <div 
                                className={`stat-item total ${status === 'all' ? 'active' : ''}`} 
                                onClick={() => handleStatClick('all')}
                            >
                                <span className="stat-label">Total Voters:</span>
                                <span className="stat-value">{stats.total}</span>
                            </div>
                            <div 
                                className={`stat-item voted ${status === 'voted' ? 'active' : ''}`} 
                                onClick={() => handleStatClick('voted')}
                            >
                                <span className="stat-label">Voted:</span>
                                <span className="stat-value">{stats.voted}</span>
                            </div>
                            <div 
                                className={`stat-item non-voted ${status === 'non-voted' ? 'active' : ''}`} 
                                onClick={() => handleStatClick('non-voted')}
                            >
                                <span className="stat-label">Yet to Vote:</span>
                                <span className="stat-value">{stats.nonVoted}</span>
                            </div>
                        </>
                    ) : (
                        <span>Loading statistics...</span>
                    )}
                </div>
                <div className="navbar-actions">
                    <button className="logout-button" onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </nav>

            {showVoterList && (
                <VoterList
                    voters={voters}
                    title={getVoterListTitle()}
                    onClose={() => setShowVoterList(false)}
                />
            )}
        </>
    );
};

export default Navbar;
