// src/pages/HomePage.js
import React, { useState } from 'react';
import HeroSection from '../components/HeroSection';
import ProjectFormModal from '../components/ProjectFormModal'; // Will create this next
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

const HomePage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleScheduleTasksClick = () => {
    if (currentUser) {
      setIsModalOpen(true);
    } else {
      navigate('/auth'); // Redirect to auth if not logged in
    }
  };

  const handleProjectSubmit = async (projectName, projectDescription) => {
    if (!currentUser) {
      console.error("No user logged in to create project.");
      return;
    }
    try {
      const docRef = await addDoc(collection(db, 'projects'), {
        userId: currentUser.uid,
        projectName,
        projectDescription,
        createdAt: new Date(),
      });
      console.log("Project created with ID: ", docRef.id);
      setIsModalOpen(false);
      navigate(`/projects/${docRef.id}`); // Redirect to the newly created project page
    } catch (e) {
      console.error("Error adding project: ", e);
    }
  };

  return (
    <div>
      <HeroSection onScheduleTasksClick={handleScheduleTasksClick} />
      {isModalOpen && (
        <ProjectFormModal
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleProjectSubmit}
        />
      )}
    </div>
  );
};

export default HomePage;