# Comprehensive Technical Discovery & Codebase Documentation

## 1. System Overview

This application is a **Faculty Publication Management System** designed to track, manage, and audit research publications by faculty members.

### Tech Stack
-   **Frontend**: React (Vite), TailwindCSS, Framer Motion, Axios.
-   **Backend**: Node.js, Express.js.
-   **Database**: SQLite (via `better-sqlite3`).
-   **Authentication**: Custom Email + OTP (One-Time Password) system with JWT (JSON Web Tokens).

### High-Level Architecture
1.  **Client (Frontend)**: A React Single Page Application (SPA) that acts as the user interface. It sends HTTP requests to the backend API.
2.  **Server (Backend)**: An Express.js server that handles API requests, enforces authentication, and interacts with the database.
3.  **Database**: A local file-based SQLite database (`nri_portal.db`) that stores all application data.

---

## 2. Database Schema

The application uses a relational SQLite database with three main tables.

### 2.1. `publications` Table
Stores the details of every research paper or publication.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | INTEGER | Primary Key, Auto-incremented unique ID. |
| `mainAuthor` | TEXT | Name of the primary author. |
| `title` | TEXT | **Unique**. Title of the publication. |
| `email` | TEXT | Email of the author (used for ownership checks). |
| `phone` | TEXT | Contact number. |
| `dept` | TEXT | Department (e.g., CSE, ECE). |
| `coauthors` | TEXT | Names of co-authors. |
| `journal` | TEXT | Name of the journal. |
| `publisher` | TEXT | Name of the publisher. |
| `year` | INTEGER | Year of publication. |
| `vol` | TEXT | Volume number. |
| `issueNo` | TEXT | Issue number. |
| `pages` | TEXT | Page numbers (e.g., "100-112"). |
| `indexation` | TEXT | Indexing service (SCI, SCOPUS, etc.). |
| `issnNo` | TEXT | ISSN number. |
| `journalLink` | TEXT | URL to the journal's website. |
| `ugcApproved` | TEXT | "Yes" or "No". |
| `impactFactor` | TEXT | Impact factor score. |
| `pdfUrl` | TEXT | Direct link to the paper/PDF. |

### 2.2. `admins` Table
Stores the list of users who have administrative privileges.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | INTEGER | Primary Key. |
| `EMAIL` | TEXT | **Unique**. Email address of the admin. |
| `created_at` | DATETIME | Timestamp of when they were added. |

### 2.3. `audit_logs` Table
Tracks important actions for security and accountability.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | INTEGER | Primary Key. |
| `user_email` | TEXT | Who performed the action. |
| `action` | TEXT | Type of action (e.g., `CREATE`, `DELETE`, `UPDATE`). |
| `details` | TEXT | Human-readable description of the event. |
| `timestamp` | DATETIME | Time of the event. |

---

## 3. Data Flow Diagram

