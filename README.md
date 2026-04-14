# ⚡ TaskFlow — Smart Management System

A full-stack task and project management dashboard with Kanban board, analytics, team collaboration, and JWT authentication. Built during a hackathon in 24 hours.

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.18-000000?logo=express&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?logo=javascript&logoColor=black)

## 🚀 Features

### Dashboard
- **Real-time analytics** with task completion rates, priority breakdown, and team productivity
- **Interactive charts** using Chart.js (doughnut, bar charts)
- **Recent activity feed** showing latest task updates

### Kanban Board
- **Drag-and-drop** task management across To Do → In Progress → Done
- **Visual priority indicators** (High/Medium/Low color coding)
- **Real-time updates** via REST API

### Task Management
- Full **CRUD** operations (Create, Read, Update, Delete)
- **Filtering** by status, priority, and search
- **Sortable** task table with all metadata

### Authentication & Authorization
- **JWT-based** authentication (register/login)
- **Role-based access control** (Admin, Manager, Member)
- Secure password hashing with **bcrypt**

### Team Management
- View all team members with roles
- Task assignment to team members

## 🏗️ Architecture

```
smart-management-system/
├── backend/
│   ├── server.js              # Express server + analytics API
│   ├── config/
│   │   └── db.js              # In-memory DB (swappable with MongoDB)
│   ├── middleware/
│   │   └── auth.js            # JWT verification + role authorization
│   ├── routes/
│   │   ├── auth.js            # Register, Login, Profile
│   │   ├── tasks.js           # Task CRUD + status updates
│   │   └── projects.js        # Project CRUD + task stats
│   └── package.json
├── frontend/
│   └── public/
│       ├── index.html         # Single-page dashboard UI
│       ├── css/style.css      # Dark theme with glassmorphism
│       └── js/app.js          # SPA logic, API calls, Chart.js
└── README.md
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Node.js, Express.js |
| **Auth** | JWT (jsonwebtoken), bcryptjs |
| **Frontend** | HTML5, CSS3, Vanilla JavaScript |
| **Charts** | Chart.js 4.x |
| **Database** | In-memory (production: MongoDB) |

## 📦 Installation & Setup

```bash
# 1. Clone the repository
git clone https://github.com/Sankethmundas/smart-management-system.git
cd smart-management-system

# 2. Install backend dependencies
cd backend
npm install

# 3. Start the server (serves both API and frontend)
npm start
```

Visit `http://localhost:5000` in your browser.

### Demo Credentials
- **Admin:** sanketh@demo.com / admin123
- **Manager:** priya@demo.com / pass123
- **Member:** rahul@demo.com / pass123

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Create new account |
| `POST` | `/api/auth/login` | Login (returns JWT) |
| `GET` | `/api/auth/me` | Get current user profile |
| `GET` | `/api/auth/users` | List all users |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/tasks` | Get all tasks (supports filters) |
| `POST` | `/api/tasks` | Create new task |
| `PUT` | `/api/tasks/:id` | Update task |
| `PATCH` | `/api/tasks/:id/status` | Update status (Kanban) |
| `DELETE` | `/api/tasks/:id` | Delete task |

### Projects & Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/projects` | Get all projects with stats |
| `POST` | `/api/projects` | Create new project |
| `GET` | `/api/analytics` | Dashboard analytics data |

## 🧠 Design Decisions

1. **In-Memory DB**: Used in-memory arrays for rapid prototyping (hackathon constraint). The `db.js` module is designed as a drop-in replacement for MongoDB/Mongoose models.

2. **Vanilla JS Frontend**: No React/Vue framework — demonstrates pure JavaScript DOM manipulation, event handling, and async fetch API usage.

3. **JWT Auth**: Stateless authentication allows horizontal scaling. Tokens expire in 24 hours.

4. **Role-Based Access**: Three-tier role system (Admin > Manager > Member) with middleware-level enforcement.

## 🔮 Future Improvements

- [ ] Migrate to MongoDB with Mongoose ODM
- [ ] Add WebSocket for real-time collaboration
- [ ] Email notifications for task assignments
- [ ] File attachments for tasks
- [ ] Activity log with audit trail
- [ ] Docker containerization

## 👤 Author

**Sankethkumar**  
- GitHub: [@Sankethmundas](https://github.com/Sankethmundas)
- LinkedIn: [sankethkumar14](https://linkedin.com/in/sankethkumar14)

## 📄 License

This project is licensed under the MIT License.
