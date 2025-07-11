// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';

import TopBar from './components/TopBar';
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import ProjectsPage from './pages/ProjectsPage';
import SchedulesPage from './pages/SchedulesPage';

// Import global CSS or create one
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="app-container">
          <TopBar />
          <main className="app-main-content">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route
                path="/projects"
                element={
                  <PrivateRoute>
                    <ProjectsPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/projects/:projectId"
                element={
                  <PrivateRoute>
                    {/* Placeholder: This will be the detailed project view later */}
                    <p>Project Detail Page Coming Soon!</p>
                  </PrivateRoute>
                }
              />
              <Route
                path="/schedules"
                element={
                  <PrivateRoute>
                    <SchedulesPage />
                  </PrivateRoute>
                }
              />
              {/* Add a catch-all for 404 or redirect */}
              <Route path="*" element={<p>Page Not Found</p>} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;