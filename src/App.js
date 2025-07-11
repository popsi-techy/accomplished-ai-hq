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
import ProjectDetailPage from './pages/ProjectDetailPage';
import ScheduleDetailPage from './pages/ScheduleDetailPage'; // Ensure this import is correct

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
                    <ProjectDetailPage />
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
              {/* THIS IS THE CRITICAL ROUTE FOR SCHEDULE DETAIL PAGE */}
              <Route
                path="/schedules/:projectId" // Make sure this path EXACTLY matches the link from SchedulesPage.js
                element={
                  <PrivateRoute>
                    <ScheduleDetailPage /> {/* Ensure this component name is correct */}
                  </PrivateRoute>
                }
              />
              <Route path="*" element={<p>Page Not Found</p>} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;