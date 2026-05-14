# Kiến trúc Hệ thống: Beauty CRM & Management System (Monorepo)

## 1. Cấu trúc Thư mục (Folder Tree)

Dự án được triển khai theo mô hình Monorepo (sử dụng npm/yarn/pnpm workspaces), giúp phân tách logic theo từng domain cụ thể nhưng vẫn đảm bảo sự thống nhất tuyệt đối về dữ liệu (Single Source of Truth) tại `packages/shared`.

```text
├── apps/
│   ├── commerce-hub/          # QUẢN LÝ GIAO DỊCH
│   │   ├── package.json       # Dependencies riêng của commerce-hub
│   │   ├── vite.config.ts     # Cấu hình build
│   │   └── src/
│   │       ├── modules/       # (Sản phẩm, Đơn hàng, Nhập hàng, NCC, Tồn kho)
│   │       └── App.tsx
│   │
│   ├── care-hub/              # CHĂM SÓC & TƯ VẤN
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   └── src/
│   │       ├── modules/       # (Ảnh khách Before/After, Lịch bôi/Phác đồ, Kho kiến thức)
│   │       └── App.tsx
│   │
│   └── admin-system/          # QUẢN TRỊ & CÔNG CỤ
│       ├── package.json
│       ├── vite.config.ts
│       └── src/
│           ├── modules/       # (Dashboard, Khách hàng, Thu chi, Nhân viên, Nén ảnh, Tag)
│           └── App.tsx
│
├── packages/
│   ├── shared/                # LÕI HỆ THỐNG (Single Source of Truth)
│   │   ├── package.json
│   │   ├── schema.prisma      # Schema Database (Định nghĩa bảng)
│   │   └── src/
│   │       ├── types/         # Types/Interfaces xuất ra cho các apps dùng
│   │       ├── auth/          # Logic xác thực và xử lý Session (SSO)
│   │       └── lib/           # Tiện ích dùng chung (Firebase config, Utils)
│   │
│   └── ui-kit/                # (Tùy chọn) Chứa Component dùng chung (Button, Modal, Card...)
│
├── package.json               # Cấu hình root cho Monorepo workspace
└── pnpm-workspace.yaml        # Khai báo các thư mục apps/ và packages/ (nếu dùng pnpm)
```

## 2. Mẫu Database Schema (Prisma)

Tất cả các ứng dụng con đều phải tuân theo cấu trúc dữ liệu được định nghĩa tập trung tại `packages/shared/schema.prisma` này để đảm bảo tính toàn vẹn.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ----------------------------------------------------------------------
// DOMAIN: Khách hàng & Quản trị (Dùng nhiều ở admin-system)
// ----------------------------------------------------------------------

model Customer {
  id             String            @id @default(uuid())
  name           String
  phone          String?           @unique
  email          String?
  createdAt      DateTime          @default(now())
  
  // Quan hệ liên kết chéo giữa các modules:
  orders         Order[]           // Liên kết tới commerce-hub
  treatmentPhotos TreatmentPhoto[] // Liên kết tới care-hub
  routines       Routine[]         // Liên kết tới care-hub
}

// ----------------------------------------------------------------------
// DOMAIN: Giao dịch & Kho (commerce-hub)
// ----------------------------------------------------------------------

model Product {
  id             String            @id @default(uuid())
  name           String
  brand          String?
  price          Float
  stock          Int               @default(0)
  
  orderItems     OrderItem[]
}

model Order {
  id             String            @id @default(uuid())
  customerId     String
  totalAmount    Float
  status         String            @default("PENDING") // PENDING, PAID, CANCELLED
  createdAt      DateTime          @default(now())
  
  customer       Customer          @relation(fields: [customerId], references: [id])
  items          OrderItem[]
}

model OrderItem {
  id             String            @id @default(uuid())
  orderId        String
  productId      String
  quantity       Int
  price          Float
  
  order          Order             @relation(fields: [orderId], references: [id])
  product        Product           @relation(fields: [productId], references: [id])
}

// ----------------------------------------------------------------------
// DOMAIN: Chăm sóc & Tư vấn (care-hub)
// ----------------------------------------------------------------------

model TreatmentPhoto {
  id             String            @id @default(uuid())
  customerId     String
  imageUrl       String
  dateTaken      DateTime          @default(now())
  type           String            // BEFORE, AFTER, IN_PROGRESS
  note           String?
  
  customer       Customer          @relation(fields: [customerId], references: [id])
}

model Routine {
  id             String            @id @default(uuid())
  customerId     String
  title          String            // VD: "Phác đồ phục hồi da treatment"
  instructions   String            // Hướng dẫn sử dụng
  startDate      DateTime
  endDate        DateTime?
  
  customer       Customer          @relation(fields: [customerId], references: [id])
}
```

## 3. Giải pháp xác thực xuyên suốt (SSO) giữa các App

Để người dùng không phải đăng nhập lại mỗi khi chuyển từ `admin-system` sang `care-hub` hay `commerce-hub`, hệ thống sử dụng **Single Sign-On (SSO)**.

### Cách triển khai cụ thể:

1.  **Dùng chung tên miền (Same Domain - Subpaths):**
    Đây là giải pháp tốt và liền mạch nhất. Toàn bộ 3 ứng dụng sẽ được phục vụ chung trên một tên miền chính thông qua proxy hoặc bộ định tuyến (Router).
    - `https://beauty-crm.com/admin` -> dẫn tới `admin-system`
    - `https://beauty-crm.com/care` -> dẫn tới `care-hub`
    - `https://beauty-crm.com/commerce` -> dẫn tới `commerce-hub`
    - **Kết quả:** Vì chung tên miền, trình duyệt sẽ dùng chung `localStorage`, `sessionStorage` và `Cookies`. Firebase Auth (hoặc JWT lưu ở Cookies) sẽ tự động chia sẻ trạng thái đăng nhập cho cả 3 module mà KHÔNG CẦN config thêm.

2.  **Dùng Subdomain (Ví dụ: admin.crm.com, care.crm.com):**
    - Giải pháp: JWT Token được lưu ở Cookie với chỉ định `Domain=.crm.com`. Mọi subdomain đều có thể gửi kèm Cookie này về backend. Module logic Auth đặt ở `packages/shared` sẽ lấy Cookie này, giải mã để lấy thông tin nhân viên, và xác thực quyền dựa trên Role.

3.  **Packages Shared Auth Module:**
    - Toàn bộ hook và provider như `useAuth()`, `AuthProvider` được viết tại `packages/shared/src/auth`. 
    - Tại thư mục của `apps/admin-system` hay `apps/care-hub`, ta chỉ cần import:
      `import { useAuth } from '@beauty-crm/shared/auth';`
    - Qua đó, logic check token là chung một nguồn, luôn đồng nhất.
