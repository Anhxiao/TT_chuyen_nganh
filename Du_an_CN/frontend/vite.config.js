import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
plugins: [react()],

// Nếu bạn muốn chạy ở port cố định
server: {
    port: 5173,
    open: true, // tự mở trình duyệt khi chạy
},

// Nếu có alias path (tùy chọn)
resolve: {
    alias: {
    '@': '/src',
    },
},
})