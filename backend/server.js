// backend/server.js
require('dotenv').config(); // Load environment variables from .env file

const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const port = process.env.PORT || 5000; // Use port from .env or default to 5000

// Middleware
app.use(cors({
  origin: 'http://localhost:3000', // Allow requests only from your React frontend
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json()); // To parse JSON request bodies

// Initialize Gemini AI
const geminiApiKey = process.env.GEMINI_API_KEY;

if (!geminiApiKey) {
  console.error("Server: Gemini API key is missing. Please set GEMINI_API_KEY in your backend/.env file.");
  process.exit(1); // Exit if API key is not found
}

const genAI = new GoogleGenerativeAI(geminiApiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

// API Endpoint for scheduling tasks
app.post('/api/schedule', async (req, res) => {
  const { tasks, projectName } = req.body;

  if (!tasks || !projectName) {
    return res.status(400).json({ error: 'Missing tasks or projectName in request body.' });
  }

  const taskListString = tasks.map((task, index) => {
    return `${index + 1}. Task Name: "${task.taskName}" | Description: "${task.description}" | Duration: ${task.estimatedDuration} hours | Due Date: ${task.dueDate} | Dependencies: "${task.dependencies}" | Priority: "${task.priority}"`;
  }).join('\n');

  const prompt = `
  You are an AI-powered project scheduler. Your goal is to provide an optimal task schedule and insightful advice for efficient project completion.

  Project Name: "${projectName}"
  Current Date: ${new Date().toLocaleDateString('en-US')}

  Here is a list of tasks for the project:
  ${taskListString}

  For each task, I have provided:
  - Task Name: A unique identifier for the task.
  - Description: A brief explanation.
  - Estimated Duration: The time in hours expected to complete the task.
  - Due Date: The target completion date (YYYY-MM-DD).
  - Dependencies: Other task names that must be completed BEFORE this task can start (comma-separated). If none, it will be empty.
  - Priority: "High", "Medium", or "Low".

  Please provide your response in two parts:

  **Part 1: Scheduling Strategy and Efficiency Tips**
  Provide a detailed description (at least 3-4 paragraphs) on how you prioritized and scheduled these tasks. Include specific strategies you used (e.g., critical path, dependency management, high-priority first, breaking down large tasks). Offer actionable tips to complete the project faster and more efficiently, like "focus on research before development" or "parallelize independent tasks where possible."

  **Part 2: Scheduled Tasks (JSON Format)**
  Provide the optimized schedule for each task as a JSON array. Each object in the array MUST contain the following fields:
  - \`taskName\`: The exact task name from the input list.
  - \`scheduledStartDate\`: The recommended start date for the task (YYYY-MM-DD format).
  - \`scheduledEndDate\`: The recommended end date for the task (YYYY-MM-DD format).
  - \`order\`: A numerical value representing the sequence in which tasks should be displayed/executed (e.g., 1, 2, 3...).

  Example of Part 2 JSON format:
  \`\`\`json
  [
    {
      "taskName": "Task A",
      "scheduledStartDate": "2025-07-15",
      "scheduledEndDate": "2025-07-17",
      "order": 1
    },
    {
      "taskName": "Task B",
      "scheduledStartDate": "2025-07-18",
      "scheduledEndDate": "2025-07-20",
      "order": 2
    }
  ]
  \`\`\`

  Remember to provide ONLY the JSON block in Part 2, clearly marked with \`\`\`json \`\`\` delimiters. Ensure the JSON is valid.
  `;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    let description = "No scheduling strategy description provided.";
    let scheduledTasks = [];

    // Try to find the JSON block first
    const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch && jsonMatch[1]) {
      try {
        scheduledTasks = JSON.parse(jsonMatch[1]);
        // Remove the JSON block from the text to get the pure description
        description = responseText.replace(jsonMatch[0], '').trim();
      } catch (jsonParseError) {
        console.error("Server: Error parsing scheduled tasks JSON from Gemini:", jsonParseError);
        description = responseText; // If JSON parsing fails, treat whole response as description
      }
    } else {
      description = responseText; // No JSON block found, treat whole response as description
    }

    // Basic validation and type conversion for scheduledTasks
    scheduledTasks = scheduledTasks.map(task => ({
        taskName: String(task.taskName || ''),
        scheduledStartDate: String(task.scheduledStartDate || ''),
        scheduledEndDate: String(task.scheduledEndDate || ''),
        order: Number(task.order) || 999 // Default order if not provided
    }));

    res.json({ description, scheduledTasks });

  } catch (error) {
    console.error('Server: Error calling Gemini API:', error);
    res.status(500).json({ error: 'Failed to get schedule from AI. Please try again later.' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});