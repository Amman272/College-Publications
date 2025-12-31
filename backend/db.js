import Database from "better-sqlite3";


export const db = new Database(process.env.DB_PATH || "nri_portal.db", { timeout: 10000 });
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('temp_store = MEMORY');


// create table only once when app boots
db.prepare(`
CREATE TABLE IF NOT EXISTS publications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mainAuthor TEXT,
    title TEXT,
    email TEXT,
    phone TEXT,
    dept TEXT,
    coauthors TEXT,
    journal TEXT,
    publisher TEXT,
    year INTEGER,
    vol TEXT,
    issueNo TEXT,
    pages TEXT,
    indexation TEXT,
    issnNo TEXT,
    journalLink TEXT,
    ugcApproved TEXT,
    impactFactor TEXT,
    pdfUrl TEXT
);
`).run();

// admin table
db.prepare(`
    CREATE TABLE IF NOT EXISTS admins(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    EMAIL TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP);`).run();

// audit logs table
db.prepare(`
    CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_email TEXT,
        action TEXT,
        details TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );`).run();


