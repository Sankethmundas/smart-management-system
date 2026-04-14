/**
 * In-Memory Database (Swappable with MongoDB/PostgreSQL)
 * 
 * This module serves as a data store using in-memory arrays.
 * For production, replace with mongoose models connecting to MongoDB.
 * 
 * Data Models:
 * - Users: id, name, email, password (hashed), role, createdAt
 * - Tasks: id, title, description, status, priority, assignedTo, projectId, dueDate, createdAt, updatedAt
 * - Projects: id, name, description, status, members, createdAt
 */

const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// ─── In-Memory Data Stores ──────────────────────────────────
const users = [];
const tasks = [];
const projects = [];

/**
 * Seed demo data for testing and demonstration.
 * Creates sample users, projects, and tasks.
 */
function seedDemoData() {
    // Clear existing data
    users.length = 0;
    tasks.length = 0;
    projects.length = 0;

    // ─── Demo Users ─────────────────────────────────────
    const demoUsers = [
        { name: 'Sanketh Kumar', email: 'sanketh@demo.com', password: 'admin123', role: 'admin' },
        { name: 'Priya Sharma', email: 'priya@demo.com', password: 'pass123', role: 'manager' },
        { name: 'Rahul Verma', email: 'rahul@demo.com', password: 'pass123', role: 'member' },
        { name: 'Ananya Patel', email: 'ananya@demo.com', password: 'pass123', role: 'member' },
        { name: 'Vikram Singh', email: 'vikram@demo.com', password: 'pass123', role: 'member' }
    ];

    demoUsers.forEach(user => {
        const salt = bcrypt.genSaltSync(10);
        users.push({
            id: uuidv4(),
            name: user.name,
            email: user.email,
            password: bcrypt.hashSync(user.password, salt),
            role: user.role,
            createdAt: new Date().toISOString()
        });
    });

    // ─── Demo Projects ──────────────────────────────────
    const demoProjects = [
        {
            name: 'E-Commerce Platform',
            description: 'Build a full-stack e-commerce platform with payment integration',
            status: 'active',
            members: [users[0].id, users[1].id, users[2].id]
        },
        {
            name: 'Mobile App Redesign',
            description: 'Redesign the company mobile app with modern UI/UX',
            status: 'active',
            members: [users[1].id, users[3].id, users[4].id]
        },
        {
            name: 'API Microservices',
            description: 'Migrate monolithic API to microservices architecture',
            status: 'planning',
            members: [users[0].id, users[2].id, users[4].id]
        }
    ];

    demoProjects.forEach(proj => {
        projects.push({
            id: uuidv4(),
            ...proj,
            createdAt: new Date().toISOString()
        });
    });

    // ─── Demo Tasks ─────────────────────────────────────
    const statuses = ['todo', 'in-progress', 'done'];
    const priorities = ['low', 'medium', 'high'];
    const demoTasks = [
        { title: 'Setup project structure', description: 'Initialize React app with folder structure', status: 'done', priority: 'high', assignedTo: users[0].name, projectId: projects[0].id },
        { title: 'Design database schema', description: 'Create MongoDB schemas for products, users, orders', status: 'done', priority: 'high', assignedTo: users[1].name, projectId: projects[0].id },
        { title: 'Implement user authentication', description: 'JWT-based login/register with bcrypt password hashing', status: 'done', priority: 'high', assignedTo: users[0].name, projectId: projects[0].id },
        { title: 'Build product listing page', description: 'Create responsive product grid with filtering and sorting', status: 'in-progress', priority: 'medium', assignedTo: users[2].name, projectId: projects[0].id },
        { title: 'Shopping cart functionality', description: 'Add to cart, update quantity, remove items', status: 'in-progress', priority: 'medium', assignedTo: users[0].name, projectId: projects[0].id },
        { title: 'Payment gateway integration', description: 'Integrate Stripe/Razorpay for payment processing', status: 'todo', priority: 'high', assignedTo: users[1].name, projectId: projects[0].id },
        { title: 'Order tracking system', description: 'Real-time order status updates with email notifications', status: 'todo', priority: 'medium', assignedTo: users[2].name, projectId: projects[0].id },
        { title: 'Create wireframes', description: 'Design wireframes for all major screens in Figma', status: 'done', priority: 'high', assignedTo: users[3].name, projectId: projects[1].id },
        { title: 'Implement new navigation', description: 'Bottom tab navigation with smooth transitions', status: 'in-progress', priority: 'medium', assignedTo: users[4].name, projectId: projects[1].id },
        { title: 'Dark mode support', description: 'Add dark mode toggle with system preference detection', status: 'todo', priority: 'low', assignedTo: users[3].name, projectId: projects[1].id },
        { title: 'Performance optimization', description: 'Lazy loading, image optimization, code splitting', status: 'todo', priority: 'medium', assignedTo: users[4].name, projectId: projects[1].id },
        { title: 'Define service boundaries', description: 'Identify and document microservice boundaries', status: 'in-progress', priority: 'high', assignedTo: users[0].name, projectId: projects[2].id },
        { title: 'Setup Docker environment', description: 'Create Dockerfiles and docker-compose for all services', status: 'todo', priority: 'high', assignedTo: users[2].name, projectId: projects[2].id },
        { title: 'Implement API gateway', description: 'Setup Kong/Nginx as API gateway with rate limiting', status: 'todo', priority: 'medium', assignedTo: users[4].name, projectId: projects[2].id },
        { title: 'Write unit tests', description: 'Achieve 80% code coverage with Jest', status: 'todo', priority: 'low', assignedTo: users[2].name, projectId: projects[0].id }
    ];

    demoTasks.forEach(task => {
        const daysAgo = Math.floor(Math.random() * 14);
        const createdDate = new Date(Date.now() - daysAgo * 86400000);
        tasks.push({
            id: uuidv4(),
            ...task,
            dueDate: new Date(Date.now() + (7 + Math.floor(Math.random() * 21)) * 86400000).toISOString(),
            createdAt: createdDate.toISOString(),
            updatedAt: new Date().toISOString()
        });
    });

    console.log(`[DB] Seeded: ${users.length} users, ${projects.length} projects, ${tasks.length} tasks`);
}

module.exports = { users, tasks, projects, seedDemoData };
