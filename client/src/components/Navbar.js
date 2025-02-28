import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import VoterList from './VoterList';
import './Navbar.css';
import '@fortawesome/fontawesome-free/css/all.min.css';


const Navbar = ({ onLogout }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [stats, setStats] = useState(null);
    const [error, setError] = useState('');
    const [showVoterList, setShowVoterList] = useState(false);
    const [voterListType, setVoterListType] = useState(null);
    const [voters, setVoters] = useState([]);
    const [loading, setLoading] = useState(false);
    const [officerDetails, setOfficerDetails] = useState(null);
    const [showProfile, setShowProfile] = useState(false);

    useEffect(() => {
        const fetchOfficerDetails = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    navigate('/login');
                    return;
                }

                const response = await fetch('api/auth/officer', {
                    headers: {
                        'x-auth-token': token,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch officer details');
                }

                const data = await response.json();
                setOfficerDetails(data);
            } catch (err) {
                console.error('Error fetching officer details:', err);
            }
        };

        fetchOfficerDetails();
    }, [navigate]);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    navigate('/login');
                    return;
                }

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

    const fetchVoters = async (type) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            let endpoint = '/api/voters/all';
            if (type === 'voted') endpoint = '/api/voters/voted';
            if (type === 'non-voted') endpoint = '/api/voters/yet-to-vote';

            const response = await fetch(`http://localhost:5000${endpoint}`, {
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
            setVoters(data.voters);
            setShowVoterList(true);
            setVoterListType(type);
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
        localStorage.removeItem('token');
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
                                className={`stat-item total ${location.pathname === '/voters/all' ? 'active' : ''}`} 
                                onClick={() => handleStatClick('all')}
                            >
                                <span className="stat-label">Total Voters:</span>
                                <span className="stat-value">{stats.total}</span>
                            </div>
                            <div 
                                className={`stat-item voted ${location.pathname === '/voters/voted' ? 'active' : ''}`} 
                                onClick={() => handleStatClick('voted')}
                            >
                                <span className="stat-label">Voted:</span>
                                <span className="stat-value">{stats.voted}</span>
                            </div>
                            <div 
                                className={`stat-item non-voted ${location.pathname === '/voters/yet-to-vote' ? 'active' : ''}`} 
                                onClick={() => handleStatClick('yet-to-vote')}
                            >
                                <span className="stat-label">Yet to Vote:</span>
                                <span className="stat-value">{stats.nonVoted}</span>
                            </div>
                        </>
                    ) : (
                        <span>Loading statistics...</span>
                    )}
                </div>
                <div className="navbar-links">
                   
                   <div className="profile-container">
                    <div className="profile">

                       <button 
                           className="profile-icon" 
                           onClick={() => setShowProfile(!showProfile)}
                       >
                           <i className="fas fa-user-circle"></i>
                           
                       </button>
                       <p>Profile</p>
                       </div>
                   
                       {showProfile && officerDetails && (
                           <div className="profile-dropdown">
                               <div className="profile-details">
                                   <h3>{officerDetails.name}</h3>
                                   <p>Job: {officerDetails.job}</p>
                                   <p>Phone: {officerDetails.phoneNumber}</p>
                                   <p>Station: {officerDetails.pollingStation}</p>
                                   <p>Age: {officerDetails.age}</p>
                                   <p>Gender: {officerDetails.gender}</p>
                               </div>
                              
                           </div>
                       )}
                   </div>
                  
               </div>
               <button onClick={handleLogout} className="logout-button">
                                   Logout
                               </button>
              
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
