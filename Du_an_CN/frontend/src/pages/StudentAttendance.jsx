
import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

const API_BASE_URL = "/api";

function StudentAttendance() {
    const [searchParams] = useSearchParams();
    const sessionToken = searchParams.get("token");

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [success, setSuccess] = useState(false);

    const accessToken = sessionStorage.getItem("accessToken");

    const handleCheckIn = async () => {
        if (!sessionToken) {
            setMessage("Mã QR không hợp lệ hoặc không tồn tại.");
            return;
        }

        if (!accessToken) {
            setMessage("Bạn cần đăng nhập bằng tài khoản sinh viên trước khi điểm danh.");
            return;
        }

        try {
            setLoading(true);
            setMessage("");
            setSuccess(false);

            const response = await fetch(
                `${API_BASE_URL}/attendance/check-in`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${accessToken}`
                    },
                    body: JSON.stringify({
                        sessionToken
                    })
                }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || "Không thể thực hiện điểm danh."
                );
            }

            setSuccess(true);
            setMessage(result.message || "Điểm danh thành công.");
        } catch (error) {
            setSuccess(false);
            setMessage(error.message || "Đã xảy ra lỗi khi điểm danh.");
        } finally {
            setLoading(false);
        }
    };

    if (!sessionToken) {
        return (
            <div className="container py-5 text-center">
                <h3>Không tìm thấy mã điểm danh</h3>
                <p>Vui lòng quét lại mã QR do đơn vị tổ chức cung cấp.</p>
                <Link to="/student/dashboard" className="btn btn-primary">
                    Về trang chủ
                </Link>
            </div>
        );
    }

    return (
        <div className="container py-5">
            <div
                className="card shadow-sm mx-auto"
                style={{ maxWidth: "550px" }}
            >
                <div className="card-body p-4 text-center">
                    <h3 className="mb-3">
                        XÁC NHẬN ĐIỂM DANH
                    </h3>

                    <p className="text-muted">
                        Hệ thống sẽ sử dụng tài khoản sinh viên đang đăng nhập
                        để xác định thông tin điểm danh.
                    </p>

                    {!accessToken ? (
                        <>
                            <div className="alert alert-warning">
                                Bạn chưa đăng nhập. Vui lòng đăng nhập tài khoản
                                sinh viên để tiếp tục.
                            </div>

                            <Link
                                to={`/student-login?redirect=${encodeURIComponent(
                                    `/student/attendance?token=${sessionToken}`
                                )}`}
                                className="btn btn-primary"
                            >
                                Đăng nhập sinh viên
                            </Link>
                        </>
                    ) : (
                        <>
                            <div className="alert alert-info">
                                Vui lòng xác nhận để ghi nhận sự tham gia
                                hoạt động của bạn.
                            </div>

                            <button
                                type="button"
                                className="btn btn-primary w-100"
                                onClick={handleCheckIn}
                                disabled={loading || success}
                            >
                                {loading
                                    ? "Đang xử lý..."
                                    : success
                                        ? "Đã điểm danh"
                                        : "Xác nhận điểm danh"}
                            </button>
                        </>
                    )}

                    {message && (
                        <div
                            className={`alert mt-3 mb-0 ${
                                success
                                    ? "alert-success"
                                    : "alert-danger"
                            }`}
                        >
                            {message}
                        </div>
                    )}

                    <div className="mt-4">
                        <Link to="/student/dashboard">
                            Quay lại trang sinh viên
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default StudentAttendance;
