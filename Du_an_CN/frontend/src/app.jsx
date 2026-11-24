import { Routes, Route } from 'react-router-dom';

import Home from './pages/Home';
import StudentLogin from './pages/StudentLogin';
import OrganizerLogin from './pages/OrganizerLogin';
import StudentDashboard from './pages/StudentDashboard';
import OrganizerDashboard from './pages/OrganizerDashboard';
import ActivitiesStudent from "./pages/ActivitiesStudent";
import Notifications from "./pages/Notifications";
import StudentProfile from "./pages/StudentProfile.jsx";
import IntroductionCNTTStudent from "./pages/IntroductionCNTTStudent.jsx";
import IntroductionKTStudent from "./pages/IntroductionKTStudent.jsx";
import IntroductionYDStudent from "./pages/IntroductionYDStudent.jsx";
import StudentActivityHistory from "./pages/StudentActivityHistory.jsx";
import StudentEvidence from "./pages/StudentEvidence.jsx";
import IntrodutionKNSStudent from "./pages/IntrodutionKNSStudent.jsx";
import IntrodutionTTStudent from "./pages/IntrodutionTTStudent.jsx";
import IntrodutionVHNTStudent from "./pages/IntrodutionVHNTStudent.jsx";
import NontificationOrganizer from "./pages/NontificationOrganizer";
import CreateActivity from "./pages/CreateActivity";
import OrganizerActivityHistory from "./pages/OrganizerActivityHistory";
import OrganizerActivityDetail from "./pages/OrganizerActivityDetail";
import OrganizerOrganizationIntroduction from "./pages/OrganizerOrganizationIntroduction";
import ActivityDetail from "./pages/ActivityDetail";

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
            <Route path="/activities/:activityId" element={<ActivityDetail />} />
            <Route path="/student/notifications" element={<Notifications />} />
            <Route path="/student/profile" element={<StudentProfile />} />
            <Route path="/student/introduction/cntt" element={<IntroductionCNTTStudent />} />
            <Route path="/student/introduction/kt" element={<IntroductionKTStudent />} />
            <Route path="/student/introduction/yd" element={<IntroductionYDStudent />} />
            <Route path="/student/history/activities" element={<StudentActivityHistory />} />
            <Route path="/student/history/evidence" element={<StudentEvidence />} />
            <Route path="/student/introduction/clb-ky-nang-song" element={<IntrodutionKNSStudent />} />
            <Route path="/student/introduction/clb-truyen-thong" element={<IntrodutionTTStudent />} />
            <Route path="/student/introduction/clb-van-hoa-nghe-thuat" element={<IntrodutionVHNTStudent />} />
            {/* Dashboard đơn vị tổ chức */}
            <Route path="/organizer/dashboard" element={<OrganizerDashboard />} />
            <Route path="/organizer/notifications" element={<NontificationOrganizer />} />
            <Route path="/organizer/activities/create" element={<CreateActivity />} />
            <Route path="/organizer/history" element={<OrganizerActivityHistory />} />
            <Route path="/organizer/activities/:activityId" element={<OrganizerActivityDetail />} />
            <Route path="/organizer/introduction" element={<OrganizerOrganizationIntroduction />} />
        </Routes>
    );
}

export default App;