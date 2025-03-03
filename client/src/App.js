import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SettingsProvider } from './context/SettingsContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import VoterList from './components/VoterList';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('officerData');
    setIsAuthenticated(false);
  };

  return (
    <SettingsProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={
              !isAuthenticated ? (
                <Login onLogin={handleLogin} />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            } />
            
            <Route path="/dashboard" element={
              isAuthenticated ? (
                <Dashboard onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" replace />
              )
            } />

            <Route path="/voters/:type" element={
              isAuthenticated ? (
                <VoterList onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" replace />
              )
            } />

            <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
          </Routes>
        </div>
      </Router>
    </SettingsProvider>
  );
}

export default App;
