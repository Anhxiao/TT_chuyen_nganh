# Bộ UML đầy đủ — Website đăng ký và quản lý hoạt động phục vụ cộng đồng của sinh viên

## Danh sách sơ đồ
1. `01-use-case-overview.puml` — Use Case tổng quan với 3 tác nhân và 22 Use Case.
2. `02-use-case-student.puml` — Use Case nhóm Sinh viên.
3. `03-use-case-organizer.puml` — Use Case nhóm Người quản lý hoạt động.
4. `04-use-case-admin.puml` — Use Case nhóm Quản trị viên.
5. `05-class-diagram.puml` — Sơ đồ lớp phân tích/thiết kế.
6. `06-er-diagram.puml` — Sơ đồ thực thể liên kết gần với mô hình MySQL.
7. `07-sequence-register-activity.puml` — Đăng ký hoạt động.
8. `08-sequence-review-registration.puml` — Duyệt đăng ký.
9. `09-sequence-confirm-participation.puml` — Xác nhận kết quả và ghi nhận điểm.
10. `10-sequence-login.puml` — Đăng nhập.
11. `11-activity-register.puml` — Sơ đồ hoạt động đăng ký.
12. `12-activity-confirm-points.puml` — Sơ đồ hoạt động xác nhận tham gia và điểm.
13. `13-state-activity.puml` — Vòng đời trạng thái hoạt động.
14. `14-state-registration.puml` — Vòng đời trạng thái đăng ký.
15. `15-component-architecture.puml` — Kiến trúc thành phần frontend/backend/database.
16. `16-deployment-diagram.puml` — Sơ đồ triển khai.
17. `17-package-diagram.puml` — Sơ đồ gói backend phân lớp.
18. `18-permission-matrix.puml` — Sơ đồ quyền ở mức nghiệp vụ.

## Cách sử dụng
- Giải nén gói này.
- Sao chép thư mục `docs/uml/` vào `Du_an_CN/docs/uml/`.
- Mở một file `.puml` trong VS Code có cài extension PlantUML.
- Dùng lệnh `PlantUML: Preview Current Diagram` hoặc phím tắt mặc định của extension.
- Xuất SVG để chèn vào Word khi cần phóng to; xuất PNG nếu chỉ cần ảnh thông thường.

## Quy ước và phạm vi
- `STUDENT`: Sinh viên.
- `ORGANIZER`: Người quản lý hoạt động/đại diện đơn vị tổ chức.
- `ADMIN`: Quản trị viên hệ thống.
- RBAC (phân quyền theo vai trò) được kết hợp kiểm tra phạm vi đơn vị/hoạt động.
- Sinh viên được cấp quyền đăng ký hoạt động phù hợp với phạm vi trường/khoa sau khi tài khoản và tư cách sinh viên được xác thực; hoạt động CLB yêu cầu tư cách thành viên hợp lệ. Điều này không đồng nghĩa đăng ký tự động được duyệt.
- Admin quản lý tài khoản, vai trò, cấu hình và nhật ký; không mặc nhiên có quyền xử lý danh sách đăng ký, xác nhận tham gia hoặc sửa điểm nghiệp vụ.
- Các sơ đồ là bộ thiết kế nhất quán ban đầu; cần rà soát với quy chế thực tế và schema SQL trước khi coi là đặc tả cuối cùng.
