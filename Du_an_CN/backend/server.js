
const { pool } = require('./src/config/database');

const services = {
    /**
     * Thực hiện truy vấn lấy dữ liệu.
     */
    async query(sql, params = []) {
        const [rows] = await pool.execute(sql, params);
        return rows;
    },

    /**
     * Thực hiện INSERT, UPDATE hoặc DELETE.
     */
    async execute(sql, params = []) {
        const [result] = await pool.execute(sql, params);

        return {
            affectedRows: result.affectedRows,
            insertId: result.insertId,
            changedRows: result.changedRows
        };
    },

    /**
     * Thực hiện nhiều thao tác trong một transaction.
     */
    async transaction(callback) {
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            const result = await callback(connection);

            await connection.commit();

            return result;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
};

module.exports = services;
