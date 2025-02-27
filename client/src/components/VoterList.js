import React from 'react';
import './VoterList.css';

const VoterList = ({ voters, title, onClose }) => {
    return (
        <div className="voter-list-modal">
            <div className="voter-list-content">
                <div className="voter-list-header">
                    <h2>{title}</h2>
                    <button className="close-button" onClick={onClose}>&times;</button>
                </div>
                <div className="voter-list-body">
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
            </div>
        </div>
    );
};

export default VoterList;
