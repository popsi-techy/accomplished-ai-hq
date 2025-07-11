// src/pages/AuthPage.js
import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './AuthPage.css'; // Import CSS for styling

const AuthPage = () => {
  const { currentUser, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      navigate('/projects'); // Redirect to projects if already logged in
    }
  }, [currentUser, navigate]);

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      // Redirection handled by useEffect
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      // Optionally show an error message to the user
      alert('Failed to sign in with Google. Please try again.');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h2>Sign In to Accomplished.ai</h2>
        <p>Manage your projects and schedules efficiently with AI.</p>
        <button onClick={handleGoogleSignIn} className="google-signin-button">
          <img src="https://upload.wikimedia.org/wikipedia/commons/4/4a/Logo_and_wordmark_of_Google.svg" alt="Google logo" className="google-icon" />
          Sign in with Google
        </button>
      </div>
    </div>
  );
};

export default AuthPage;