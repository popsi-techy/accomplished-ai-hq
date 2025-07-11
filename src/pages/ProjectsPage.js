// src/pages/ProjectsPage.js
import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import './ProjectsPage.css'; // Import CSS

const ProjectsPage = () => {
  const { currentUser } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'projects'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const projectsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProjects(projectsData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching projects:', err);
        setError('Failed to load projects. Please try again.');
        setLoading(false);
      }
    );

    return () => unsubscribe(); // Cleanup subscription on unmount
  }, [currentUser]);

  if (loading) {
    return <div className="projects-loading">Loading projects...</div>;
  }

  if (error) {
    return <div className="projects-error">{error}</div>;
  }

  if (!currentUser) {
    return (
      <div className="projects-not-logged-in">
        Please sign in to view your projects.
      </div>
    );
  }

  return (
    <div className="projects-page-container">
      <h2>Your Projects</h2>
      {projects.length === 0 ? (
        <p className="no-projects-message">
          You don't have any projects yet. Click "Schedule tasks using AI" on the homepage to create one!
        </p>
      ) : (
        <div className="projects-list">
          {projects.map((project) => (
            <Link to={`/projects/${project.id}`} key={project.id} className="project-card">
              <h3>{project.projectName}</h3>
              <p>{project.projectDescription}</p>
              <span className="project-card-date">
                Created: {new Date(project.createdAt.toDate()).toLocaleDateString()}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;