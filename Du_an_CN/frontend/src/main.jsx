import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './app.jsx';

// Bootstrap CSS
import 'bootstrap/dist/css/bootstrap.min.css';

// Bootstrap Icons
import 'bootstrap-icons/font/bootstrap-icons.css';

// CSS toàn cục
import './styles/global.css';

// Bootstrap JavaScript (dropdown, modal, collapse...)
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

// Khởi chạy ứng dụng React
ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
