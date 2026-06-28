# Role-Based Access Control (RBAC) and Authentication Guide

## 1. What this app does now

This app uses two related ideas:

- **Authentication**: Checking who the user is (login/register).
- **Authorization**: Deciding what that user can do based on their role.

We added these roles:

- `admin`
- `manager`
- `member`

Each role can do different things.

## 2. Authentication vs Authorization

### Authentication
Authentication is like showing your school ID card at the gate.
If your ID is valid, you enter.

In this app:
- Users login with email and password.
- The backend returns a JWT token after successful login.
- The frontend stores that token in `localStorage`.
- The token is sent with each API request.

### Authorization
Authorization is deciding which rooms you can enter once you are inside the school.
It depends on your role.

In this app:
- `admin` can access everything.
- `manager` can access team, projects, and analytics.
- `member` can access only their own tasks and profile.

## 3. JWT: JSON Web Token (easy idea)

A JWT is like a secret note from the server that says:
- who the user is
- their role
- when the token expires

The server signs this note with a secret key so clients cannot fake it.

### How it works here
1. User logs in.
2. Backend checks email and password.
3. Backend sends back a token with `id`, `email`, and `role`.
4. Frontend saves the token.
5. For every protected API call, frontend sends `Authorization: Bearer <token>`.
6. Backend checks the token and knows the user.

## 4. Backend changes we made

### `backend/middleware/auth.js`
This file checks the token and enforces roles.

- `authMiddleware(req, res, next)`
  - Reads token from `Authorization` header.
  - Verifies it.
  - Puts user info into `req.user`.

- `authorize(...roles)`
  - Used after authentication.
  - Checks if `req.user.role` is allowed.

### `backend/routes/auth.js`
This file handles login, register, and user profile.

Key changes:
- `POST /api/auth/register`
  - Always sets new account role to `member`.
  - Prevents users from choosing admin or manager.
- `GET /api/auth/me`
  - Returns current user profile.
- `GET /api/auth/users`
  - Only accessible to `admin` and `manager`.

### `backend/routes/tasks.js`
This file handles tasks.

Key restrictions:
- All task routes require authentication.
- `GET /api/tasks`
  - `admin` and `manager` see all tasks.
  - `member` sees only tasks assigned to them.
- `GET /api/tasks/:id`, `PUT`, `PATCH`, `DELETE`
  - If `member`, they can only act on tasks assigned to them.
- `POST /api/tasks`
  - Members can only create tasks assigned to themselves.

### `backend/routes/projects.js`
This file handles project data.

Key restriction:
- only `admin` and `manager` can access project routes.

### `backend/server.js`
We also protected analytics:
- `GET /api/analytics` is available only to `admin` and `manager`.

## 5. Frontend changes we made

### 5.1 Role-aware navigation

The sidebar now uses `data-roles` to control who sees which buttons:
- `admin` and `manager` see `Dashboard`, `Projects`, `Team`.
- `member` sees only `Tasks` and `Profile`.

### 5.2 Member experience

If a member logs in:
- they land on the `Tasks` page.
- the page title shows `My Tasks`.
- this avoids showing dashboard analytics that members should not use.

### 5.3 Role badge

The app displays a badge in the top bar showing the current role:
- `Admin Access`
- `Manager Access`
- `Member Access`
- `Guest`

### 5.4 Register/login improvements

We added a nicer register form with:
- confirm password field
- password visibility toggle
- a separate register button on the login view

## 6. Why this is a good learning model

This is a good starter setup because it teaches the two main security ideas:

1. **Who are you?**  — login and token check.
2. **What can you do?** — role checks and route protection.

Real companies often add more detail, such as:
- project-level membership
- permissions like `can_edit_task` or `can_view_team`
- audit logs and stronger role definitions

But for a beginner project, this is a good and realistic starting point.

## 7. Simple analogy for each role

- `admin` = school principal. Can enter every room, change rules, and see all reports.
- `manager` = teacher. Can see the class, manage projects, and view team reports.
- `member` = student. Can only see their own homework and profile.

## 8. Learn these concepts next

If you want to study more, focus on:

- JWT authentication
- Express middleware
- role-based access control (RBAC)
- frontend route/UI gating
- security best practices (never trust the frontend alone)

## 9. How to read the code

Start with these files:
- `backend/middleware/auth.js`
- `backend/routes/auth.js`
- `backend/routes/tasks.js`
- `backend/routes/projects.js`
- `frontend/public/js/app.js`
- `frontend/public/index.html`

Each file shows one part of the system:
- `auth.js` = security gate
- route files = what each user can do
- frontend app = how the app behaves for each role

## 10. Summary

This app now has a basic but practical role system:
- registration creates ordinary members
- login gives a token
- backend checks the token and the role
- manager/admin can see more than a member
- member can only access tasks assigned to them

That is a solid, real-world concept for a school-level learning project.
