# Unified Assessment Platform

A full-stack Assessment Management System built using:

-   Backend: Node.js, Express.js, MongoDB
-   Frontend: React (Vite), Ant Design, TailwindCSS
-   Authentication: JWT-based authentication
-   Role-based system: Admin, Instructor, Student

------------------------------------------------------------------------

# Project Structure

    unified-assessment-platform/
    │
    ├── backend/     # Express.js API
    └── frontend/    # React (Vite) Application

------------------------------------------------------------------------

## Backend Folder Contains

-   server.js (Application entry point)
-   config/dbconfig.js (MongoDB configuration)
-   routes/
-   controllers/
-   middleware/
-   .env (Environment variables)

------------------------------------------------------------------------

## Frontend Folder Contains

-   React source code
-   Vite configuration
-   .env (API base URL)

------------------------------------------------------------------------

# Step 1: Setup MongoDB

You can run MongoDB in two ways:

## Option A: Install MongoDB Locally

1.  Download MongoDB Community Edition:
    https://www.mongodb.com/try/download/community
2.  Install MongoDB.
3.  Start MongoDB service.
4.  Default connection string:

```{=html}
<!-- -->
```
    mongodb://localhost:27017/uap_db

------------------------------------------------------------------------

## Option B: Run MongoDB Using Docker (Recommended)

Run in PowerShell:

    docker run -d ^
      --name mongodb ^
      -p 27017:27017 ^
      -e MONGO_INITDB_ROOT_USERNAME=admin ^
      -e MONGO_INITDB_ROOT_PASSWORD=admin123 ^
      mongo

Docker connection string:

    mongodb://admin:admin123@localhost:27017/uap_db?authSource=admin

Verify container:

    docker ps

------------------------------------------------------------------------

# Step 2: Backend Setup

Navigate to backend folder:

    cd backend

Install dependencies:

    npm install

Run backend server:

    npm run dev

Backend will start at:

    http://localhost:5000

Health check endpoint:

    http://localhost:5000/api/health

------------------------------------------------------------------------

# Step 3: Frontend Setup

Navigate to frontend folder:

    cd frontend

Install dependencies:

    npm install

Run frontend:

    npm run dev

Frontend runs at:

    http://localhost:3000

OR

    http://localhost:5173

------------------------------------------------------------------------

# Environment Variables

## Backend .env

    PORT=5000
    MONGODB_URI=mongodb://localhost:27017/uap_db
    JWT_SECRET=dev_secret_key
    JWT_EXPIRE=24h
    NODE_ENV=development

If using Docker MongoDB:

    MONGODB_URI=mongodb://admin:admin123@localhost:27017/uap_db?authSource=admin

------------------------------------------------------------------------

## Frontend .env

    VITE_API_URL=http://localhost:5000/api

------------------------------------------------------------------------

# Full Startup Order

1.  Start MongoDB (Local or Docker)
2.  Start Backend → npm run dev
3.  Start Frontend → npm run dev
4.  Open browser → http://localhost:3000

------------------------------------------------------------------------

# Important Note From MySide regarding .env files

⚠ This is an internship development project.

For simplicity, `.env` files are included in the repository.

In real-world production applications:

-   `.env` files should NOT be pushed to GitHub.
-   Secrets like database passwords and JWT keys must be kept private.
-   `.env.example` files should be used instead.

Since this project is for development and contains no confidential
production credentials, `.env` files are included to simplify setup.

------------------------------------------------------------------------
