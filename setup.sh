#!/bin/bash

echo "🚀 Bắt đầu quá trình thiết lập ứng dụng..."

# 1. Kiểm tra Node.js
if ! command -v node &> /dev/null
then
    echo "❌ Lỗi: Node.js chưa được cài đặt. Vui lòng cài đặt Node.js trước."
    exit
fi

# 2. Cài đặt dependencies
echo "📦 Đang cài đặt các thư viện (npm install)..."
npm install

# 3. Kiểm tra file .env
if [ ! -f .env ]; then
    echo "📄 Tạo file .env từ .env.example..."
    cp .env.example .env
    echo "⚠️  LƯU Ý: Vui lòng mở file .env và điền thông tin Database của bạn vào đó."
fi

# 4. Build ứng dụng
echo "🏗️  Đang biên dịch ứng dụng (Build)..."
npm run build

echo "------------------------------------------------"
echo "✅ Thiết lập hoàn tất!"
echo "------------------------------------------------"
echo "Để chạy ứng dụng, bạn có thể sử dụng lệnh:"
echo "   npm start"
echo ""
echo "Nếu bạn dùng hosting có hỗ trợ PM2, hãy dùng:"
echo "   pm2 start dist/server.cjs --name my-app"
echo "------------------------------------------------"
