# Project Features Documentation

This document outlines the features currently implemented in the backend logic of the application.

## 1. Authentication System
The project implements a secure, One-Time Password (OTP) based authentication flow.

*   **OTP Generation & Login:**
    *   Endpoint: `POST /login/otpSend`
    *   Functionality: Accepts an email address and generates a 6-digit OTP.
    *   **Email Delivery:** Uses `nodemailer` to send a professional, HTML-styled email containing the OTP to the user.
    *   **Development Mode:** Currently, the OTP is hardcoded to `0` and the email sending function is commented out for testing purposes.
    *   **Security:** OTPs are stored temporarily in-memory and expire after 5 minutes.

*   **OTP Verification:**
    *   Endpoint: `POST /login/otpVerify`
    *   Functionality: Verifies the submitted OTP against the stored code for the given email.
    *   **Session Management:** Upon successful verification, generates a **JSON Web Token (JWT)**.
    *   **Token Policy:** The JWT is valid for 30 days and allows access to protected routes.

## 2. Publication Management (Form Handling)
A system to manage academic or article publications, backed by a SQLite database.

*   **Database Schema:**
    *   Uses `better-sqlite3`.
    *   Table `publications` stores: `mainAuthor`, `title`, `email`, `phone`, `dept`, `coauthors`, `journal`, `publisher`, `year`, `vol`, `issueNo`, `pages`, `indexation`, and `pdfUrl`.

*   **Submission (Protected):**
    *   Endpoint: `POST /form/formEntry`
    *   **Middleware:** Protected by `verifyToken` middleware. Only authenticated users (with a valid JWT) can submit forms.
    *   Functionality: Inserts publication details into the database.

*   **Retrieval:**
    *   Endpoint: `GET /form/formGet`
    *   Functionality: API to fetch all stored publication records from the database.

## 3. Infrastructure & Middleware
*   **Server:** Built with Node.js and Express.js (ES Modules).
*   **Security Middleware:**
    *   `verifyToken`: Intercepts requests, checks for the `Authorization` header, and verifies the validity of the JWT.
*   **CORS:** Cross-Origin Resource Sharing is enabled to allow frontend connections.
*   **Environment Configuration:** Uses `dotenv` to manage sensitive data like `JWT_SECRET`, `EMAIL_USER`, and `EMAIL_PASSWORD`.

## 4. Current Development Status Notes
*   **OTP Logic:** The random OTP generation line is currently commented out in favor of a static `0` for easier debugging.
*   **Email Dispatch:** The actual `sendEmail` call is currently commented out (`// await sendEmail(...)`) in `login.js`.
