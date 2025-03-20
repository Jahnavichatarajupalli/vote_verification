import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import VoterList from './VoterList';
import './Navbar.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { toast } from 'react-toastify';
// Update the import statement to match the exact file name
import logo from './ICON.jpg';  // Changed from './icon.jpg' to './ICON.jpg'


const Navbar = ({ onLogout, children, onNavigate }) => {
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

                // Update the API endpoint to use the correct URL
                const response = await fetch('http://localhost:5000/api/officers/profile', {
                    headers: {
                        'x-auth-token': token,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    toast.error('Failed to fetch officer details');
                    return;
                }

                const data = await response.json();
                setOfficerDetails(data);
            } catch (err) {
                console.error('Error fetching officer details:', err);
                setOfficerDetails(null);
            }
        };

        // Call fetchOfficerDetails when showProfile changes
        if (showProfile) {
            fetchOfficerDetails();
        }
    }, [navigate, showProfile]);

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

    const handleNavigation = (path) => {
        if (onNavigate) {
            onNavigate(path);
        } else {
            navigate(path);
        }
    };

    const handleStatClick = (type) => {
        handleNavigation(`/voters/${type}`);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        if (onLogout) {
            onLogout();
        }
        toast.success('Logged out successfully');
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
                    <img src={logo} alt="VoteAI Logo" className="navbar-logo" />
                    {/* <h1>VoteAI</h1> */}
                </div>
                <div className="navbar-stats">
                    {error ? (
                        <span className="error">{error}</span>
                    ) : loading ? (
                        <span>Loading statistics...</span>
                    ) : stats ? (
                        <>
                            <div className="state-item">
                                <span className="stats-label colors">Polling Station:</span>
                                <span className="stat-value color">{stats.pollingStation}</span>
                            </div>
                            <div 
                                className={`stats-item total ${location.pathname === '/voters/all' ? 'active' : ''}`} 
                                onClick={() => handleStatClick('all')}
                            >
                                <span className="stats-label">Total Voters</span>
                            </div>
                            <div 
                                className={`stats-item voted ${location.pathname === '/voters/voted' ? 'active' : ''}`} 
                                onClick={() => handleStatClick('voted')}
                            >
                                <span className="stats-label">Voted</span>
                            </div>
                            <div 
                                className={`stats-item non-voted ${location.pathname === '/voters/yet-to-vote' ? 'active' : ''}`} 
                                onClick={() => handleStatClick('yet-to-vote')}
                            >
                                <span className="stats-label">Yet to Vote</span>
                            </div>
                        </>
                    ) : (
                        <span>Loading statistics...</span>
                    )}
                </div>
                {children}

                <div className="navbar-links">
                   <div className="profile-container">
                    <div className="profile">
                       <button 
                           className="profile-icon" 
                           onClick={() => setShowProfile(!showProfile)}
                       >
                           <i className="fas fa-user-circle"></i>
                            </button>
                           
                       </div>
                       {showProfile && officerDetails && (
                           <div className="profile-dropdown">
                               <div className="profile-header">
                                   <h3 style={{color:"black"}}>{officerDetails.name}</h3>
                                   <button 
                                       className="close-profile"
                                       onClick={() => setShowProfile(false)}
                                   >
                                       <i className="fas fa-times"></i>
                                   </button>
                               </div>
                               <div className="profile-details">
                                    <p><strong>Job: </strong>{officerDetails.job}</p>
                                    <p><strong>Email: </strong>{officerDetails.email}</p>
                                    <p><strong>Station: </strong>{officerDetails.pollingStation}</p>
                                    <p><strong>Age: </strong>{officerDetails.age}</p>
                                    <p><strong>Gender: </strong>{officerDetails.gender}</p>
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