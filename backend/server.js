/**
 * Smart Management System — Express.js Backend Server
 * 
 * Features:
 * - JWT-based authentication
 * - RESTful API for tasks, projects, and teams
 * - In-memory data store (swappable with MongoDB)
 * - Role-based access control (Admin, Manager, Member)
 * - Analytics endpoints for dashboard
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const projectRoutes = require('./routes/projects');
const { seedDemoData } = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ──────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, '..', 'frontend', 'public')));

// ─── API Routes ─────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/projects', projectRoutes);

// ─── Health Check ───────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({
        status: 'running',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// ─── Analytics Endpoint ─────────────────────────────────────
app.get('/api/analytics', (req, res) => {
    const db = require('./config/db');
    const tasks = db.tasks;
    const users = db.users;

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'done').length;
    const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length;
    const todoTasks = tasks.filter(t => t.status === 'todo').length;

    // Tasks by priority
    const highPriority = tasks.filter(t => t.priority === 'high').length;
    const mediumPriority = tasks.filter(t => t.priority === 'medium').length;
    const lowPriority = tasks.filter(t => t.priority === 'low').length;

    // Completion rate
    const completionRate = totalTasks > 0 
        ? Math.round((completedTasks / totalTasks) * 100) 
        : 0;

    // Tasks per user
    const tasksByUser = {};
    tasks.forEach(task => {
        const assignee = task.assignedTo || 'Unassigned';
        if (!tasksByUser[assignee]) tasksByUser[assignee] = 0;
        tasksByUser[assignee]++;
    });

    res.json({
        overview: {
            totalTasks,
            completedTasks,
            inProgressTasks,
            todoTasks,
            completionRate,
            totalMembers: users.length
        },
        priority: { high: highPriority, medium: mediumPriority, low: lowPriority },
        tasksByUser,
        recentActivity: tasks
            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
            .slice(0, 5)
            .map(t => ({
                task: t.title,
                status: t.status,
                updatedAt: t.updatedAt
            }))
    });
});

// ─── Serve Frontend (SPA fallback) ──────────────────────────
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'public', 'index.html'));
});

// ─── Error Handler ──────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error(`[ERROR] ${err.message}`);
    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error',
        status: 'error'
    });
});

// ─── Start Server ───────────────────────────────────────────
seedDemoData();
app.listen(PORT, () => {
    console.log(`\n${'═'.repeat(50)}`);
    console.log(`  Smart Management System — Backend`);
    console.log(`  Server running on http://localhost:${PORT}`);
    console.log(`  API Base: http://localhost:${PORT}/api`);
    console.log(`${'═'.repeat(50)}\n`);
});

module.exports = app;
