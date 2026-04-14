/**
 * Authentication Routes
 * POST /api/auth/register — Create new account
 * POST /api/auth/login    — Login and receive JWT token
 * GET  /api/auth/me       — Get current user profile
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { users } = require('../config/db');
const auth = require('../middleware/auth');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// ─── Register ───────────────────────────────────────────────
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({ 
                error: 'Name, email, and password are required.',
                status: 'validation_error'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({ 
                error: 'Password must be at least 6 characters.',
                status: 'validation_error'
            });
        }

        // Check if email already exists
        const existingUser = users.find(u => u.email === email.toLowerCase());
        if (existingUser) {
            return res.status(409).json({ 
                error: 'An account with this email already exists.',
                status: 'conflict'
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const newUser = {
            id: uuidv4(),
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            role: role || 'member',
            createdAt: new Date().toISOString()
        };

        users.push(newUser);

        // Generate JWT token
        const token = jwt.sign(
            { id: newUser.id, email: newUser.email, role: newUser.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            status: 'success',
            message: 'Account created successfully',
            token,
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message, status: 'error' });
    }
});

// ─── Login ──────────────────────────────────────────────────
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ 
                error: 'Email and password are required.',
                status: 'validation_error'
            });
        }

        // Find user
        const user = users.find(u => u.email === email.toLowerCase().trim());
        if (!user) {
            return res.status(401).json({ 
                error: 'Invalid email or password.',
                status: 'unauthorized'
            });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ 
                error: 'Invalid email or password.',
                status: 'unauthorized'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            status: 'success',
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message, status: 'error' });
    }
});

// ─── Get Current User ───────────────────────────────────────
router.get('/me', auth, (req, res) => {
    const user = users.find(u => u.id === req.user.id);
    if (!user) {
        return res.status(404).json({ error: 'User not found', status: 'not_found' });
    }

    res.json({
        status: 'success',
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt
        }
    });
});

// ─── Get All Users (Admin/Manager only) ─────────────────────
router.get('/users', auth, (req, res) => {
    const userList = users.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt
    }));

    res.json({ status: 'success', users: userList });
});

module.exports = router;
