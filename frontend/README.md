# Savoris frontend

Frontend thuần HTML/CSS/JavaScript. Chạy bằng VS Code Live Server, không cần build.

## Chạy ứng dụng

1. Khởi động MySQL và backend theo hướng dẫn tại `D:\foodorder_backend\backend\README.md`.
2. Mở `frontend/index.html` bằng Live Server. Nếu Live Server đang bật ở thư mục gốc repository, dùng URL `/frontend/index.html`; nếu bật ở chính thư mục `frontend`, dùng `/index.html`.
3. Mở `/pages/items.html` để duyệt món, lọc danh mục/giá, thêm vào giỏ và đặt hàng.
4. Đăng ký/đăng nhập để dùng trang cá nhân, đổi mật khẩu và xem lịch sử đơn.

Frontend gọi backend ở `js/config.js` (`http://127.0.0.1:8000/api`). Trang thực đơn và tài khoản dùng đường dẫn tương đối để hoạt động với cả hai kiểu thư mục Live Server.

## Tính năng

- Đăng ký, đăng nhập, cập nhật hồ sơ và đổi mật khẩu.
- Thực đơn có tìm kiếm, danh mục, sắp xếp và lọc giá/đánh giá.
- Giỏ hàng được lưu trên trình duyệt, có thể sửa số lượng và nhập voucher `SAVORIS10` hoặc `WELCOME15`.
- Phải đăng nhập để mở giỏ hàng; sau khi đăng nhập sẽ quay lại đúng giỏ hàng đã chọn.
- Tạo đơn hàng COD hoặc ghi nhận yêu cầu chuyển khoản; xem lịch sử đơn trong trang tài khoản.

Thanh toán online qua cổng ngân hàng chưa được bật vì cần thông tin tài khoản/nhà cung cấp thanh toán của cửa hàng. Chọn chuyển khoản hiện chỉ tạo đơn ở trạng thái chờ thanh toán.

Ảnh món được tải từ Unsplash nên trình duyệt cần kết nối Internet để hiển thị ảnh và thư viện Axios.
