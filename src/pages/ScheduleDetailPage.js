// src/pages/ScheduleDetailPage.js
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, collection, query, orderBy, onSnapshot } from 'firebase/firestore';

import './ScheduleDetailPage.css'; // Import CSS
import './ProjectDetailPage.css'; // Re-use task table styles

const ScheduleDetailPage = () => {
  const { projectId } = useParams();
  const { currentUser } = useAuth();
  const [project, setProject] = useState(null);
  const [scheduledTasks, setScheduledTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!currentUser || !projectId) {
      setLoading(false);
      return;
    }

    const fetchScheduleData = async () => {
      try {
        // Fetch project details (including the AI description)
        const projectDocRef = doc(db, 'projects', projectId);
        const projectDocSnap = await getDoc(projectDocRef);

        if (!projectDocSnap.exists() || projectDocSnap.data().userId !== currentUser.uid) {
          setError('Schedule not found or you do not have permission to view it.');
          setLoading(false);
          return;
        }
        setProject({ id: projectDocSnap.id, ...projectDocSnap.data() });

        // Fetch scheduled tasks for this project
        const tasksColRef = collection(db, 'projects', projectId, 'tasks');
        // Order by scheduledOrder first, then by scheduledStartDate
        const q = query(
          tasksColRef,
          orderBy('scheduledOrder', 'asc'),
          orderBy('scheduledStartDate', 'asc')
        );

        const unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            const tasksData = snapshot.docs
              .map((doc) => ({
                id: doc.id,
                ...doc.data(),
              }))
              .filter((task) => task.scheduledStartDate); // Only show tasks that have been scheduled
            setScheduledTasks(tasksData);
            setLoading(false);
          },
          (err) => {
            console.error('Error fetching scheduled tasks:', err);
            setError('Failed to load scheduled tasks.');
            setLoading(false);
          }
        );

        return () => unsubscribe(); // Clean up listener
      } catch (err) {
        console.error('Error fetching schedule data:', err);
        setError('Failed to load schedule details.');
        setLoading(false);
      }
    };

    fetchScheduleData();
  }, [currentUser, projectId]);

  if (loading) {
    return <div className="schedule-detail-loading">Loading schedule...</div>;
  }

  if (error) {
    return <div className="schedule-detail-error">{error}</div>;
  }

  if (!project || !project.aiSchedulingDescription) {
    return <div className="schedule-detail-not-found">No AI schedule found for this project.</div>;
  }

  return (
    <div className="schedule-detail-container">
      <div className="schedule-header">
        <h2>Schedule for: {project.projectName}</h2>
        <p className="schedule-project-description">{project.projectDescription}</p>
      </div>

      <div className="ai-description-section">
        <h3>AI Scheduling Strategy & Tips</h3>
        <div className="ai-description-content">
          {/* Using dangerouslySetInnerHTML for potential markdown from Gemini, be cautious in production */}
          {/* For basic text, just use {project.aiSchedulingDescription} */}
          <p style={{whiteSpace: 'pre-wrap'}}>{project.aiSchedulingDescription}</p>
        </div>
      </div>

      <div className="scheduled-tasks-section">
        <h3>Optimized Task Schedule ({scheduledTasks.length})</h3>
        {scheduledTasks.length === 0 ? (
          <p className="no-scheduled-tasks-message">No tasks have been scheduled by AI yet for this project.</p>
        ) : (
          <table className="tasks-table"> {/* Reusing styles from ProjectDetailPage */}
            <thead>
              <tr>
                <th>Order</th>
                <th>Task Name</th>
                <th>Duration (hrs)</th>
                <th>Priority</th>
                <th>Dependencies</th>
                <th>Scheduled Start</th>
                <th>Scheduled End</th>
              </tr>
            </thead>
            <tbody>
              {scheduledTasks.map((task) => (
                <tr key={task.id}>
                  <td>{task.scheduledOrder || 'N/A'}</td>
                  <td>{task.taskName}</td>
                  <td>{task.estimatedDuration}</td>
                  <td>{task.priority}</td>
                  <td>{task.dependencies}</td>
                  <td>{task.scheduledStartDate || 'N/A'}</td>
                  <td>{task.scheduledEndDate || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <p className="note">Note: You can modify task order and priority directly in this table. This is currently a frontend-only change; to re-schedule with AI, go back to the project page.</p>
    </div>
  );
};

export default ScheduleDetailPage;