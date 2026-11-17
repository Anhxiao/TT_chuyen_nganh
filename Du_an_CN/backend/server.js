require('dotenv').config();

const app = require('./src/app');

const PORT = Number(process.env.PORT) || 5000;

const server = app.listen(PORT, () => {
    console.log('====================================');
    console.log('STUDENT ACTIVITY MANAGEMENT');
    console.log(`Backend đang chạy tại: http://localhost:${PORT}`);
    console.log(`Kiểm tra API: http://localhost:${PORT}/api/health`);
    console.log('====================================');
});

server.on('error', (error) => {
    console.error('Không thể khởi động Backend:', error.message);
});
