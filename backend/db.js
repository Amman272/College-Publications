import mysql from 'mysql2/promise';

export const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'nri_portal',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const initDb = async () => {
    try {
        const connection = await db.getConnection();
        console.log('Connected to MySQL database');

        await connection.query(`
            CREATE TABLE IF NOT EXISTS publications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                mainAuthor TEXT,
                title TEXT,
                email TEXT,
                phone TEXT,
                dept TEXT,
                coauthors TEXT,
                journal TEXT,
                publisher TEXT,
                year INT,
                vol TEXT,
                issueNo TEXT,
                pages TEXT,
                indexation TEXT,
                issnNo TEXT,
                journalLink TEXT,
                ugcApproved TEXT,
                impactFactor TEXT,
                pdfUrl TEXT
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS admins (
                id INT AUTO_INCREMENT PRIMARY KEY,
                EMAIL VARCHAR(255) UNIQUE NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS audit_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_email TEXT,
                action TEXT,
                details TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        connection.release();
        console.log('Database tables initialized');
    } catch (error) {
        console.error('Error initializing database:', error);
    }
};

initDb();
