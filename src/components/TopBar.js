// src/components/TopBar.js
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './TopBar.css'; // Import CSS for styling

const TopBar = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth'); // Redirect to auth page after logout
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  return (
    <nav className="topbar">
      <div className="topbar-left">
        <Link to="/" className="topbar-logo">
          Accomplished.ai
        </Link>
      </div>
      <div className="topbar-center">
        {currentUser && (
          <>
            <Link to="/projects" className="topbar-link">
              Projects
            </Link>
            <Link to="/schedules" className="topbar-link">
              Schedules
            </Link>
            {/* Tasks will be shown within Projects for now as per discussion */}
          </>
        )}
      </div>
      <div className="topbar-right">
        {currentUser ? (
          <div className="user-info">
            {currentUser.photoURL && (
              <img
                src={currentUser.photoURL}
                alt="User Avatar"
                className="user-avatar"
              />
            )}
            <span className="user-display-name">
              {currentUser.displayName || currentUser.email}
            </span>
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </div>
        ) : (
          <Link to="/auth" className="topbar-link">
            Sign In
          </Link>
        )}
      </div>
    </nav>
  );
};

export default TopBar;