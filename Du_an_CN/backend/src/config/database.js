const sql = require('mssql');
const dotenv = require('dotenv');

dotenv.config();

const dbConfig = {
    server: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 62138,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    options: {
        encrypt: false,                 // Để false nếu dùng local
        trustServerCertificate: true,   // Cần thiết khi chạy local
        enableArithAbort: true
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

// Tạo pool kết nối
const poolPromise = new sql.ConnectionPool(dbConfig)
    .connect()
    .then(pool => {
        console.log('Đã tạo pool kết nối SQL Server thành công.');
        return pool;
    })
    .catch(err => {
        console.error('Không thể tạo pool kết nối SQL Server:', err);
        throw err;
    });

/**
 * Kiểm tra kết nối database
 */
async function testDatabaseConnection() {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT 
                DB_NAME() AS database_name,
                @@VERSION AS sql_server_version
        `);

        console.log('Kết nối SQL Server thành công.');
        console.log('Cơ sở dữ liệu:', result.recordset[0].database_name);
        console.log('Phiên bản SQL Server:', result.recordset[0].sql_server_version.split('\n')[0]);

        return true;
    } catch (error) {
        console.error('Không thể kết nối SQL Server.');
        console.error('Mã lỗi:', error.code || 'UNKNOWN');
        console.error('Thông báo:', error.message);

        return false;
    }
}

/**
 * Đóng kết nối
 */
async function closeDatabaseConnection() {
    try {
        const pool = await poolPromise;
        await pool.close();
        console.log('Đã đóng kết nối SQL Server.');
    } catch (error) {
        console.error('Lỗi khi đóng kết nối:', error.message);
    }
}

module.exports = {
    sql,                // Export để dùng request, input...
    poolPromise,        // Dùng poolPromise thay vì pool như mysql2
    testDatabaseConnection,
    closeDatabaseConnection
};