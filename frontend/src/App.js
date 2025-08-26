import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import './App.css';

// Components
import PublicDashboard from './components/PublicDashboard';
import Teams from './components/Teams';
import Events from './components/Events';
import Winners from './components/Winners';
import Scoreboard from './components/Scoreboard';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Create axios instance with interceptor
const apiClient = axios.create({
  baseURL: API,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('onam_admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('onam_admin_token');
    if (token) {
      setIsAdmin(true);
    }
    setLoading(false);
  }, []);

  const handleAdminLogin = (token) => {
    localStorage.setItem('onam_admin_token', token);
    setIsAdmin(true);
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('onam_admin_token');
    setIsAdmin(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center">
        <div className="text-2xl font-bold text-orange-600">Loading...</div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route 
            path="/" 
            element={
              <PublicDashboard 
                apiClient={apiClient} 
                isAdmin={isAdmin}
                onAdminLogin={handleAdminLogin}
                onAdminLogout={handleAdminLogout}
              />
            } 
          />
          <Route 
            path="/teams" 
            element={
              <Teams 
                apiClient={apiClient} 
                isAdmin={isAdmin}
                onAdminLogout={handleAdminLogout}
              />
            } 
          />
          <Route 
            path="/events" 
            element={
              <Events 
                apiClient={apiClient} 
                isAdmin={isAdmin}
                onAdminLogout={handleAdminLogout}
              />
            } 
          />
          <Route 
            path="/winners" 
            element={
              <Winners 
                apiClient={apiClient} 
                isAdmin={isAdmin}
                onAdminLogout={handleAdminLogout}
              />
            } 
          />
          <Route 
            path="/scoreboard" 
            element={
              <Scoreboard 
                apiClient={apiClient} 
                isAdmin={isAdmin}
                onAdminLogout={handleAdminLogout}
              />
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;