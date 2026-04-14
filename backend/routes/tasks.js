/**
 * Task Routes — CRUD Operations
 * GET    /api/tasks           — Get all tasks (with filters)
 * POST   /api/tasks           — Create a new task
 * PUT    /api/tasks/:id       — Update a task
 * DELETE /api/tasks/:id       — Delete a task
 * PATCH  /api/tasks/:id/status — Update task status (for Kanban drag-drop)
 */

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { tasks } = require('../config/db');
const auth = require('../middleware/auth');

const router = express.Router();

// ─── Get All Tasks (with optional filters) ──────────────────
router.get('/', (req, res) => {
    try {
        let filteredTasks = [...tasks];
        const { status, priority, assignedTo, projectId, search } = req.query;

        // Apply filters
        if (status) {
            filteredTasks = filteredTasks.filter(t => t.status === status);
        }
        if (priority) {
            filteredTasks = filteredTasks.filter(t => t.priority === priority);
        }
        if (assignedTo) {
            filteredTasks = filteredTasks.filter(t => 
                t.assignedTo && t.assignedTo.toLowerCase().includes(assignedTo.toLowerCase())
            );
        }
        if (projectId) {
            filteredTasks = filteredTasks.filter(t => t.projectId === projectId);
        }
        if (search) {
            const q = search.toLowerCase();
            filteredTasks = filteredTasks.filter(t => 
                t.title.toLowerCase().includes(q) || 
                (t.description && t.description.toLowerCase().includes(q))
            );
        }

        // Sort by updatedAt (newest first)
        filteredTasks.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

        res.json({
            status: 'success',
            count: filteredTasks.length,
            tasks: filteredTasks
        });
    } catch (err) {
        res.status(500).json({ error: err.message, status: 'error' });
    }
});

// ─── Get Single Task ────────────────────────────────────────
router.get('/:id', (req, res) => {
    const task = tasks.find(t => t.id === req.params.id);
    if (!task) {
        return res.status(404).json({ error: 'Task not found', status: 'not_found' });
    }
    res.json({ status: 'success', task });
});

// ─── Create Task ────────────────────────────────────────────
router.post('/', (req, res) => {
    try {
        const { title, description, status: taskStatus, priority, assignedTo, projectId, dueDate } = req.body;

        // Validation
        if (!title || !title.trim()) {
            return res.status(400).json({ 
                error: 'Task title is required.',
                status: 'validation_error'
            });
        }

        const validStatuses = ['todo', 'in-progress', 'done'];
        const validPriorities = ['low', 'medium', 'high'];

        const newTask = {
            id: uuidv4(),
            title: title.trim(),
            description: description ? description.trim() : '',
            status: validStatuses.includes(taskStatus) ? taskStatus : 'todo',
            priority: validPriorities.includes(priority) ? priority : 'medium',
            assignedTo: assignedTo || 'Unassigned',
            projectId: projectId || null,
            dueDate: dueDate || new Date(Date.now() + 7 * 86400000).toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        tasks.push(newTask);

        res.status(201).json({
            status: 'success',
            message: 'Task created successfully',
            task: newTask
        });
    } catch (err) {
        res.status(500).json({ error: err.message, status: 'error' });
    }
});

// ─── Update Task ────────────────────────────────────────────
router.put('/:id', (req, res) => {
    try {
        const taskIndex = tasks.findIndex(t => t.id === req.params.id);
        if (taskIndex === -1) {
            return res.status(404).json({ error: 'Task not found', status: 'not_found' });
        }

        const { title, description, status: taskStatus, priority, assignedTo, dueDate } = req.body;
        const task = tasks[taskIndex];

        // Update only provided fields
        if (title !== undefined) task.title = title.trim();
        if (description !== undefined) task.description = description.trim();
        if (taskStatus !== undefined) task.status = taskStatus;
        if (priority !== undefined) task.priority = priority;
        if (assignedTo !== undefined) task.assignedTo = assignedTo;
        if (dueDate !== undefined) task.dueDate = dueDate;
        task.updatedAt = new Date().toISOString();

        tasks[taskIndex] = task;

        res.json({
            status: 'success',
            message: 'Task updated successfully',
            task
        });
    } catch (err) {
        res.status(500).json({ error: err.message, status: 'error' });
    }
});

// ─── Update Task Status (for Kanban drag-and-drop) ──────────
router.patch('/:id/status', (req, res) => {
    try {
        const taskIndex = tasks.findIndex(t => t.id === req.params.id);
        if (taskIndex === -1) {
            return res.status(404).json({ error: 'Task not found', status: 'not_found' });
        }

        const { status } = req.body;
        const validStatuses = ['todo', 'in-progress', 'done'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ 
                error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
                status: 'validation_error'
            });
        }

        tasks[taskIndex].status = status;
        tasks[taskIndex].updatedAt = new Date().toISOString();

        res.json({
            status: 'success',
            message: `Task moved to "${status}"`,
            task: tasks[taskIndex]
        });
    } catch (err) {
        res.status(500).json({ error: err.message, status: 'error' });
    }
});

// ─── Delete Task ────────────────────────────────────────────
router.delete('/:id', (req, res) => {
    const taskIndex = tasks.findIndex(t => t.id === req.params.id);
    if (taskIndex === -1) {
        return res.status(404).json({ error: 'Task not found', status: 'not_found' });
    }

    const deletedTask = tasks.splice(taskIndex, 1)[0];

    res.json({
        status: 'success',
        message: 'Task deleted successfully',
        task: deletedTask
    });
});

module.exports = router;
