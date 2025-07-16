// src/pages/ProjectDetailPage.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import {
  doc,
  getDoc,
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  writeBatch,
} from 'firebase/firestore';
import Papa from 'papaparse';

// REMOVED: import { getScheduledTasksFromAI } from '../services/gemini'; // No longer needed for client-side API call

import './ProjectDetailPage.css';
import './forms.css';

const ProjectDetailPage = () => {
  const { projectId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [newTask, setNewTask] = useState({
    taskName: '',
    description: '',
    estimatedDuration: '',
    dueDate: '',
    dependencies: '',
    priority: 'Medium',
  });

  const [googleSheetUrl, setGoogleSheetUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importMessage, setImportMessage] = useState('');
  const [isScheduling, setIsScheduling] = useState(false);

  // Define your backend URL (make sure it matches the port your Express server is listening on)
  const BACKEND_API_URL = 'https://accomplished-ai-hq.onrender.com/api/schedule';

  useEffect(() => {
    if (!currentUser || !projectId) {
      setLoading(false);
      return;
    }

    const fetchProjectAndTasks = async () => {
      try {
        const projectDocRef = doc(db, 'projects', projectId);
        const projectDocSnap = await getDoc(projectDocRef);

        if (!projectDocSnap.exists() || projectDocSnap.data().userId !== currentUser.uid) {
          setError('Project not found or you do not have permission to view it.');
          setLoading(false);
          return;
        }
        setProject({ id: projectDocSnap.id, ...projectDocSnap.data() });

        const tasksColRef = collection(db, 'projects', projectId, 'tasks');
        const q = query(tasksColRef, orderBy('createdAt', 'asc'));

        const unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            const tasksData = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
            setTasks(tasksData);
            setLoading(false);
          },
          (err) => {
            console.error('Error fetching tasks:', err);
            setError('Failed to load tasks.');
            setLoading(false);
          }
        );

        return () => unsubscribe();
      } catch (err) {
        console.error('Error fetching project:', err);
        setError('Failed to load project details.');
        setLoading(false);
      }
    };

    fetchProjectAndTasks();
  }, [currentUser, projectId]);

  const handleNewTaskChange = (e) => {
    const { name, value } = e.target;
    setNewTask((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!currentUser || !projectId) return;

    if (!newTask.taskName || !newTask.estimatedDuration || !newTask.dueDate) {
      alert('Task Name, Estimated Duration, and Due Date are required.');
      return;
    }

    try {
      await addDoc(collection(db, 'projects', projectId, 'tasks'), {
        ...newTask,
        estimatedDuration: parseFloat(newTask.estimatedDuration),
        createdAt: new Date(),
      });
      setNewTask({
        taskName: '',
        description: '',
        estimatedDuration: '',
        dueDate: '',
        dependencies: '',
        priority: 'Medium',
      });
    } catch (err) {
      console.error('Error adding task:', err);
      alert('Failed to add task.');
    }
  };

  const handleGoogleSheetImport = async (e) => {
    e.preventDefault();
    if (!googleSheetUrl.trim()) {
      setImportMessage('Please enter a Google Sheet URL.');
      return;
    }

    setIsImporting(true);
    setImportMessage('Importing tasks...');

    try {
      let finalCsvUrl = googleSheetUrl.trim();

      if (finalCsvUrl.includes('/edit#gid=')) {
        const sheetIdMatch = finalCsvUrl.match(/\/d\/(.*?)\//);
        const gidMatch = finalCsvUrl.match(/gid=(\d+)/);
        if (sheetIdMatch && gidMatch) {
          finalCsvUrl = `https://docs.google.com/spreadsheets/d/${sheetIdMatch[1]}/export?format=csv&gid=${gidMatch[1]}`;
        } else {
          setImportMessage('Invalid Google Sheet sharing URL. Please ensure it is a valid Google Sheet link.');
          setIsImporting(false);
          return;
        }
      } else if (finalCsvUrl.includes('/pub?') && (finalCsvUrl.includes('output=csv') || finalCsvUrl.includes('output=tsv'))) {
        // This is already a direct public CSV/TSV link, use as is.
      } else if (finalCsvUrl.endsWith('.csv') || finalCsvUrl.endsWith('.tsv') || finalCsvUrl.endsWith('.txt')) {
          // Use as is
      } else {
        setImportMessage('Please provide a direct public CSV/TSV link or a Google Sheet sharing link.');
        setIsImporting(false);
        return;
      }

      const response = await fetch(finalCsvUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status} - Could not fetch the sheet. Make sure it's publicly accessible and correctly published.`);
      }
      const csvText = await response.text();

      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          const importedTasks = results.data.map(row => ({
            taskName: row['Task Name'] || '',
            description: row['Description'] || '',
            estimatedDuration: parseFloat(row['Estimated Duration']) || 0,
            dueDate: row['Due Date'] || '',
            dependencies: row['Dependencies'] || '',
            priority: row['Priority'] || 'Medium',
            createdAt: new Date(),
          })).filter(task => task.taskName);

          if (importedTasks.length === 0) {
              setImportMessage('No valid tasks found in the sheet. Check headers (Task Name, Estimated Duration, Due Date, etc.) and data.');
              setIsImporting(false);
              return;
          }

          let tasksAddedCount = 0;
          const batch = writeBatch(db);
          const tasksColRef = collection(db, 'projects', projectId, 'tasks');

          importedTasks.forEach(task => {
              const newDocRef = doc(tasksColRef);
              batch.set(newDocRef, task);
              tasksAddedCount++;
          });

          if (tasksAddedCount > 0) {
            await batch.commit();
            setImportMessage(`Successfully imported ${tasksAddedCount} tasks!`);
          } else {
            setImportMessage('No tasks imported.');
          }

          setGoogleSheetUrl('');
          setIsImporting(false);
        },
        error: (parseError) => {
          console.error('CSV parsing error:', parseError);
          setImportMessage('Failed to parse CSV. Check sheet format.');
          setIsImporting(false);
        }
      });
    } catch (err) {
      console.error('Error during Google Sheet import:', err);
      setImportMessage(`Import failed: ${err.message}. Ensure the sheet is published to the web as CSV/TSV.`);
      setIsImporting(false);
    }
  };

  const handleScheduleAI = async () => {
    if (tasks.length === 0) {
      alert('Please add some tasks before scheduling with AI.');
      return;
    }
    if (isScheduling) return;

    setIsScheduling(true);
    try {
      // Send tasks to your Express backend for AI scheduling
      const response = await fetch(BACKEND_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tasks, projectName: project.projectName }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get schedule from backend.');
      }

      const { description, scheduledTasks } = await response.json();
      console.log('Backend Response Description:', description);
      console.log('Backend Response Scheduled Tasks:', scheduledTasks);

      const batch = writeBatch(db);
      const projectDocRef = doc(db, 'projects', projectId);

      // Update the project document with the AI's scheduling description
      batch.update(projectDocRef, {
        aiSchedulingDescription: description,
        lastScheduledAt: new Date(),
      });

      // Update tasks in Firestore with scheduled data
      for (const geminiTask of scheduledTasks) {
        const existingTask = tasks.find(t => t.taskName === geminiTask.taskName);
        if (existingTask) {
          const taskDocRef = doc(db, 'projects', projectId, 'tasks', existingTask.id);
          batch.update(taskDocRef, {
            scheduledStartDate: geminiTask.scheduledStartDate,
            scheduledEndDate: geminiTask.scheduledEndDate,
            scheduledOrder: geminiTask.order,
          });
        } else {
          console.warn(`Task "${geminiTask.taskName}" from AI response not found in current tasks. Skipping update.`);
        }
      }

      await batch.commit();
      alert('Tasks scheduled successfully by AI and saved!');
      navigate(`/schedules/${projectId}`); // Redirect to the schedules page for this project
    } catch (err) {
      console.error('Error during AI scheduling process (Firestore batch or redirect):', err);
      alert(`Failed to schedule with AI: ${err.message}. Check console for details.`);
    } finally {
      setIsScheduling(false);
    }
  };

  if (loading) {
    return <div className="detail-loading">Loading project...</div>;
  }

  if (error) {
    return <div className="detail-error">{error}</div>;
  }

  if (!project) {
    return <div className="detail-not-found">Project not found.</div>;
  }

  return (
    <div className="project-detail-container">
      <div className="project-header">
        <h2>{project.projectName}</h2>
        <p>{project.projectDescription}</p>
        <button
          onClick={handleScheduleAI}
          className="schedule-ai-button"
          disabled={isScheduling || tasks.length === 0}
        >
          {isScheduling ? 'Scheduling...' : 'Schedule with AI'}
        </button>
      </div>

      <div className="task-management-section">
        <h3>Add New Task</h3>
        <form onSubmit={handleAddTask} className="task-form">
          <div className="form-group">
            <label htmlFor="taskName">Task Name:</label>
            <input
              type="text"
              id="taskName"
              name="taskName"
              value={newTask.taskName}
              onChange={handleNewTaskChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="description">Description:</label>
            <textarea
              id="description"
              name="description"
              value={newTask.description}
              onChange={handleNewTaskChange}
              rows="3"
            ></textarea>
          </div>
          <div className="form-group">
            <label htmlFor="estimatedDuration">Estimated Duration (hours):</label>
            <input
              type="number"
              id="estimatedDuration"
              name="estimatedDuration"
              value={newTask.estimatedDuration}
              onChange={handleNewTaskChange}
              min="0.1"
              step="0.1"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="dueDate">Due Date:</label>
            <input
              type="date"
              id="dueDate"
              name="dueDate"
              value={newTask.dueDate}
              onChange={handleNewTaskChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="dependencies">Dependencies (comma-separated Task Names):</label>
            <input
              type="text"
              id="dependencies"
              name="dependencies"
              value={newTask.dependencies}
              onChange={handleNewTaskChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="priority">Priority:</label>
            <select
              id="priority"
              name="priority"
              value={newTask.priority}
              onChange={handleNewTaskChange}
            >
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
          <button type="submit" className="add-task-button">
            Add Task
          </button>
        </form>

        <h3 className="import-section-title">Import Tasks from Google Sheet</h3>
        <form onSubmit={handleGoogleSheetImport} className="import-form">
          <div className="form-group">
            <label htmlFor="googleSheetUrl">Public Google Sheet URL (CSV/TSV or sharing link):</label>
            <input
              type="url"
              id="googleSheetUrl"
              value={googleSheetUrl}
              onChange={(e) => setGoogleSheetUrl(e.target.value)}
              placeholder="e.g., https://docs.google.com/spreadsheets/d/.../export?format=csv"
              required
            />
          </div>
          <button type="submit" className="import-button" disabled={isImporting}>
            {isImporting ? 'Importing...' : 'Import Tasks'}
          </button>
          {importMessage && <p className="import-message">{importMessage}</p>}
        </form>
      </div>

      <div className="current-tasks-section">
        <h3>Current Tasks ({tasks.length})</h3>
        {tasks.length === 0 ? (
          <p className="no-tasks-message">No tasks added yet. Add manually or import from a sheet!</p>
        ) : (
          <table className="tasks-table">
            <thead>
              <tr>
                <th>Task Name</th>
                <th>Description</th>
                <th>Duration (hrs)</th>
                <th>Due Date</th>
                <th>Dependencies</th>
                <th>Priority</th>
                <th>Added On</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id}>
                  <td>{task.taskName}</td>
                  <td>{task.description}</td>
                  <td>{task.estimatedDuration}</td>
                  <td>{task.dueDate}</td>
                  <td>{task.dependencies}</td>
                  <td>{task.priority}</td>
                  <td>{new Date(task.createdAt.toDate()).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ProjectDetailPage;