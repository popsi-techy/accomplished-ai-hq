// src/pages/SchedulesPage.js
import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import './SchedulesPage.css'; // Import CSS

const SchedulesPage = () => {
  const { currentUser } = useAuth();
  const [scheduledProjects, setScheduledProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    // Query for projects that have an aiSchedulingDescription, indicating they've been scheduled
    const q = query(
      collection(db, 'projects'),
      where('userId', '==', currentUser.uid),
      where('aiSchedulingDescription', '!=', ''), // Check if AI description exists
      orderBy('aiSchedulingDescription'), // Needed for where condition with !=
      orderBy('lastScheduledAt', 'desc') // Order by latest schedule time
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const projectsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setScheduledProjects(projectsData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching scheduled projects:', err);
        setError('Failed to load scheduled projects. Please try again.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  if (loading) {
    return <div className="schedules-loading">Loading schedules...</div>;
  }

  if (error) {
    return <div className="schedules-error">{error}</div>;
  }

  if (!currentUser) {
    return (
      <div className="schedules-not-logged-in">
        Please sign in to view your schedules.
      </div>
    );
  }

  return (
    <div className="schedules-page-container">
      <h2>Your AI-Generated Schedules</h2>
      {scheduledProjects.length === 0 ? (
        <p className="no-schedules-message">
          No projects have been scheduled by AI yet. Go to a project and click "Schedule with AI"!
        </p>
      ) : (
        <div className="scheduled-projects-list">
          {scheduledProjects.map((project) => (
            <Link to={`/schedules/${project.id}`} key={project.id} className="scheduled-project-card">
              <h3>{project.projectName}</h3>
              <p>
                {project.projectDescription}
              </p>
              {project.lastScheduledAt && (
                <span className="scheduled-card-date">
                  Last Scheduled: {new Date(project.lastScheduledAt.toDate()).toLocaleDateString()}
                </span>
              )}
              <div className="view-schedule-button">View Schedule</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default SchedulesPage;