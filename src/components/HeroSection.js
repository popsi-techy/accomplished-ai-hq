// src/components/HeroSection.js
import React from 'react';
import './HeroSection.css'; // Import CSS for styling

const HeroSection = ({ onScheduleTasksClick }) => {
  return (
    <section className="hero-section">
      <div className="hero-content">
        <p className="company-name">Accomplished.ai</p>
        <h1 className="hero-tagline">
          Create, schedule and <strong>accomplish</strong>
        </h1>
        <button className="schedule-button" onClick={onScheduleTasksClick}>
          Schedule tasks using AI
        </button>
      </div>
    </section>
  );
};

export default HeroSection;