/**
 * Project Routes
 * GET    /api/projects      — Get all projects
 * POST   /api/projects      — Create a new project
 * PUT    /api/projects/:id  — Update a project
 * DELETE /api/projects/:id  — Delete a project
 */

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { projects, tasks } = require('../config/db');

const router = express.Router();

// ─── Get All Projects ───────────────────────────────────────
router.get('/', (req, res) => {
    try {
        const projectsWithStats = projects.map(project => {
            const projectTasks = tasks.filter(t => t.projectId === project.id);
            const completed = projectTasks.filter(t => t.status === 'done').length;
            const total = projectTasks.length;

            return {
                ...project,
                taskStats: {
                    total,
                    completed,
                    inProgress: projectTasks.filter(t => t.status === 'in-progress').length,
                    todo: projectTasks.filter(t => t.status === 'todo').length,
                    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
                }
            };
        });

        res.json({ status: 'success', projects: projectsWithStats });
    } catch (err) {
        res.status(500).json({ error: err.message, status: 'error' });
    }
});

// ─── Create Project ─────────────────────────────────────────
router.post('/', (req, res) => {
    try {
        const { name, description, members } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ 
                error: 'Project name is required.',
                status: 'validation_error'
            });
        }

        const newProject = {
            id: uuidv4(),
            name: name.trim(),
            description: description ? description.trim() : '',
            status: 'active',
            members: members || [],
            createdAt: new Date().toISOString()
        };

        projects.push(newProject);

        res.status(201).json({
            status: 'success',
            message: 'Project created successfully',
            project: newProject
        });
    } catch (err) {
        res.status(500).json({ error: err.message, status: 'error' });
    }
});

// ─── Update Project ─────────────────────────────────────────
router.put('/:id', (req, res) => {
    const projIndex = projects.findIndex(p => p.id === req.params.id);
    if (projIndex === -1) {
        return res.status(404).json({ error: 'Project not found', status: 'not_found' });
    }

    const { name, description, status, members } = req.body;
    if (name) projects[projIndex].name = name.trim();
    if (description) projects[projIndex].description = description.trim();
    if (status) projects[projIndex].status = status;
    if (members) projects[projIndex].members = members;

    res.json({
        status: 'success',
        message: 'Project updated',
        project: projects[projIndex]
    });
});

// ─── Delete Project ─────────────────────────────────────────
router.delete('/:id', (req, res) => {
    const projIndex = projects.findIndex(p => p.id === req.params.id);
    if (projIndex === -1) {
        return res.status(404).json({ error: 'Project not found', status: 'not_found' });
    }

    const deleted = projects.splice(projIndex, 1)[0];
    res.json({ status: 'success', message: 'Project deleted', project: deleted });
});

module.exports = router;
