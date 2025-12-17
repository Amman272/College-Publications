import Database from "better-sqlite3";


export const db = new Database(process.env.DB_PATH || "j.db");

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
    pdfUrl TEXT
);
`).run();
