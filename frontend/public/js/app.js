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
    const sidebar = document.getElementById('sidebar');
    const sidebarClose = document.getElementById('sidebar-close');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const menuToggle = document.getElementById('menu-toggle');
    const userInfo = document.getElementById('user-info');
    const logoutBtn = document.getElementById('logout-btn');
    const loginForm = document.getElementById('login-form');
    const loginEmail = document.getElementById('login-email');
    const loginPassword = document.getElementById('login-password');
    const profileName = document.getElementById('profile-name');
    const profileEmail = document.getElementById('profile-email');
    const profileRole = document.getElementById('profile-role');
    const registerForm = document.getElementById('register-form');
    const registerName = document.getElementById('register-name');
    const registerEmail = document.getElementById('register-email');
    const registerPassword = document.getElementById('register-password');
    const registerConfirmPassword = document.getElementById('register-confirm-password');
    const toggleLoginPassword = document.getElementById('toggle-login-password');
    const toggleRegisterPassword = document.getElementById('toggle-register-password');
    const toggleRegisterConfirmPassword = document.getElementById('toggle-register-confirm-password');
    const gotoRegisterBtn = document.getElementById('goto-register-btn');
    const showRegister = document.getElementById('show-register');
    const showLogin = document.getElementById('show-login');
    const protectedNavItems = document.querySelectorAll('.nav-item.requires-auth');
    const roleNavItems = document.querySelectorAll('.nav-item[data-roles]');

    const titles = {
        dashboard: 'Dashboard',
        kanban: 'Kanban Board',
        tasks: 'All Tasks',
        projects: 'Projects',
        team: 'Team Members',
        profile: 'My Profile',
        login: 'Login',
        register: 'Register'
    };

    let currentToken = localStorage.getItem('token');
    let currentUser = null;

    function closeMobileMenu() {
        sidebar.classList.remove('open');
    }

    function toggleMobileMenu() {
        sidebar.classList.toggle('open');
    }

    function setGuestState() {
        sidebar.classList.add('guest');
        protectedNavItems.forEach(item => item.style.display = 'none');
        const addTaskBtn = document.getElementById('add-task-btn');
        if (addTaskBtn) addTaskBtn.style.display = 'none';
    }

    function setAuthState() {
        sidebar.classList.remove('guest');
        protectedNavItems.forEach(item => item.style.display = '');
        const addTaskBtn = document.getElementById('add-task-btn');
        if (addTaskBtn) addTaskBtn.style.display = '';
    }

    function isNavAllowed(item) {
        const roles = item.dataset.roles ? item.dataset.roles.split(',') : [];
        return !roles.length || roles.includes(currentUser.role);
    }

    function setRoleState(role) {
        roleNavItems.forEach(item => {
            const roles = item.dataset.roles ? item.dataset.roles.split(',') : [];
            if (!roles.length || roles.includes(role)) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });

        const activeNav = document.querySelector('.nav-item.active');
        if (activeNav && !isNavAllowed(activeNav)) {
            setActiveView('tasks');
        }
    }

    async function handleUnauthorized(res) {
        if (res.status === 401 || res.status === 403) {
            logoutUser();
            alert('Your session has expired or you are not authorized. Please login again.');
            return true;
        }
        return false;
    }

    async function authFetch(url, options = {}) {
        if (!options.headers) options.headers = {};
        if (currentToken) {
            options.headers.Authorization = `Bearer ${currentToken}`;
        }
        options.headers['Content-Type'] = options.headers['Content-Type'] || 'application/json';

        const res = await fetch(url, options);
        if (await handleUnauthorized(res)) {
            throw new Error('Unauthorized');
        }
        return res;
    }

    const roleBadge = document.getElementById('role-badge');

    function setActiveView(viewId) {
        views.forEach(v => v.classList.remove('active'));
        navItems.forEach(n => n.classList.toggle('active', n.dataset.view === viewId));
        const view = document.getElementById(`view-${viewId}`);
        if (view) view.classList.add('active');
        const titleText = viewId === 'tasks' && currentUser?.role === 'member'
            ? 'My Tasks'
            : titles[viewId] || 'Dashboard';
        pageTitle.textContent = titleText;
    }

    function updateSidebarUser(user) {
        const initials = user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'GU';
        document.querySelector('.user-avatar').textContent = initials;
        document.querySelector('.user-name').textContent = user.name || 'Guest User';
        document.querySelector('.user-role').textContent = user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Visitor';
        profileName.textContent = user.name || 'Guest User';
        profileEmail.textContent = user.email || 'guest@demo.com';
        profileRole.textContent = user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Visitor';
    }

    async function loadCurrentUser() {
        if (!currentToken) {
            navItems.forEach(n => n.classList.remove('active'));
            currentUser = { name: 'Guest User', email: 'guest@demo.com', role: 'Visitor' };
            updateSidebarUser(currentUser);
            setGuestState();
            setActiveView('login');
            return;
        }

        try {
            const res = await authFetch(`${API_BASE}/auth/me`, {
                method: 'GET'
            });
            const data = await res.json();
            if (res.ok && data.user) {
                currentUser = data.user;
                updateSidebarUser(currentUser);
                setAuthState();
                setRoleState(currentUser.role);
                updateRoleBadge(currentUser.role);
                if (currentUser.role === 'member') {
                    setActiveView('tasks');
                } else {
                    setActiveView('dashboard');
                }
                refreshActiveView();
                return;
            }
        } catch (err) {
            console.error('Error loading current user:', err);
        }

        localStorage.removeItem('token');
        currentToken = null;
        navItems.forEach(n => n.classList.remove('active'));
        currentUser = { name: 'Guest User', email: 'guest@demo.com', role: 'Visitor' };
        updateSidebarUser(currentUser);
        setGuestState();
        setActiveView('login');
    }

    async function loginUser(email, password) {
        try {
            const res = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (!res.ok) {
                alert(data.error || 'Login failed.');
                return false;
            }
            currentToken = data.token;
            localStorage.setItem('token', currentToken);
            currentUser = data.user;
            updateSidebarUser(currentUser);
            setAuthState();
            return true;
        } catch (err) {
            console.error('Login error:', err);
            alert('Unable to login. Please try again later.');
            return false;
        }
    }

    function updateRoleBadge(role) {
        if (!roleBadge) return;
        const label = role === 'admin'
            ? 'Admin'
            : role === 'manager'
                ? 'Manager'
                : role === 'member'
                    ? 'Member'
                    : 'Guest';
        roleBadge.textContent = `${label} Access`;
    }

    function logoutUser() {
        currentToken = null;
        currentUser = { name: 'Guest User', email: 'guest@demo.com', role: 'Visitor' };
        localStorage.removeItem('token');
        updateSidebarUser(currentUser);
        setGuestState();
        updateRoleBadge('Visitor');
        setActiveView('login');
    }

    function isNavAllowed(item) {
        const roles = item.dataset.roles ? item.dataset.roles.split(',') : [];
        return !roles.length || roles.includes(currentUser.role);
    }

    function openProfile() {
        if (currentUser && currentUser.id) {
            setActiveView('profile');
        } else {
            setActiveView('login');
        }
    }

    showRegister.addEventListener('click', () => setActiveView('register'));
    showLogin.addEventListener('click', () => setActiveView('login'));
    gotoRegisterBtn.addEventListener('click', () => setActiveView('register'));

    function togglePasswordVisibility(input, button) {
        const isHidden = input.type === 'password';
        input.type = isHidden ? 'text' : 'password';
        button.textContent = isHidden ? '🙈' : '👁️';
    }

    toggleLoginPassword.addEventListener('click', () => togglePasswordVisibility(loginPassword, toggleLoginPassword));
    toggleRegisterPassword.addEventListener('click', () => togglePasswordVisibility(registerPassword, toggleRegisterPassword));
    toggleRegisterConfirmPassword.addEventListener('click', () => togglePasswordVisibility(registerConfirmPassword, toggleRegisterConfirmPassword));

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = registerName.value.trim();
        const email = registerEmail.value.trim();
        const password = registerPassword.value.trim();
        const confirmPassword = registerConfirmPassword.value.trim();

        if (!name || !email || !password || !confirmPassword) {
            alert('Name, email, password, and confirm password are required.');
            return;
        }

        if (password !== confirmPassword) {
            alert('Passwords do not match. Please check and try again.');
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });
            const data = await res.json();
            if (!res.ok) {
                alert(data.error || 'Registration failed.');
                return;
            }
            alert('Registration successful! Please login.');
            setActiveView('login');
            registerForm.reset();
        } catch (err) {
            console.error('Registration error:', err);
            alert('Unable to register. Please try again later.');
        }
    });

    menuToggle.addEventListener('click', toggleMobileMenu);
    sidebarClose.addEventListener('click', closeMobileMenu);
    sidebarOverlay.addEventListener('click', closeMobileMenu);

    userInfo.addEventListener('click', openProfile);
    logoutBtn.addEventListener('click', logoutUser);

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = loginEmail.value.trim();
        const password = loginPassword.value.trim();
        if (!email || !password) {
            alert('Email and password are required.');
            return;
        }
        const success = await loginUser(email, password);
        if (success) {
            setActiveView('dashboard');
            refreshActiveView();
        }
    });

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            if (item.classList.contains('requires-auth') && !currentToken) {
                alert('Please login to access this section.');
                setActiveView('login');
                return;
            }

            if (!isNavAllowed(item)) {
                alert('You do not have access to this section.');
                setActiveView('tasks');
                return;
            }

            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');

            const viewId = item.dataset.view;
            setActiveView(viewId);

            if (viewId === 'dashboard') loadDashboard();
            if (viewId === 'kanban') loadKanban();
            if (viewId === 'tasks') loadTasksList();
            if (viewId === 'projects') loadProjects();
            if (viewId === 'team') loadTeam();

            closeMobileMenu();
        });
    });

    loadCurrentUser();

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
            const res = await authFetch(`${API_BASE}/tasks`, {
                method: 'POST',
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
            try {
                const res = await authFetch(`${API_BASE}/tasks?search=${encodeURIComponent(query)}`);
                const data = await res.json();
                if (data.status === 'success') {
                    renderTasksTable(data.tasks);
                    navItems.forEach(n => n.classList.remove('active'));
                    document.getElementById('nav-tasks').classList.add('active');
                    views.forEach(v => v.classList.remove('active'));
                    document.getElementById('view-tasks').classList.add('active');
                    pageTitle.textContent = `Search: "${query}"`;
                }
            } catch (err) {
                console.error('Search error:', err);
            }
        }
    });

    // ─── Filters ─────────────────────────────────────────
    document.getElementById('filter-status').addEventListener('change', loadTasksList);
    document.getElementById('filter-priority').addEventListener('change', loadTasksList);

    // ─── Dashboard ───────────────────────────────────────
    async function loadDashboard() {
        try {
            const res = await authFetch(`${API_BASE}/analytics`);
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
            const res = await authFetch(`${API_BASE}/tasks`);
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
                    await authFetch(`${API_BASE}/tasks/${taskId}/status`, {
                        method: 'PATCH',
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

            const res = await authFetch(url);
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
            const res = await authFetch(`${API_BASE}/projects`);
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
            const res = await authFetch(`${API_BASE}/auth/users`);
            const data = await res.json();
            const grid = document.getElementById('team-grid');
            const users = data.users || [];

            if (!res.ok || users.length === 0) {
                grid.innerHTML = `<div class="empty-state">No team members available at the moment.</div>`;
                return;
            }

            grid.innerHTML = users.map(user => {
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
            document.getElementById('team-grid').innerHTML = `<div class="empty-state">Unable to load team members. Please refresh.</div>`;
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
    loadCurrentUser();

    // Make deleteTask accessible to inline onclick handlers
    window.deleteTask = async function deleteTask(id) {
        if (!confirm('Delete this task?')) return;
        try {
            const res = await authFetch(`${API_BASE}/tasks/${id}`, { method: 'DELETE' });
            if (res.ok) {
                refreshActiveView();
            } else {
                const data = await res.json();
                alert(data.error || 'Unable to delete task.');
            }
        } catch (err) {
            console.error('Error deleting task:', err);
            alert('Unable to delete task. Please try again.');
        }
    };
});
