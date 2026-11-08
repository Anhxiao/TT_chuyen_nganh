import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';                    

// Bootstrap CSS
import 'bootstrap/dist/css/bootstrap.min.css';

// Bootstrap Icons
import 'bootstrap-icons/font/bootstrap-icons.css';

// Bootstrap JavaScript
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

// CSS toàn cục
import './styles/global.css';

// CSS header
import './styles/components/header.css';

// CSS footer
import './styles/components/footer.css';

// CSS index
import './styles/styles-index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);