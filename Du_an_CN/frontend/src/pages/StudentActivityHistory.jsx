import { useMemo, useState } from "react";
import Header from '../components/Header Student';
import Footer from "../components/Footer.jsx";
import "../styles/styles-student-history.css";

function StudentActivityHistory() {
    const [activities] = useState([]);
    const [filter, setFilter] = useState("ALL");
    const [keyword, setKeyword] = useState("");

    const filteredActivities = useMemo(() => {
        return activities.filter((activity) => {
            const matchesFilter =
                filter === "ALL" || activity.participationStatus === filter;

            const matchesKeyword = [
                activity.name,
                activity.organizationName
            ]
                .join(" ")
                .toLowerCase()
                .includes(keyword.toLowerCase());

            return matchesFilter && matchesKeyword;
        });
    }, [activities, filter, keyword]);

    const getStatusLabel = (status) => {
        const statuses = {
            ATTENDED: "Đã tham gia",
            PARTIAL: "Tham gia một phần",
            ABSENT: "Vắng mặt",
            PENDING: "Chưa xác nhận"
        };

        return statuses[status] || "Chưa cập nhật";
    };

    return (
        <>
            <Header />

            <main className="student-history-page">
                <div className="container">

                    {/* Breadcrumb */}
                    <div className="history-breadcrumb">
                        <span>Trang chủ</span>
                        <i className="bi bi-chevron-right"></i>
                        <span>Lịch sử</span>
                        <i className="bi bi-chevron-right"></i>
                        <strong>Hoạt động đã tham gia</strong>
                    </div>

                    {/* Tiêu đề */}
                    <section className="history-heading">
                        <div>
                            <span className="history-label">
                                QUẢN LÝ HOẠT ĐỘNG CÁ NHÂN
                            </span>
                            <h1>Lịch sử hoạt động đã tham gia</h1>
                            <p>
                                Theo dõi các hoạt động bạn đã đăng ký và kết quả
                                tham gia được đơn vị tổ chức xác nhận.
                            </p>
                        </div>

                        <div className="history-heading-icon">
                            <i className="bi bi-clock-history"></i>
                        </div>
                    </section>

                    {/* Thống kê */}
                    <section className="history-statistics">
                        <div className="history-stat-card">
                            <div className="history-stat-icon blue">
                                <i className="bi bi-calendar-check"></i>
                            </div>
                            <div>
                                <span>Tổng hoạt động</span>
                                <strong>{activities.length}</strong>
                            </div>
                        </div>

                        <div className="history-stat-card">
                            <div className="history-stat-icon green">
                                <i className="bi bi-check-circle"></i>
                            </div>
                            <div>
                                <span>Đã tham gia</span>
                                <strong>
                                    {activities.filter(
                                        item => item.participationStatus === "ATTENDED"
                                    ).length}
                                </strong>
                            </div>
                        </div>

                        <div className="history-stat-card">
                            <div className="history-stat-icon orange">
                                <i className="bi bi-star"></i>
                            </div>
                            <div>
                                <span>Tổng điểm</span>
                                <strong>
                                    {activities.reduce(
                                        (total, item) => total + (Number(item.points) || 0),
                                        0
                                    )}
                                </strong>
                            </div>
                        </div>
                    </section>

                    {/* Danh sách hoạt động */}
                    <section className="history-content">
                        <div className="history-section-heading">
                            <div>
                                <h2>Danh sách hoạt động</h2>
                                <p>Lịch sử đăng ký và kết quả tham gia của bạn</p>
                            </div>
                        </div>

                        {/* Bộ lọc */}
                        <div className="history-toolbar">
                            <div className="history-search">
                                <i className="bi bi-search"></i>
                                <input
                                    type="text"
                                    placeholder="Tìm tên hoạt động hoặc đơn vị tổ chức..."
                                    value={keyword}
                                    onChange={(e) => setKeyword(e.target.value)}
                                />
                            </div>

                            <select
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                            >
                                <option value="ALL">Tất cả trạng thái</option>
                                <option value="ATTENDED">Đã tham gia</option>
                                <option value="PARTIAL">Tham gia một phần</option>
                                <option value="ABSENT">Vắng mặt</option>
                                <option value="PENDING">Chưa xác nhận</option>
                            </select>
                        </div>

                        {filteredActivities.length > 0 ? (
                            <div className="history-activity-list">
                                {filteredActivities.map((activity) => (
                                    <article
                                        className="history-activity-card"
                                        key={activity.registrationId}
                                    >
                                        <div className="history-activity-icon">
                                            <i className="bi bi-people-fill"></i>
                                        </div>

                                        <div className="history-activity-info">
                                            <h3>{activity.name}</h3>

                                            <p>
                                                <i className="bi bi-building"></i>
                                                {activity.organizationName || "Chưa cập nhật đơn vị"}
                                            </p>

                                            <div className="history-activity-meta">
                                                <span>
                                                    <i className="bi bi-calendar-event"></i>
                                                    {activity.startDate || "Chưa cập nhật"}
                                                </span>

                                                <span>
                                                    <i className="bi bi-star"></i>
                                                    {activity.points ?? 0} điểm
                                                </span>
                                            </div>
                                        </div>

                                        <div className="history-activity-status">
                                            <span className={`history-status ${activity.participationStatus?.toLowerCase() || "pending"}`}>
                                                {getStatusLabel(activity.participationStatus)}
                                            </span>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        ) : (
                            <div className="history-empty">
                                <div className="history-empty-icon">
                                    <i className="bi bi-calendar2-x"></i>
                                </div>
                                <h3>Chưa có lịch sử hoạt động</h3>
                                <p>
                                    Các hoạt động bạn đã đăng ký và kết quả tham gia
                                    sẽ được hiển thị tại đây sau khi có dữ liệu.
                                </p>
                            </div>
                        )}
                    </section>
                </div>
            </main>

            <Footer />
        </>
    );
}

export default StudentActivityHistory;