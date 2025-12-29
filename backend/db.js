import Database from "better-sqlite3";


export const db = new Database(process.env.DB_PATH || "j.db", { timeout: 5000 });
db.pragma('journal_mode = WAL');


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


