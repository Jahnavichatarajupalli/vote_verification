import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import './VoterList.css';

const VoterList = ({ onLogout }) => {
    const { type } = useParams();
    const navigate = useNavigate();
    const [voters, setVoters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchVoters = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    navigate('/login');
                    return;
                }

                let endpoint = '/api/voters/all';
                if (type === 'voted') endpoint = '/api/voters/voted';
                if (type === 'yet-to-vote') endpoint = '/api/voters/yet-to-vote';

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
                setError('');
            } catch (err) {
                console.error('Error fetching voters:', err);
                setError(err.message || 'Failed to load voters');
            } finally {
                setLoading(false);
            }
        };

        fetchVoters();
    }, [type, navigate]);

    const getTitle = () => {
        switch (type) {
            case 'voted':
                return 'Voters Who Have Voted';
            case 'yet-to-vote':
                return 'Voters Yet to Vote';
            default:
                return 'All Registered Voters';
        }
    };

    const filteredVoters = voters.filter(voter => 
        voter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        voter.epicNo.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        
        <div className="voter-list-page">
            <Navbar onLogout={onLogout} />
            
            <div className="voter-list-container">
                <div className="voter-list-header">
                    <h2>{getTitle()}</h2>
                    <div className="search-container">
                        <input
                            type="text"
                            placeholder="Search by name or EPIC number..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                    </div>
                    <button className="back-button" onClick={() => navigate('/dashboard')}>
                        Back to Dashboard
                    </button>
                </div>

                {error && <div className="error-message">{error}</div>}
                
                {loading ? (
                    <div className="loading-message">Loading voters...</div>
                ) : filteredVoters.length === 0 ? (
                    <div className="no-voters">No voters found</div>
                ) : (
                    <div className="voters-grid">
                        {filteredVoters.map((voter) => (
                            <div key={voter.epicNo} className="voter-card">
                                <div className="voter-photo">
                                    {voter.photo ? (
                                        <img src={`http://localhost:5000/${voter.photo}`} alt={voter.name} />
                                    ) : (
                                        <div className="photo-placeholder">
                                            {voter.name[0].toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div className="voter-info">
                                    <div className="info-group">
                                        <label>Name</label>
                                        <span>{voter.name}</span>
                                    </div>
                                    <div className="info-group">
                                        <label>EPIC Number</label>
                                        <span>{voter.epicNo}</span>
                                    </div>
                                    <div className="info-group">
                                        <label>Age</label>
                                        <span>{voter.age}</span>
                                    </div>
                                    <div className="info-group">
                                        <label>Gender</label>
                                        <span>{voter.gender}</span>
                                    </div>
                                    <div className="info-group">
                                        <label>Address</label>
                                        <span>{voter.address}</span>
                                    </div>
                                    {type !== 'all' && (
                                        <div className="info-group">
                                            <label>Status</label>
                                            <span className={`status ${voter.hasVoted ? 'voted' : 'not-voted'}`}>
                                                {voter.hasVoted ? 'Voted' : 'Not Voted'}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default VoterList;
