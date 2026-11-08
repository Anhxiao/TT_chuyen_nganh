import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';                 // đổi tên App cũ thành Home nếu muốn
import StudentLogin from './pages/StudentLogin';
import OrganizerLogin from './pages/OrganizerLogin';

// Nếu bạn vẫn giữ nội dung trang chủ trong App.jsx thì đổi tên file thành Home.jsx
// hoặc giữ nguyên và import App làm trang chủ.

function App() {
    return (
        <BrowserRouter>
        <Routes>
            <Route path="/" element={<Home />} />                    {/* Trang chủ */}
            <Route path="/student-login" element={<StudentLogin />} />
            <Route path="/organizer-login" element={<OrganizerLogin />} />
        </Routes>
        </BrowserRouter>
    );
}

export default App;