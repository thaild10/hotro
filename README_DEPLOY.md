# Hướng dẫn triển khai (Deployment Guide)

Ứng dụng của bạn đã được chuyển đổi từ Firebase sang sử dụng **MySQL Database** nội bộ để chạy trên hosting riêng.

## Các bước triển khai:

1. **Upload mã nguồn**: Upload toàn bộ các file này lên thư mục trên hosting của bạn.
2. **Cấu hình Database**:
   - Mở file `.env` (nếu chưa có thì copy từ `.env.example`).
   - Điền thông tin Hostname, Database Name, Username, và Password mà bạn đã cung cấp.
3. **Chạy script thiết lập**:
   - Mở terminal tại thư mục gốc của ứng dụng.
   - Chạy lệnh: `bash setup.sh`
   - Script này sẽ cài đặt thư viện và build sẵn code vào thư mục `dist/`.
4. **Khởi chạy ứng dụng**:
   - Chạy lệnh: `npm start`
   - Ứng dụng sẽ chạy trên port **3000** (đã cấu hình để tương thích với Proxy trên hosting).

## Lưu ý quan trọng:
- Toàn bộ ảnh tải lên sẽ được lưu trong thư mục `public/uploads/`. Hãy đảm bảo thư mục này có quyền ghi (Write Permission).
- Mọi dữ liệu giờ đây sẽ được lưu vào bảng `app_settings` và `app_users` trong database MySQL của bạn.
- Tài khoản mặc định ban đầu là: 
  - User: `admin`
  - Pass: `admin123`
  (Bạn có thể đổi trong giao diện Quản lý tài khoản sau khi đăng nhập).
