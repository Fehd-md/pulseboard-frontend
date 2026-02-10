# PulseBoard — Frontend

Frontend application for PulseBoard, a modern Kanban dashboard designed for personal and professional organization.

## Stack

* React (TypeScript)
* Vite
* TailwindCSS
* DnD Kit (drag and drop)

---

## Features

* Kanban workflow interface
* Drag and drop card management
* Task, note, and goal categorization
* Tag filtering system
* Dark theme UI
* Real-time synchronization with backend API

---

## Project Structure

```
pulseboard-frontend/
├── src/
│   ├── assets/
│   ├── components/
│   ├── App.tsx
│   └── api.ts
├── public/
├── .env.example
├── package.json
└── vite.config.ts
```

---

## Requirements

* Node.js 20 or later
* Backend API running locally

Backend repository:

[https://github.com/Fehd-md/pulseboard-backend](https://github.com/Fehd-md/pulseboard-backend)

---

## Installation

Clone the repository:

```bash
git clone https://github.com/Fehd-md/pulseboard-frontend.git
cd pulseboard-frontend
npm install
```

---

## Environment Variables

Create a `.env` file:

```env
VITE_API_URL=http://localhost:4000
```

---

## Run the Application

```bash
npm run dev
```

The frontend will be available at:

```
http://localhost:5173
```

---

## Backend Connection

Ensure the backend server is running:

Health check:

```
http://localhost:4000/health
```

---

## Drag and Drop Workflow

Cards can be moved between the following columns:

* Todo
* Doing
* Done

Changes are persisted automatically through API updates.

---

## Production Build

```bash
npm run build
```

Build output directory:

```
/dist
```

Deployable on any static hosting platform (Vercel, Netlify, Nginx, Apache).

---

## Author

Fehd El Aboubi
Systems & Networks Administrator
