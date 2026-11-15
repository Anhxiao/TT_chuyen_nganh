import { Routes, Route } from 'react-router-dom';

import Home from './pages/Home';
import StudentLogin from './pages/StudentLogin';
import OrganizerLogin from './pages/OrganizerLogin';
import StudentDashboard from './pages/StudentDashboard';
import OrganizerDashboard from './pages/OrganizerDashboard';
import ActivitiesStudent from "./pages/ActivitiesStudent";

function App() {
    return (
        <Routes>
            {/* Trang chủ */}
            <Route path="/" element={<Home />} />

            {/* Trang đăng nhập */}
            <Route path="/student-login" element={<StudentLogin />} />
            <Route path="/organizer-login" element={<OrganizerLogin />} />

            {/* Dashboard sinh viên */}
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            <Route path="/activities" element={<ActivitiesStudent />} />
            
            {/* Dashboard đơn vị tổ chức */}
            <Route path="/organizer/dashboard" element={<OrganizerDashboard />} />
            
        </Routes>
    );
}

export default App;