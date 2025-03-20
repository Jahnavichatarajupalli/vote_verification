import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import axios from 'axios';
import './Chart.css';

// Register the required Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

const VotingChart = () => {
    const [votingStats, setVotingStats] = React.useState(null);
    const [statsLoading, setStatsLoading] = React.useState(false);

    // Function to fetch voting statistics
    const fetchVotingStatistics = async () => {
        setStatsLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await axios.get('/api/voters/statistics', {
                headers: { 'x-auth-token': token }
            });
            
            setVotingStats(response.data);
        } catch (err) {
            console.error('Error fetching voting statistics:', err);
        } finally {
            setStatsLoading(false);
        }
    };

    React.useEffect(() => {
        fetchVotingStatistics();
    }, []);

    // Update the chart options to remove the cutout
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    font: {
                        size: 14,
                        weight: '600'
                    },
                    padding: 20,
                    usePointStyle: true,
                    pointStyle: 'circle'
                }
            },
            tooltip: {
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                titleColor: '#2c3e50',
                bodyColor: '#2c3e50',
                titleFont: {
                    size: 16,
                    weight: '600'
                },
                bodyFont: {
                    size: 14
                },
                padding: 12,
                boxPadding: 8,
                borderColor: 'rgba(0,0,0,0.1)',
                borderWidth: 1,
                callbacks: {
                    label: function(context) {
                        const label = context.label || '';
                        const value = context.raw || 0;
                        const total = votingStats ? votingStats.total : 0;
                        const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                        return ` ${label}: ${value} (${percentage}%)`;
                    }
                }
            }
        },
        animation: {
            animateScale: true,
            animateRotate: true,
            duration: 1000
        }
    };

    // Update the chart data colors
    const chartData = votingStats ? {
        labels: ['Voted', 'Not Voted'],
        datasets: [
            {
                data: [votingStats.voted, votingStats.nonVoted],
                backgroundColor: [
                    'rgba(76, 175, 80, 0.9)',  // Solid green
                    'rgba(244, 67, 54, 0.9)'   // Solid red
                ],
                borderColor: [
                    'rgba(255, 255, 255, 1)',  // White border
                    'rgba(255, 255, 255, 1)'
                ],
                borderWidth: 2,
                hoverBackgroundColor: [
                    'rgba(76, 175, 80, 1)',
                    'rgba(244, 67, 54, 1)'
                ],
                hoverBorderColor: [
                    'rgba(255, 255, 255, 1)',
                    'rgba(255, 255, 255, 1)'
                ],
                hoverBorderWidth: 2,
            },
        ],
    } : null;

    return (
        <div className="voting-statistics-section">
            <h2>Voting Progress</h2>
            {statsLoading ? (
                <div className="loading-message">Loading statistics...</div>
            ) : votingStats ? (
                <>
                    <div className="statistics-container">
                        <div className="statistics-info">
                            <div className="stat-item">
                                <span className="stat-label">Total Voters:</span>
                                <span className="stat-value">{votingStats.total}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Voted:</span>
                                <span className="stat-value">{votingStats.voted}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Not Voted:</span>
                                <span className="stat-value">{votingStats.nonVoted}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Polling Station:</span>
                                <span className="stat-value">{votingStats.pollingStation}</span>
                            </div>
                        </div>
                        <div className="chart-container">
                            {chartData && (
                                <Pie data={chartData} options={chartOptions} />
                            )}
                        </div>
                    </div>
                    {/* <button 
                        className="refresh-button"
                        onClick={fetchVotingStatistics}
                        disabled={statsLoading}
                    >
                        <i className="fas fa-sync-alt"></i>
                        {statsLoading ? 'Refreshing...' : 'Refresh Statistics'}
                    </button> */}
                </>
            ) : (
                <div className="error-message">Failed to load voting statistics</div>
            )}
        </div>
    );
};

export default VotingChart; 