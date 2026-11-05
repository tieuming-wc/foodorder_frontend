# Quy ước làm việc nhóm (branch · commit · PR)

Áp dụng cho repo nhóm **HN-KS25-CNTT1**. Mục tiêu: mỗi commit/PR gắn được với đúng task trên bảng công việc
nhờ **mã task** (ví dụ `T3C4593`) nằm ngay trong tên nhánh, commit message hoặc tiêu đề PR.

## 1. Mã task

Mỗi task có một mã dạng `T3C4593`. **Luôn viết hoa, không dấu cách**, đặt ở đầu nội dung.

## 2. Đặt tên nhánh

```
<loại>/t3c<4 số>-<mô-tả-ngắn-không-dấu>
```

| Loại | Dùng khi | Ví dụ |
|---|---|---|
| `feature/` | Làm chức năng mới | `feature/t3c4593-chay-base-code` |
| `fix/` | Sửa lỗi | `fix/t3c4593-loi-cors` |
| `docs/` | Chỉ sửa tài liệu | `docs/t3c4593-huong-dan-cai-dat` |
| `hotfix/` | Sửa gấp trên `main` | `hotfix/t3c4593-sai-mat-khau-db` |

Quy tắc:

- Mã task viết **thường** trong tên nhánh (`t3c4593`), phần mô tả cũng viết thường, nối bằng dấu `-`.
- Không dùng dấu tiếng Việt, không dấu cách, không viết hoa lẫn lộn.
- Mỗi task một nhánh, tách từ `main` mới nhất: `git switch main && git pull && git switch -c feature/t3c4593-...`
- Nhánh sống ngắn: xong việc → mở PR → merge → xoá nhánh.

## 3. Commit message

```
T3C4593: <mô tả ngắn, thể mệnh lệnh, không chấm cuối>
```

- Dòng đầu ≤ 72 ký tự, bắt đầu bằng **mã task + dấu hai chấm**.
- Dùng thể mệnh lệnh: "thêm", "sửa", "xoá", "cập nhật", "tách"… (không "đã thêm", "thêm xong").
- Một commit làm một việc; nếu cần giải thích dài thì cách 1 dòng trống rồi viết phần thân.
- Ví dụ:

```
T3C4593: thêm form đăng nhập
T3C4593: sửa lỗi CORS khi FE gọi API
T3C4593: cập nhật README hướng dẫn chạy MySQL
```

Commit có nhiều việc nên tách nhỏ:

```
T3C4593: thêm trang sản phẩm

- Thêm pages/products.html và js/pages/products.js
- Thêm link vào menu trong js/layout.js
```

## 4. Pull Request

- Tiêu đề PR: `T3C4593: <mô tả>` — **bắt buộc chứa mã task**.
- Mô tả PR: việc đã làm, cách chạy thử, ảnh chụp màn hình nếu có UI.
- Base branch: `main`. Người mở PR tự kiểm tra chạy được trước khi nhờ review.
- Ít nhất **1 thành viên khác review** rồi mới merge (squash & merge để lịch sử gọn).
- Không push trực tiếp lên `main`.

## 5. Việc không được commit

- File `.env` (chứa mật khẩu), thư mục `.venv/`, `__pycache__/`, `node_modules/`.
- File dữ liệu MySQL, ảnh chụp dung lượng lớn — để ngoài repo.

## 6. Quy trình chuẩn cho một task

```bash
git switch main
git pull origin main
git switch -c feature/t3c4593-chay-base-code

# ... làm việc ...

git add .
git commit -m "T3C4593: chạy được base code FE gọi API thành công"
git push -u origin feature/t3c4593-chay-base-code
# mở PR với tiêu đề: T3C4593: chạy được base code FE gọi API thành công
```
