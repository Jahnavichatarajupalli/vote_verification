import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import './VoterList.css';

const VoterListPage = ({ onLogout }) => {
    const { status } = useParams();
    const navigate = useNavigate();
    const [voters, setVoters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchVoters = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`http://localhost:5000/api/voters/${status}`, {
                    headers: {
                        'x-auth-token': token
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch voters');
                }

                const data = await response.json();
                setVoters(data);
            } catch (err) {
                console.error('Error fetching voters:', err);
                setError('Failed to load voters list');
            }
            setLoading(false);
        };

        fetchVoters();
    }, [status]);

    const getTitle = () => {
        switch (status) {
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
        <div className="voter-list-page">
            <Navbar onLogout={onLogout} />
            <div className="voter-list-container">
                <div className="voter-list-header">
                    <h2>{getTitle()}</h2>
                    <button className="back-button" onClick={() => navigate('/dashboard')}>
                        Back to Dashboard
                    </button>
                </div>
                {loading ? (
                    <div className="loading">Loading voters...</div>
                ) : error ? (
                    <div className="error">{error}</div>
                ) : (
                    <div className="voter-list-content">
                        {voters.length === 0 ? (
                            <p className="no-voters">No voters found</p>
                        ) : (
                            <table className="voter-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>EPIC Number</th>
                                        <th>Age</th>
                                        <th>Address</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {voters.map((voter) => (
                                        <tr key={voter.epicNo}>
                                            <td>{voter.name}</td>
                                            <td>{voter.epicNo}</td>
                                            <td>{voter.age}</td>
                                            <td>{voter.address}</td>
                                            <td>
                                                <span className={`status ${voter.hasVoted ? 'voted' : 'not-voted'}`}>
                                                    {voter.hasVoted ? 'Voted' : 'Not Voted'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default VoterListPage;