```mermaid
graph TD
    User[User / Admin] -->|Interacts| Frontend[React Frontend]
    Frontend -->|HTTP Requests / JSON| Backend[Express Backend]
    
    subgraph "Backend Processes"
        AuthMiddleware[Verify Token]
        Router[Router Logic]
        Controller[Business Logic]
    end
    
    Backend --> AuthMiddleware
    AuthMiddleware --> Router
    Router --> Controller

## 4. Backend Architecture & Function Breakdown

### 4.1. Entry Point: `index.js`
This file initializes the server.

*   **Imports**: Loads Environment variables (`dotenv`), Express framework, and middleware (`cors`, `helmet`, `compression`).
*   **App Setup**: Creates the Express app instance.
*   **Middleware**:
    *   `helmet()`: Secures HTTP headers.
    *   `compression()`: Compresses response bodies for speed.
    *   `express.json()`: Parses incoming JSON request bodies.
    *   `cors(corsOptions)`: Restricts access to allowed origins (Localhost, Local Network, or configured Frontend URL).
*   **Admin Seeding**: On startup, it checks if the default admin (`ammanfawaz272@gmail.com`) exists. If not, it inserts it into the `admins` table.
*   **Route Mounting**:
    *   `/login` -> `loginRoutes`
    *   `/form` -> `FormRoutes` (`formHandling.js`)
    *   `/admin` -> `AdminRoutes` (`Admin.js`)
*   **Server Start**: Listens on port `3000` (or `PORT` env) and binds to `0.0.0.0` (all network interfaces).

### 4.2. Database Connection: `db.js`
Manages the SQLite connection.

*   **Initialization**: Opens `nri_portal.db`.
*   **Optimization**: Sets PRAGMA settings (`WAL` mode, `NORMAL` synchronous) for better performance and concurrency.
*   **Table Creation**: Automatically runs `CREATE TABLE IF NOT EXISTS` for `publications`, `admins`, and `audit_logs` ensures the DB is always ready.

### 4.3. Form Routes: `routers/formHandling.js`
Handles publication data entry, updates, and retrieval.

#### Helper Functions
*   **`isAdmin(email)`**:
    *   **Input**: Email string.
    *   **Logic**: Queries `admins` table for the email.
    *   **Output**: Boolean (`true` if admin, `false` otherwise).
*   **`logAction(userEmail, action, details)`**:
    *   **Input**: User email, action type (e.g., 'CREATE'), details string.
    *   **Logic**: Inserts a new row into `audit_logs`.
    *   **Output**: None (fire-and-forget).

#### API Endpoints

1.  **POST `/form/isAdmin`**
    *   **Purpose**: Checks if the current user is an admin.
    *   **Input**: JWT Token (Header).
    *   **Logic**: Decodes token -> Extract email -> `isAdmin(email)`.
    *   **Output**: `{ isAdmin: true/false }`.

2.  **POST `/form/formEntry`**
    *   **Purpose**: Creates a new publication entry.
    *   **Input**: JSON object with publication details (title, author, year, etc.).
    *   **Logic**:
        1.  Checks if `title` already exists (Uniqueness check).
        2.  If unique, executes `INSERT INTO publications`.
        3.  Calls `logAction` to record the event.
    *   **Output**: `{ message: "data stored successfully" }` or Error.

3.  **PUT `/form/formEntryUpdate`**
    *   **Purpose**: Updates an existing publication.
    *   **Input**: JSON object including `id` and fields to update.
    *   **Logic**:
        1.  Fetches existing entry by `id`.
        2.  **Authorization Check**: Verifies if `req.user.userEmail` matches the entry's `email` OR if user is Admin.
        3.  If authorized, executes `UPDATE publications ... WHERE id = ?`.
        4.  Logs the update.
    *   **Output**: Success message or 403 Forbidden.

4.  **DELETE `/form/deleteEntry/:id`**
    *   **Purpose**: Deletes a publication.
    *   **Input**: `id` from URL parameter.
    *   **Logic**:
        1.  Fetches entry to check ownership.
        2.  **Authorization Check**: Must be Owner or Admin.
        3.  Executes `DELETE FROM publications`.
        4.  Logs the deletion.
    *   **Output**: Success message or 403 Forbidden.

5.  **GET `/form/formGet`**
    *   **Purpose**: Retrieves all publications.
    *   **Input**: None.
    *   **Logic**: `SELECT * FROM publications`.
    *   **Output**: JSON Array of text objects.

6.  **GET `/form/downloadExcel`**
    *   **Purpose**: Generates an Excel file of all data.
    *   **Logic**:
        1.  Fetches all data.
        2.  Uses `exceljs` to create a Workbook and Worksheet.
        3.  Adds formatted Header row (colors, fonts).
        4.  Adds all data rows.
        5.  Streams file to response with correct Content-Type.

### 4.4. Admin Routes: `routers/Admin.js`
Handles administrative tasks.

1.  **GET `/admin/allAdmins`**
    *   **Logic**: Checks if requester is Admin -> Returns list of all admins.

2.  **POST `/admin/addAdmin`**
    *   **Logic**: Checks if requester is Admin -> Inserts new email into `admins` table.

3.  **POST `/admin/deleteAdmin`**
    *   **Logic**: Checks if requester is Admin -> Deletes target email from `admins`.
    *   **Safety**: Prevents admin from deleting themselves.

4.  **GET `/admin/logs`**
    *   **Logic**: Checks if requester is Admin -> Returns paginated rows from `audit_logs`.
    *   **Pagination**: Uses `LIMIT` and `OFFSET` based on `page` query param.

5.  **POST `/admin/deleteAll`**
    *   **Purpose**: **DANGER**. Deletes ALL publications.
    *   **Logic**: Checks if Admin -> `DELETE FROM publications`.

## 5. Frontend Architecture & Component Breakdown

### 5.1. Core Setup
*   **Framework**: React (Bootstrapped with Vite).
*   **Styling**: TailwindCSS (utility-first) + Framer Motion (animations).
*   **Routing**: `react-router-dom` handles navigation.
*   **State Management**: React `useState`, `useEffect`, and Context API (`AuthContext`).

### 5.2. API Service: `api/axios.js`
Centralized HTTP client configuration.

*   **Logic**:
    1.  Creates an Axios instance with base URL (from env or proxy).
    2.  **Request Interceptor**: Automatically attaches the JWT token from `localStorage` to the `Authorization` header (`Bearer <token>`) of every request.
    3.  This ensures all API calls are authenticated without manual token handling in each component.

### 5.3. Components

#### A. Main Entry: `App.jsx`
*   **Functionality**: Sets up the Router and defines all application routes.
*   **Protected Routes**:
    *   Implements a `<ProtectedRoute>` wrapper.
    *   Checks `isAuthenticated` from `AuthContext`.
    *   If false, redirects user to Home (`/`).
    *   Used for `/upload` and `/admin-dashboard`.

#### B. Authentication: `LoginModal.jsx`
*   **Purpose**: Handles user login via Email OTP.
*   **Flow**:
    1.  **Step 1 (Email)**: User enters email. Calls `/login/otpSend`.
    2.  **Step 2 (OTP)**: User enters received OTP. Calls `/login/otpVerify`.
    3.  **Success**: Receives JWT token, stores it in Context/LocalStorage, and closes modal.

#### C. Data Entry: `forms/UploadForm.jsx`
*   **Purpose**: The main form for adding or editing publications.
*   **Inputs**: Fields for Title, Author, Journal, Year, etc.
*   **Logic**:
    *   **State**: Manages `formData` object.
    *   **Dynamic Inputs**: "Indexation" dropdown allows "Other" to switch to a text input.
    *   **Submission**:
        *   If `initialData` exists -> **Edit Mode** (`PUT /form/formEntryUpdate`).
        *   Else -> **Create Mode** (`POST /form/formEntry`).
    *   **Feedback**: Shows Success/Error messages inline.

#### D. Admin Dashboard: `data/AdminPage.jsx`
*   **Purpose**: Central hub for administrators.
*   **Security**: Checks `isAdmin` flag. If false, shows "Access Denied".
*   **Features**:
    1.  **View Admins**: Lists all admins (`GET /admin/allAdmins`).
    2.  **Add/Remove Admin**: Forms to call `POST /admin/addAdmin` and `deleteAdmin`.
    3.  **Audit Logs**: Displays paginated table of system actions (`GET /admin/logs`).
    4.  **Danger Zone**: Button to "Delete All Data" (`POST /admin/deleteAll`), guarded by a double-confirmation prompt.

---

## 6. How It All Connects (Summary)

1.  **User Login**: Frontend `LoginModal` -> Backend `/login` -> Generates Token.
2.  **Data Submission**: Frontend `UploadForm` -> `axios` (with Token) -> Backend `/formEntry`.
    *   Backend checks Token -> Validates Data -> Writes to `nri_portal.db` -> Logs action.
3.  **Data Viewing**: Frontend `AdminPage` -> Backend `/admin/logs` -> Reads `audit_logs` table -> Displays in Table.

This architecture ensures a clear separation of concerns, secure data handling via tokens, and a robust audit trail for all modification actions.


