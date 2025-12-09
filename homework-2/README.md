# Online Code Editor

A collaborative, real-time code editor built with React and FastAPI.

**Live Demo:** [https://codeinterview-282676864546.us-central1.run.app](https://codeinterview-282676864546.us-central1.run.app)

## Overview
This application provides a web-based environment for writing and running code. It features:
- **Code Editing**: Syntax highlighting for JavaScript and Python using CodeMirror.
- **Persistence**: Files are saved to a SQLite database.
- **Collaboration**: Simulates real-time collaboration with remote cursors (currently single-user simulation).
- **File Management**: Create, load, and save files.
- **Notifications**: Toast service for seamless user feedback.

## Architecture

The project is structured as a monorepo with `frontend` and `backend` directories.

### Frontend
- **Framework**: React 19 w/ Vite.
- **Editor**: `@uiw/react-codemirror` (CodeMirror 6).
- **State Management**: React Hooks (`useState`, `useEffect`).
- **Styling**: Vanilla CSS with CSS variables.
- **Testing**: Playwright for E2E integration tests.

### Backend
- **Framework**: FastAPI (Python).
- **Database**: SQLite with `sqlmodel` ORM.
- **Environment**: Managed via Conda (`aitools` env).

## Prerequisites
- **Node.js**: v18+ (for frontend).
- **Python**: 3.9+ (for backend).
- **Conda**: Installed with an environment named `aitools` containing `fastapi`, `uvicorn`, `sqlmodel`, etc.

## Getting Started

### 1. Installation
Install frontend dependencies:
```bash
npm install
```

### 2. Running the Application
To start both the backend and frontend concurrently:
```bash
npm run dev
```
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:8000

The command uses `concurrently` to run:
- Backend: `uvicorn main:app --reload` (via `aitools` python)
- Frontend: `vite`

### 3. Running Tests
To run the integration suite:
```bash
npm run test
```
This command will:
1. Start the backend server.
2. Run the Playwright E2E tests (`frontend/e2e/integration.spec.js`).
3. Automatically shut down the backend upon completion.

## Project Structure
```
homework-2/
├── backend/            # Python FastAPI application
│   ├── database.py     # Database connection & config
│   ├── main.py         # App entry point
│   ├── models.py       # SQLModel definitions
│   └── routers/        # API endpoints
├── frontend/           # React application
│   ├── e2e/            # Playwright tests
│   ├── src/            # Source code
│   └── playwright.config.js
├── package.json        # Root scripts (dev, test)
└── README.md           # This file
```

## Docker

You can run the entire application (frontend + backend) in a single container.

### Build
```bash
docker build -t codeinterview .
```

### Run
```bash
docker run -p 8000:8000 codeinterview
```

The application will be available at `http://localhost:8000`.
