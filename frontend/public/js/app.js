/**
 * TaskFlow — Smart Management System Frontend Logic
 * Handles navigation, API calls, Kanban board, charts, and CRUD operations
 */

const API_BASE = '/api';

document.addEventListener('DOMContentLoaded', () => {
    // ─── Navigation ──────────────────────────────────────
    const navItems = document.querySelectorAll('.nav-item');
    const views = document.querySelectorAll('.view');
    const pageTitle = document.getElementById('page-title');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');

            views.forEach(v => v.classList.remove('active'));
            const viewId = `view-${item.dataset.view}`;
            const view = document.getElementById(viewId);
            if (view) view.classList.add('active');

            const titles = {
                dashboard: 'Dashboard',
                kanban: 'Kanban Board',
                tasks: 'All Tasks',
                projects: 'Projects',
                team: 'Team Members'
            };
            pageTitle.textContent = titles[item.dataset.view] || 'Dashboard';

            // Reload data for the active view
            if (item.dataset.view === 'dashboard') loadDashboard();
            if (item.dataset.view === 'kanban') loadKanban();
            if (item.dataset.view === 'tasks') loadTasksList();
            if (item.dataset.view === 'projects') loadProjects();
            if (item.dataset.view === 'team') loadTeam();
        });
    });

    // ─── Modal Controls ──────────────────────────────────
    const modalOverlay = document.getElementById('modal-overlay');
    const addTaskBtn = document.getElementById('add-task-btn');
    const modalClose = document.getElementById('modal-close');
    const modalCancel = document.getElementById('modal-cancel');
    const taskForm = document.getElementById('task-form');

    addTaskBtn.addEventListener('click', () => {
        modalOverlay.classList.add('active');
        document.getElementById('task-title').focus();
    });

    [modalClose, modalCancel].forEach(btn => {
        btn.addEventListener('click', () => modalOverlay.classList.remove('active'));
    });

    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) modalOverlay.classList.remove('active');
    });

    // ─── Create Task Form ────────────────────────────────
    taskForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const taskData = {
            title: document.getElementById('task-title').value,
            description: document.getElementById('task-desc').value,
            status: document.getElementById('task-status').value,
            priority: document.getElementById('task-priority').value,
            assignedTo: document.getElementById('task-assignee').value || 'Unassigned'
        };

        try {
            const res = await fetch(`${API_BASE}/tasks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(taskData)
            });
            const data = await res.json();
            if (data.status === 'success') {
                modalOverlay.classList.remove('active');
                taskForm.reset();
                refreshActiveView();
            }
        } catch (err) {
            console.error('Error creating task:', err);
        }
    });

    // ─── Search ──────────────────────────────────────────
    document.getElementById('global-search').addEventListener('input', async (e) => {
        const query = e.target.value.trim();
        if (query.length > 1) {
            const res = await fetch(`${API_BASE}/tasks?search=${encodeURIComponent(query)}`);
            const data = await res.json();
            if (data.status === 'success') {
                renderTasksTable(data.tasks);
                // Switch to tasks view
                navItems.forEach(n => n.classList.remove('active'));
                document.getElementById('nav-tasks').classList.add('active');
                views.forEach(v => v.classList.remove('active'));
                document.getElementById('view-tasks').classList.add('active');
                pageTitle.textContent = `Search: "${query}"`;
            }
        }
    });

    // ─── Filters ─────────────────────────────────────────
    document.getElementById('filter-status').addEventListener('change', loadTasksList);
    document.getElementById('filter-priority').addEventListener('change', loadTasksList);

    // ─── Dashboard ───────────────────────────────────────
    async function loadDashboard() {
        try {
            const res = await fetch(`${API_BASE}/analytics`);
            const data = await res.json();

            // Update stat cards
            document.getElementById('stat-total-value').textContent = data.overview.totalTasks;
            document.getElementById('stat-completed-value').textContent = data.overview.completedTasks;
            document.getElementById('stat-progress-value').textContent = data.overview.inProgressTasks;
            document.getElementById('stat-rate-value').textContent = `${data.overview.completionRate}%`;

            // Render Charts
            renderStatusChart(data.overview);
            renderPriorityChart(data.priority);

            // Render Activity
            const activityList = document.getElementById('activity-list');
            activityList.innerHTML = data.recentActivity.map(a => `
                <div class="activity-item">
                    <div>
                        <span class="activity-task">${a.task}</span>
                        <span class="status-badge ${a.status}">${a.status}</span>
                    </div>
                    <span class="activity-time">${formatDate(a.updatedAt)}</span>
                </div>
            `).join('');
        } catch (err) {
            console.error('Error loading dashboard:', err);
        }
    }

    let statusChart = null;
    let priorityChart = null;

    function renderStatusChart(overview) {
        const ctx = document.getElementById('status-chart');
        if (!ctx) return;

        if (statusChart) statusChart.destroy();

        statusChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['To Do', 'In Progress', 'Done'],
                datasets: [{
                    data: [overview.todoTasks, overview.inProgressTasks, overview.completedTasks],
                    backgroundColor: ['#a78bfa', '#3b82f6', '#10b981'],
                    borderWidth: 0,
                    hoverOffset: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#8a8ab0', font: { family: 'Inter', size: 12 }, padding: 16 }
                    }
                },
                cutout: '65%'
            }
        });
    }

    function renderPriorityChart(priority) {
        const ctx = document.getElementById('priority-chart');
        if (!ctx) return;

        if (priorityChart) priorityChart.destroy();

        priorityChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['High', 'Medium', 'Low'],
                datasets: [{
                    label: 'Tasks',
                    data: [priority.high, priority.medium, priority.low],
                    backgroundColor: ['#ef4444', '#f59e0b', '#10b981'],
                    borderRadius: 6,
                    barPercentage: 0.5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: {
                        ticks: { color: '#8a8ab0', font: { family: 'Inter' } },
                        grid: { display: false }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: { color: '#8a8ab0', stepSize: 1, font: { family: 'Inter' } },
                        grid: { color: 'rgba(255,255,255,0.04)' }
                    }
                }
            }
        });
    }

    // ─── Kanban Board ────────────────────────────────────
    async function loadKanban() {
        try {
            const res = await fetch(`${API_BASE}/tasks`);
            const data = await res.json();
            const tasks = data.tasks || [];

            const todoTasks = tasks.filter(t => t.status === 'todo');
            const inProgressTasks = tasks.filter(t => t.status === 'in-progress');
            const doneTasks = tasks.filter(t => t.status === 'done');

            document.getElementById('count-todo').textContent = todoTasks.length;
            document.getElementById('count-inprogress').textContent = inProgressTasks.length;
            document.getElementById('count-done').textContent = doneTasks.length;

            renderKanbanColumn('tasks-todo', todoTasks);
            renderKanbanColumn('tasks-inprogress', inProgressTasks);
            renderKanbanColumn('tasks-done', doneTasks);
        } catch (err) {
            console.error('Error loading kanban:', err);
        }
    }

    function renderKanbanColumn(containerId, tasks) {
        const container = document.getElementById(containerId);
        container.innerHTML = tasks.map(task => `
            <div class="kanban-card" draggable="true" data-id="${task.id}">
                <div class="kanban-card-title">${task.title}</div>
                ${task.description ? `<div class="kanban-card-desc">${task.description.substring(0, 80)}${task.description.length > 80 ? '...' : ''}</div>` : ''}
                <div class="kanban-card-footer">
                    <span class="priority-badge ${task.priority}">${task.priority}</span>
                    <span class="kanban-card-assignee">${task.assignedTo || 'Unassigned'}</span>
                </div>
            </div>
        `).join('');

        // Setup drag and drop
        setupDragAndDrop();
    }

    function setupDragAndDrop() {
        const cards = document.querySelectorAll('.kanban-card');
        const columns = document.querySelectorAll('.kanban-tasks');

        cards.forEach(card => {
            card.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', card.dataset.id);
                card.style.opacity = '0.5';
            });
            card.addEventListener('dragend', () => {
                card.style.opacity = '1';
            });
        });

        columns.forEach(column => {
            column.addEventListener('dragover', (e) => {
                e.preventDefault();
                column.style.background = 'rgba(124, 58, 237, 0.05)';
            });
            column.addEventListener('dragleave', () => {
                column.style.background = '';
            });
            column.addEventListener('drop', async (e) => {
                e.preventDefault();
                column.style.background = '';
                const taskId = e.dataTransfer.getData('text/plain');
                const newStatus = column.parentElement.dataset.status;

                try {
                    await fetch(`${API_BASE}/tasks/${taskId}/status`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: newStatus })
                    });
                    loadKanban();
                } catch (err) {
                    console.error('Error updating status:', err);
                }
            });
        });
    }

    // ─── Tasks List ──────────────────────────────────────
    async function loadTasksList() {
        try {
            const status = document.getElementById('filter-status').value;
            const priority = document.getElementById('filter-priority').value;
            
            let url = `${API_BASE}/tasks?`;
            if (status) url += `status=${status}&`;
            if (priority) url += `priority=${priority}&`;

            const res = await fetch(url);
            const data = await res.json();
            renderTasksTable(data.tasks || []);
        } catch (err) {
            console.error('Error loading tasks:', err);
        }
    }

    function renderTasksTable(tasks) {
        const tbody = document.getElementById('tasks-tbody');
        tbody.innerHTML = tasks.map(task => `
            <tr>
                <td>
                    <div style="font-weight:600">${task.title}</div>
                    <div style="font-size:0.75rem;color:var(--text-muted)">${(task.description || '').substring(0, 60)}</div>
                </td>
                <td><span class="status-badge ${task.status}">${task.status}</span></td>
                <td><span class="priority-badge ${task.priority}">${task.priority}</span></td>
                <td>${task.assignedTo || 'Unassigned'}</td>
                <td style="font-size:0.8rem;color:var(--text-muted)">${formatDate(task.dueDate)}</td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="deleteTask('${task.id}')">Delete</button>
                </td>
            </tr>
        `).join('');
    }

    // ─── Projects ────────────────────────────────────────
    async function loadProjects() {
        try {
            const res = await fetch(`${API_BASE}/projects`);
            const data = await res.json();
            const grid = document.getElementById('projects-grid');

            grid.innerHTML = (data.projects || []).map(proj => `
                <div class="project-card">
                    <h4>${proj.name}</h4>
                    <p>${proj.description}</p>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${proj.taskStats.completionRate}%"></div>
                    </div>
                    <div class="project-stats">
                        <span>${proj.taskStats.completionRate}% complete</span>
                        <span>${proj.taskStats.completed}/${proj.taskStats.total} tasks</span>
                    </div>
                </div>
            `).join('');
        } catch (err) {
            console.error('Error loading projects:', err);
        }
    }

    // ─── Team ────────────────────────────────────────────
    async function loadTeam() {
        try {
            const res = await fetch(`${API_BASE}/auth/users`);
            const data = await res.json();
            const grid = document.getElementById('team-grid');

            grid.innerHTML = (data.users || []).map(user => {
                const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase();
                return `
                    <div class="team-card">
                        <div class="team-avatar">${initials}</div>
                        <h4>${user.name}</h4>
                        <div class="team-role">${user.role}</div>
                        <div class="team-email">${user.email}</div>
                    </div>
                `;
            }).join('');
        } catch (err) {
            console.error('Error loading team:', err);
        }
    }

    // ─── Utilities ───────────────────────────────────────
    function formatDate(dateStr) {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    }

    function refreshActiveView() {
        const activeNav = document.querySelector('.nav-item.active');
        if (activeNav) activeNav.click();
    }

    // ─── Initial Load ────────────────────────────────────
    loadDashboard();
});

// Global function for delete (called from inline onclick)
async function deleteTask(id) {
    if (!confirm('Delete this task?')) return;
    try {
        await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
        // Refresh active view
        document.querySelector('.nav-item.active').click();
    } catch (err) {
        console.error('Error deleting task:', err);
    }
}
