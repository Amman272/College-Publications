# Form React Application

## Project Structure
- `frontend`: React + Vite application
- `backend`: Express + Node.js application

## Prerequisites
- Node.js (v18 or higher recommended)
- npm

## Setup & Installation

### Backend
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Update `.env` with your actual values (Email credentials, JWT Secret, Frontend URL).

### Frontend
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Update `VITE_API_URL` if your backend is not running on `http://localhost:3000`.

## Development

1. Start the backend:
   ```bash
   cd backend
   npm run dev
   ```
2. Start the frontend:
   ```bash
   cd frontend
   npm run dev
   ```

## Production Deployment

### Backend
1. Ensure `.env` is configured with production values.
2. Start the server:
   ```bash
   npm start
   ```
   (This runs `node index.js`. Consider using a process manager like PM2 for production: `pm2 start index.js`)

### Frontend
1. Build the application:
   ```bash
   npm run build
   ```
2. The built files will be in `frontend/dist`. Serve these files using a static server (e.g., Nginx, Apache, or serve `dist` folder via backend if configured).

## Security Note
- The backend is configured with `helmet` for security headers and `cors` to restrict access to `FRONTEND_URL`.
- Ensure strict CORS settings in production.
