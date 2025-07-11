// src/components/ProjectFormModal.js
import React, { useState } from 'react';
import './ProjectFormModal.css'; // Import CSS for styling

const ProjectFormModal = ({ onClose, onSubmit }) => {
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (projectName.trim() && projectDescription.trim()) {
      onSubmit(projectName, projectDescription);
    } else {
      alert('Please fill in both project name and description.');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Create New Project</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="projectName">Project Name:</label>
            <input
              type="text"
              id="projectName"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="projectDescription">Project Description:</label>
            <textarea
              id="projectDescription"
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              rows="5"
              required
            ></textarea>
          </div>
          <div className="modal-actions">
            <button type="submit" className="submit-button">
              Create Project
            </button>
            <button type="button" onClick={onClose} className="cancel-button">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectFormModal;