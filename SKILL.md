# Freelance Job Scheduler (SJob)

> ⚠️ **QUY TẮC BẮT BUỘC KHI PHÁT TRIỂN & CHỈNH SỬA DỰ ÁN**:
> 1. **TRƯỚC KHI LÀM BẤT KỲ TÍNH NĂNG HOẶC CHỈNH SỬA GÌ**: BẮT BUỘC phải đọc kỹ file này (`SKILL.md`) để nắm rõ toàn bộ kiến trúc, tiến độ hiện tại, quy chuẩn công nghệ và các lưu ý kỹ thuật. Không tự ý đi lệch khỏi phạm vi MVP và các quy ước đã thiết lập.
> 2. **SAU KHI CHỈNH SỬA HOẶC HOÀN THÀNH BẤT KỲ TÍNH NĂNG NÀO**: BẮT BUỘC phải cập nhật lại tiến độ, trạng thái các module và ghi lại chi tiết thay đổi vào mục [Nhật ký thay đổi](#nhật-ký-thay-đổi-change-log) trong file này.

---

## 1. Tổng quan & Mục tiêu

Đây là một ứng dụng web cá nhân dành cho người làm việc tự do (freelancer) có công việc **không cố định theo lịch trình cố định**, mà nhận job theo từng ngày (ví dụ: thợ sửa chữa, người dạy kèm theo buổi, người nhận job vặt, freelancer nhận dự án ngắn hạn...).

- **Mục tiêu chính**: Giúp người dùng **ghi lại những ngày/khung giờ đã nhận job**, để dễ dàng sắp xếp và **tránh nhận trùng lịch** khi có nhiều công việc trong cùng một ngày.
- **Đối tượng sử dụng**: Cá nhân tự quản lý lịch của chính mình (Single-user per account).
- **Không có luồng booking**: Đây không phải nền tảng kết nối/marketplace — người dùng tự nhập tay các job họ đã nhận được từ nguồn ngoài.

---

## 2. Phạm vi tính năng (MVP)

Phạm vi được giữ **tối giản chủ đích** — chỉ tập trung vào lõi:

1. **Chế độ Khách (Guest Mode - Không cần đăng nhập)**: Người dùng có thể sử dụng ngay lập tức mà không cần tạo tài khoản hay đăng nhập. Dữ liệu công việc được lưu trữ bền vững (vĩnh viễn) trên thiết bị của người dùng (LocalStorage).
2. **Đăng nhập nhanh bằng Google (Google Sign-In)**: Hỗ trợ xác thực Google 1-chạm.
3. **Cơ chế Hỏi đồng bộ dữ liệu (Data Migration Prompt)**: Khi người dùng đang ở chế độ khách chuyển sang Đăng nhập Google, hệ thống chủ động hiển thị hộp thoại hỏi: *"Bạn có muốn đồng bộ toàn bộ công việc đã tạo trước đây vào tài khoản Google này không?"* để chuyển dữ liệu từ máy lên lưu trữ Cloud vĩnh viễn.
4. **Tạo job**: Thêm công việc mới gồm: Tiêu đề/loại việc, Ngày làm việc, Giờ bắt đầu, Giờ kết thúc, Ghi chú (địa điểm, mô tả...).
5. **Sửa job**: Chỉnh sửa thông tin job đã tạo.
6. **Xoá job**: Xoá job khỏi lịch (kèm xác nhận).
7. **Xem lịch theo tuần/tháng (Calendar View)**: Giao diện trực quan xem các ngày có job (tối ưu chế độ xem trên màn hình điện thoại).
8. **Xem danh sách job trong ngày**: Liệt kê theo thứ tự thời gian tăng dần (`start_time`), hiển thị nhiều job cùng lúc.
9. **Cảnh báo trùng giờ (Overlap Detection)**: Khi tạo/sửa job, hệ thống kiểm tra và cảnh báo **ngay tại chỗ (inline)** nếu khung giờ `[start_time, end_time]` chồng lấn với job khác trong cùng ngày của chính user đó.
10. **Tiền công (Cost)**: Mỗi job có thể ghi nhận tiền công nhận được (VNĐ, tuỳ chọn). Hiển thị badge tiền trên thẻ job.

### Ngoài phạm vi (Chủ đích KHÔNG làm)
- Không làm thanh toán / hoá đơn
- Không làm mời hoặc quản lý thông tin khách hàng chi tiết
- Không gửi email / SMS / push notification nhắc lịch
- Không có booking flow cho bên thứ ba

---

## 3. Kiến trúc Công nghệ & Cấu trúc Dự án

Dự án được tổ chức theo mô hình **Monorepo (npm workspaces)** gồm hai ứng dụng độc lập: `frontend` và `backend`.

### 3.1. Stack công nghệ đã chọn
- **Cơ sở dữ liệu**: MySQL 8.x
- **ORM**: Prisma ORM (`@prisma/client`, `prisma` CLI v5+)
- **Backend**: NestJS 11+ (TypeScript, NodeNext module resolution)
  - Xác thực: Passport JWT, `@nestjs/jwt`, `bcrypt`
  - Validation: `class-validator`, `class-transformer`
- **Frontend**: Next.js 15+ (App Router, React 19, TypeScript)
  - Styling: Vanilla CSS / CSS Modules (Tuân thủ thiết kế Mobile-First, responsive, dark/light sleek aesthetic)
  - Lịch: Tối ưu cho mobile view

### 3.2. Cấu trúc thư mục thực tế
```text
d:\SJob\
├── .env                           # Biến môi trường chung (DATABASE_URL, JWT_SECRET, PORT...)
├── package.json                   # Root package.json (Quản lý npm workspaces: backend, frontend)
├── SKILL.md                       # TÀI LIỆU KIM CHỈ NAM CỦA DỰ ÁN (Bắt buộc đọc & cập nhật)
├── prisma/
│   └── schema.prisma              # Data model & quan hệ (User, Job, composite index)
├── backend/                       # Ứng dụng NestJS API
│   ├── src/
│   │   ├── main.ts                # Khởi tạo Nest app, ValidationPipe, CORS, prefix api/v1
│   │   ├── app.module.ts          # Module gốc import Config, Prisma, Auth, Jobs
│   │   ├── prisma/                # PrismaService, PrismaModule kết nối database
│   │   ├── auth/                  # AuthModule, AuthService, AuthController, JwtStrategy, Guard, DTOs
│   │   └── jobs/                  # JobsModule, JobsService, JobsController, DTOs, Overlap logic
│   ├── package.json
│   └── tsconfig.json
└── frontend/                      # Ứng dụng Next.js UI
    ├── src/
    │   └── app/                   # App Router (layout.tsx, page.tsx, globals.css)
    ├── package.json
    └── tsconfig.json
```

---

## 4. Mô hình Dữ liệu (Prisma Schema)

File nguồn: `d:\SJob\prisma\schema.prisma`

### Bảng `users`
- `id`: Int (Khóa chính, Auto Increment)
- `email`: String (Unique, VarChar 255)
- `password_hash`: String? (VarChar 255, lưu bcrypt hash - cho phép null khi dùng Google Auth)
- `google_id`: String? (Unique, VarChar 255 - lưu Google sub id khi dùng Google Auth)
- `name`: String? (Tên người dùng)
- `avatar`: String? (Link ảnh đại diện)
- `created_at`: DateTime (Default now)
- Quan hệ: 1 User có nhiều Jobs (`jobs Job[]`)

### Bảng `jobs`
- `id`: Int (Khóa chính, Auto Increment)
- `user_id`: Int (Foreign Key → `users.id`, onDelete: Cascade)
- `title`: String (VarChar 255)
- `date`: DateTime (`@db.Date` - Lưu định dạng ngày `YYYY-MM-DD`)
- `start_time`: DateTime (`@db.Time(0)` - Lưu định dạng giờ `HH:mm:ss`)
- `end_time`: DateTime (`@db.Time(0)` - Lưu định dạng giờ `HH:mm:ss`)
- `note`: String? (`@db.Text` - Ghi chú tùy chọn)
- `cost`: Decimal? (`@db.Decimal(12, 0)` - Tiền công VNĐ, tùy chọn, tối đa 999,999,999,999đ)
- `paid`: Boolean (Default false - Trạng thái đã trả tiền công hay chưa)
- `created_at`: DateTime (Default now)
- `updated_at`: DateTime (Auto update)
- **Chỉ mục quan trọng**: `@@index([userId, date], name: "idx_user_date")` — Tối ưu hóa truy vấn tìm job theo ngày để check trùng lịch.

---

## 5. Logic nghiệp vụ cốt lõi: Kiểm tra trùng lịch (Overlap Check)

**Quy tắc:** Hai khoảng thời gian `[StartA, EndA]` và `[StartB, EndB]` trong cùng một ngày bị chồng lấn nếu và chỉ nếu:
$$\text{StartA} < \text{EndB} \quad \text{và} \quad \text{EndA} > \text{StartB}$$

**Triển khai:**
1. Khi người dùng tạo hoặc sửa job (hoặc qua endpoint độc lập `POST /jobs/check-overlap` khi đang nhập form):
   - Backend truy vấn tất cả jobs của `userId` trong ngày `date` đó (sử dụng index `idx_user_date`).
   - Nếu là hành động Cập nhật (Update), loại trừ chính `jobId` đang cập nhật (`id != excludeJobId`).
   - So sánh từng job hiện có với khoảng giờ người dùng đang chọn.
   - Trả về: `{ hasOverlap: boolean, overlappingJobs: Job[] }`.
2. Frontend sẽ gọi kiểm tra ngay khi người dùng chọn xong giờ bắt đầu và kết thúc để hiển thị cảnh báo trực tiếp (inline warning), không bắt người dùng đợi bấm nút lưu.

---

## 6. Giao diện (Mobile-First Principles)

1. **Mobile-first Layout**:
   - Mặc định thiết kế cho màn hình điện thoại (Single-column layout, bottom navigation bar, floating action button "+").
   - Desktop view là mở rộng tăng cường (progressive enhancement).
2. **Vùng chạm (Tap Targets)**:
   - Các nút bấm, slot thời gian tối thiểu 44x44px, dễ bấm bằng ngón cái.
3. **Luồng thao tác nhanh (Quick Actions)**:
   - Nút `+` (FAB) luôn nổi ở góc dưới.
   - Mở modal/bottom sheet tạo job chỉ với vài trường cơ bản (Tiêu đề, Ngày, Giờ bắt đầu, Giờ kết thúc).
   - Time picker native, hiển thị cảnh báo trùng ngay lập tức.

---

## 7. Tiến độ Dự án & Những gì đã làm được (Progress Tracker)

### ✅ Phase 1: Thiết lập nền tảng & Cơ sở dữ liệu (Đã hoàn thành)
- [x] Tạo cấu trúc Monorepo với root `package.json` và npm workspaces (`frontend`, `backend`).
- [x] Tạo file môi trường `.env` kết nối MySQL và cấu hình JWT Secret.
- [x] Viết file `prisma/schema.prisma` định nghĩa bảng `User` (hỗ trợ `google_id`, `name`, `avatar`), `Job` và quan hệ cascade, composite index.
- [x] Chạy migration database (`npx prisma db push`) tạo bảng thành công vào MySQL.
- [x] Cài đặt Prisma CLI và `@prisma/client`.

### ✅ Phase 2: Backend API NestJS (Đã hoàn thành 100%)
- [x] Khởi tạo khung dự án NestJS trong thư mục `backend/`.
- [x] Cài đặt các thư viện cần thiết: `@nestjs/config`, `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, `bcrypt`, `class-validator`, `class-transformer`, `@nestjs/mapped-types`, `google-auth-library`.
- [x] Xây dựng `PrismaModule` & `PrismaService` (quản lý lifecycle kết nối DB).
- [x] Xây dựng `AuthModule`:
  - `RegisterDto`, `LoginDto`, `GoogleLoginDto`.
  - `AuthService`: Băm password với `bcrypt`, xử lý đăng nhập Google (`POST /auth/google`), cấp phát JWT accessToken.
  - `AuthController`: Endpoint `POST /auth/register`, `POST /auth/login`, `POST /auth/google`.
  - `JwtStrategy`, `JwtAuthGuard`, Decorator `@CurrentUser()`.
- [x] Xây dựng `JobsModule`:
  - DTOs: `CreateJobDto`, `UpdateJobDto`, `CheckOverlapDto`, `SyncGuestDto`.
  - `JobsService`: CRUD (Tạo, xem danh sách theo ngày/tháng, xem chi tiết, sửa, xoá), thuật toán phát hiện chồng lấn `checkOverlap`, tính năng đồng bộ hàng loạt `syncGuest`.
  - `JobsController`:
    - `POST /jobs` (Tạo job)
    - `POST /jobs/sync-guest` (Đồng bộ danh sách jobs từ chế độ khách)
    - `GET /jobs?date=YYYY-MM-DD` (Lấy danh sách job theo ngày)
    - `GET /jobs/range?from=...&to=...` (Lấy job theo khoảng ngày cho calendar)
    - `GET /jobs/:id` (Xem chi tiết job)
    - `PATCH /jobs/:id` (Cập nhật job)
    - `DELETE /jobs/:id` (Xoá job)
    - `POST /jobs/check-overlap` (Kiểm tra trùng lịch trước khi lưu)
- [x] Chuẩn hóa toàn bộ NodeNext module resolution (`.js` imports), fix type compatibility cho `expiresIn` và callback params. Backend `npm run build` thành công 100% không còn lỗi.

### ✅ Phase 3: Frontend UI Next.js Mobile-First (Đã hoàn thành 100%)
- [x] Thiết kế Design System chuẩn Mobile-First (`frontend/src/app/globals.css`): Giao diện Dark theme sang trọng, glow effect, typography Plus Jakarta Sans, viewport căn giữa trên desktop giả lập mobile, full-width trên di động.
- [x] Xây dựng cơ chế Lưu trữ kép (Dual Engine): Chế độ Khách (Guest Mode) lưu trữ vĩnh viễn trên thiết bị (`localStorage`) không cần đăng nhập vẫn dùng đầy đủ tính năng.
- [x] Header: Hiển thị trạng thái "Chế độ máy", nút Đăng nhập Google, hoặc Avatar/Tên người dùng kèm nút Đăng xuất.
- [x] Màn hình Lịch (CalendarView):
  - Chuyển đổi linh hoạt giữa Xem Tuần (Week strip) và Xem Tháng (Month grid).
  - Điều hướng tới/lui các tuần/tháng.
  - Hiển thị chấm phát sáng (dot indicator) trên những ngày có job.
- [x] Màn hình Danh sách Job trong ngày (DayJobsList):
  - Hiển thị ngày thân thiện (VD: "Hôm nay, 21/09", "Thứ Hai, 22/09").
  - Thẻ công việc (JobCard): Khung giờ to rõ, tên công việc, ghi chú, nút Sửa & Xoá (có dialog xác nhận).
  - Trạng thái trống (Empty State) khi chưa có việc với nút thêm nhanh.
- [x] Form Thêm / Sửa Job (JobFormSheet):
  - Thiết kế dạng Bottom Sheet (bảng trượt từ dưới lên) tối ưu thao tác ngón cái (Thumb Zone).
  - Time picker di động thuận tiện.
  - **Inline Overlap Warning**: Kiểm tra trùng giờ thời gian thực ngay khi thay đổi giờ và hiển thị cảnh báo trực tiếp danh sách công việc bị trùng.
- [x] Hộp thoại Đồng bộ Dữ liệu Cũ (SyncPromptModal):
  - Tự động phát hiện nếu có công việc đã tạo trong chế độ khách khi người dùng bấm Đăng nhập Google.
  - Hiển thị hộp thoại hỏi ý kiến: *"Bạn có muốn đồng bộ toàn bộ công việc đã tạo trước đây vào tài khoản Google này không?"*.
  - Lưu trữ lên máy chủ MySQL vĩnh viễn nếu đồng ý.
- [x] Thanh điều hướng chân trang (BottomNav) & Nút nổi FAB (+) tạo job nhanh: Gồm 3 tab chính: Lịch biểu, Chỉ tiêu (Mục tiêu tháng), Tài khoản.
- [x] Trang Đặt Chỉ Tiêu & Mục Tiêu Theo Tháng (Monthly Goals Tracker): Màn hình `GoalsPage.tsx` thay thế tab "Hôm nay", cho phép đặt và theo dõi tiến độ hoàn thành mục tiêu thu nhập và ngày làm việc của từng tháng với thanh tiến độ trực quan, gợi ý số tiền cần đạt mỗi ngày và lưu trữ LocalStorage bền vững.
- [x] Thống kê Thu nhập & Ngày công theo tháng (Monthly Stats Dashboard): Tính tổng tiền công (VNĐ), số ngày đi làm thực tế và tổng số công việc trong tháng, kèm chú thích phân loại ngày làm (xanh) / ngày nghỉ (đỏ).
- [x] Trang Tài khoản & Thống kê Thu nhập Toàn diện (Dedicated Account & Revenue Analytics Page): Màn hình riêng biệt `AccountPage.tsx` thay thế bottom sheet cũ, xem toàn bộ thống kê doanh thu (Toàn thời gian / Tháng này / Tháng trước), 4 chỉ số tài chính cốt lõi, biểu đồ doanh thu theo từng tháng có thanh tiến trình trực quan, bảng xếp hạng Top 5 công việc thu nhập cao nhất, xuất sao lưu JSON và chỉnh sửa tên cá nhân (hỗ trợ 100% người dùng chưa đăng nhập).
- [x] Frontend `npm run build` thành công 100% (Turbopack, TypeScript 0 lỗi).

### 🚀 Phase 6: Triển Khai Thực Tế 100% Miễn Phí (0 VNĐ/tháng)
- [x] **Cơ sở dữ liệu Cloud**: Khởi tạo cụm TiDB Serverless (MySQL 8 tương thích, AWS Singapore, 25GB dung lượng vĩnh viễn), đồng bộ Prisma schema thành công qua `npx prisma db push`.
- [x] **Backend API NestJS (Render.com)**:
  - Dịch vụ Web Service `sjob-api` đã triển khai thành công và báo trạng thái **Live**.
  - Production URL: `https://sjob-api.onrender.com`
  - Đã tích hợp CORS cho phép Vercel, kiểm tra endpoint trả lời mã lỗi auth 401 chuẩn xác.
- [x] **Frontend UI Next.js PWA (Vercel)**:
  - Triển khai thành công ứng dụng PWA lên Vercel Hobby Tier (Status Ready).
  - Production URL: `https://sjob-frontend.vercel.app`
  - Đã liên kết biến môi trường `NEXT_PUBLIC_API_URL=https://sjob-api.onrender.com/api`.
  - Đầy đủ tính năng PWA (manifest, service worker, app icons độ nét cao, offline-first).
- [x] **Kiểm thử thiết bị di động thực tế**: Cài đặt PWA lên màn hình chính, kiểm tra luồng Guest Mode và Google Sync.


---


## 8. Hướng dẫn chạy dự án

### Cài đặt dependencies:
```bash
npm install
```

### Thiết lập cơ sở dữ liệu:
Cập nhật chuỗi kết nối MySQL trong file `.env`:
```env
DATABASE_URL="mysql://root:password@localhost:3306/sjob"
JWT_SECRET="sjob-jwt-secret-change-in-production"
PORT=3001
```
Đẩy schema vào database:
```bash
npx prisma db push
```

### Chạy chế độ phát triển (Development):
```bash
# Chạy Backend API (cổng 3001)
npm run dev:backend

# Chạy Frontend UI (cổng 3000)
npm run dev:frontend
```

---

## 9. Nhật ký thay đổi (Change Log)

*Quy định: Mọi thay đổi về code, thêm module, đổi schema hoặc refactor đều phải ghi nhận tại đây theo thứ tự thời gian.*

- **2026-09-21**:
  - Khởi tạo tài liệu dự án và lập kế hoạch kỹ thuật chi tiết.
  - Thiết lập monorepo workspace (`backend`, `frontend`).
  - Xây dựng schema Prisma: Bảng `users` và `jobs`, thiết lập quan hệ và composite index `[userId, date]`.
  - Cập nhật yêu cầu người dùng: Bổ sung Chế độ Khách (Guest Mode) lưu trữ vĩnh viễn trên máy không cần đăng nhập, Đăng nhập bằng Google, Hộp thoại hỏi đồng bộ dữ liệu cũ khi đăng nhập tài khoản Google, và tối ưu hóa trải nghiệm Mobile-friendly tối đa (Thumb Zone, Bottom Sheet).
  - Cập nhật Prisma Schema hỗ trợ Google Auth (`google_id`, `name`, `avatar`, nullable `password_hash`) và migrate vào MySQL thành công.
  - Hoàn thiện Backend NestJS: Xây dựng Google Login endpoint (`POST /auth/google`), Bulk sync endpoint (`POST /jobs/sync-guest`), fix toàn bộ TypeScript NodeNext imports và type errors. `npm run build` backend thành công 100%.
  - Xây dựng Frontend UI Next.js Mobile-First: Dual Engine LocalStorage & API, Design System dark sleek theme, Header với Google Sign-In, CalendarView (Week/Month toggle), DayJobsList, JobFormSheet (Bottom Sheet với Inline Overlap Warning), SyncPromptModal, BottomNav & FAB. `npm run build` frontend thành công 100%.
  - Nâng cấp Giao diện Trang chủ thành Lịch Tuần Toàn Diện (Weekly Agenda Overview): Hiển thị trực quan 7 ngày trong tuần, thống kê số ngày còn trống/số job đã nhận, phân biệt rõ ngày còn trống (`🟢 Trống cả ngày` kèm nút nhanh `+ Nhận job ngày này`) và ngày bận (`🟣 {N} công việc` kèm timeline giờ làm việc rõ ràng). `npm run build` thành công 100%.
  - Tinh chỉnh giao diện chuyên nghiệp cao cấp (Pro SaaS Mobile Calendar): Loại bỏ 7 thẻ trống lặp lại thô kệch, thay bằng Băng Tuần 7 ngày nhỏ gọn (Compact 7-Day Week Strip chia đều 100% màn hình chuẩn Apple/Notion Calendar), tích hợp Ngày Canvas với các khung giờ gợi ý nhanh (Sáng / Chiều / Tối) khi ngày trống, và Timeline thẻ sự kiện hiện đại khi có việc. Nút Google và Header được tinh gọn hài hoà với Dark Mode. `npm run build` thành công 100%.
  - Chuẩn hóa thanh điều hướng đáy (BottomNav): Thay thế nút "Bản Máy" gây khó hiểu bằng tab "Tài khoản" (icon User chuẩn), tích hợp `AccountSheet` cho phép xem trạng thái lưu trữ trên máy, số việc đã lưu và nút Đăng nhập Google đồng bộ đám mây một cách trực quan. `npm run build` thành công 100%.

- **2026-09-23**:
  - Nâng cấp Calendar Month View — Phân biệt ngày đi làm / ngày nghỉ bằng màu sắc: Thêm class CSS `has-jobs` cho các ô ngày có công việc trong lưới tháng (`CalendarView.tsx`). Ngày có job hiển thị nền xanh lá emerald nhạt (`rgba(16,185,129,0.15)`) với viền xanh và chữ xanh sáng `#6ee7b7`, ngày không có job giữ nền tối mặc định. Chấm indicator đổi từ cyan sang emerald (`#10b981`) đồng bộ màu. Trạng thái selected (tím) vẫn override đúng. Files thay đổi: `frontend/src/components/CalendarView.tsx`, `frontend/src/app/globals.css`.
  - Bổ sung highlight đỏ cho ngày nghỉ (không có job): Thêm class `no-jobs` cho ô ngày thuộc tháng hiện tại mà không có công việc. Ngày nghỉ hiển thị nền đỏ nhạt (`rgba(239,68,68,0.1)`) với viền đỏ mờ và chữ đỏ sáng `#fca5a5`. Kết hợp với xanh lá cho ngày đi làm tạo thành bảng màu trực quan: 🟢 Xanh = đi làm, 🔴 Đỏ = nghỉ. Files thay đổi: `frontend/src/components/CalendarView.tsx`, `frontend/src/app/globals.css`.
  - Thêm trường Tiền công (Cost) xuyên suốt Full Stack: Thêm cột `cost Decimal(12,0)?` vào Prisma schema và migrate MySQL thành công. Backend: thêm `cost` vào `CreateJobDto` với validation `@IsNumber`, `@Min(0)` (UpdateJobDto và SyncGuestDto tự kế thừa). Frontend: thêm `cost` vào interface `Job` & `CreateJobInput`, lưu vào localStorage, ô nhập tiền công trong `JobFormSheet` (icon DollarSign, format preview VNĐ realtime), badge hiển thị `💰 xxx.xxxđ` trên thẻ job trong `CalendarView`, sync `cost` khi đồng bộ guest→cloud. CSS: badge xanh lá pill và cost input styles. `npm run build` backend + frontend thành công 100%.
  - Bổ sung Bảng Thống kê Thu nhập & Ngày làm theo tháng (Monthly Stats Dashboard): Tích hợp thẻ thống kê 3 chỉ số ngay trên đầu lịch tháng gồm: Tổng thu nhập tháng (VNĐ với hiệu ứng glow xanh), Số ngày đi làm thực tế (`/ tổng ngày trong tháng`), và Tổng số công việc đã nhận. Bổ sung thanh chú thích màu sắc trực quan (🟢 Đi làm: X ngày | 🔴 Nghỉ: Y ngày) và bổ sung hiển thị tổng tiền công tuần trên thanh tóm tắt tuần. Files thay đổi: `frontend/src/components/CalendarView.tsx`, `frontend/src/app/globals.css`. Build frontend thành công 100%.
  - Tối ưu giao diện Thẻ Thống kê Tháng (Khắc phục tràn/mất chữ): Chuyển đổi cấu trúc layout 3 cột từ hàng ngang sang bố cục dọc từng box (`.month-stat-box`). Đưa icon nhỏ gọn lên cùng hàng với nhãn tiêu đề (Thu nhập, Ngày làm, Số việc), dùng chữ thường tự nhiên (không còn bị ép hoa), giúp chữ hiển thị trọn vẹn 100% không còn bị dấu ba chấm (`...`) kể cả trên các màn hình điện thoại hẹp. Files thay đổi: `frontend/src/components/CalendarView.tsx`, `frontend/src/app/globals.css`. Build frontend thành công 100%.
  - Loại bỏ thanh tóm tắt tuần (Week Summary Micro-bar): Bỏ dải thông tin nhỏ `X ngày rảnh • Y job đã nhận • 💰 xxx.xxxđ` bên dưới băng tuần 7 ngày theo yêu cầu người dùng, giúp giao diện chế độ Xem Tuần thông thoáng, liền mạch trực tiếp vào chi tiết ngày làm việc. Files thay đổi: `frontend/src/components/CalendarView.tsx`. Build frontend thành công 100%.
  - Thêm tính năng Ẩn/Hiện Doanh thu (Eye Toggle): Thêm nút con mắt (`Eye` / `EyeOff`) ngay cạnh nhãn "Thu nhập" trong Thẻ Thống kê Tháng. Cho phép người dùng bật/tắt che giấu số tiền nhạy cảm (`••••••••` và trên thẻ job `••••••`). Files thay đổi: `frontend/src/components/CalendarView.tsx`, `frontend/src/app/globals.css`. Build frontend thành công 100%.
  - Cập nhật mặc định Ẩn Doanh thu (Always Default to OFF): Cấu hình trạng thái con mắt luôn mặc định ở chế độ TẮT (`showEarnings = false`, icon `EyeOff`) mỗi khi vào app hoặc tải lại trang, bảo đảm sự riêng tư tối đa cho freelancer khi sử dụng ở nơi công cộng. Chỉ khi người dùng chủ động bấm vào con mắt thì doanh thu mới hiển thị tạm thời. Files thay đổi: `frontend/src/components/CalendarView.tsx`. Build frontend thành công 100%.
  - Nâng cấp Trung tâm Tài khoản & Hồ sơ Cá nhân (Chưa đăng nhập vẫn dùng đầy đủ): Thay thế hộp thoại mời đăng nhập đơn điệu bằng Trung tâm Tài khoản & Hồ sơ hoàn chỉnh (`AccountSheet.tsx`) cho cả người dùng chưa đăng nhập. Người dùng bản máy có avatar riêng, cho phép sửa tên hiển thị (lưu vào máy), xem tổng quan công việc đã lưu và tổng tiền công, tiện ích Xuất sao lưu JSON về máy bất cứ lúc nào, xóa dữ liệu máy khi cần, và tùy chọn kết nối Google Cloud để đồng bộ nếu muốn. Files thay đổi: `frontend/src/components/AccountSheet.tsx`, `frontend/src/app/globals.css`. Build frontend thành công 100%.
  - Chuyển đổi thành Trang Tài khoản & Thống kê Thu nhập Toàn diện (Dedicated Full Page `AccountPage.tsx`):
    - Thay thế popup Bottom Sheet cũ bằng trang toàn màn hình (SPA Tab Switching) thông qua trạng thái `activeTab: 'calendar' | 'account'` trong `JobContext.tsx`. Bấm tab "Tài khoản" ở thanh điều hướng `BottomNav` sẽ chuyển trang ngay lập tức, mượt mà và không tải lại trang.
    - Xây dựng giao diện `AccountPage.tsx` chuyên sâu, hỗ trợ 100% cho cả người dùng chưa đăng nhập (Chế độ máy) lẫn tài khoản Google:
      + Profile Hero Card: Avatar người dùng, chỉnh sửa tên hiển thị trực tiếp (lưu `localStorage`), huy hiệu trạng thái lưu trữ trên thiết bị / Cloud, và nút con mắt bật/tắt hiển thị số tiền riêng tư (mặc định luôn ẩn).
      + Bộ lọc thời gian linh hoạt: "Toàn thời gian", "Tháng này", "Tháng trước" chuyển đổi tức thì.
      + 4 Thẻ chỉ số tài chính cốt lõi: Tổng thu nhập (glow tím/xanh), Số ngày đi làm thực tế, Tổng số công việc, và Thu nhập trung bình mỗi việc (Average per job).
      + Phân tích doanh thu theo từng tháng (Monthly Breakdown): Danh sách các tháng có công việc, hiển thị tổng tiền, số job và vẽ thanh tiến trình tỷ lệ trực quan (`monthly-progress-fill`).
      + Bảng xếp hạng Top 5 công việc kiếm nhiều tiền nhất (Top Paying Jobs Ranking): Huy hiệu xếp hạng #1 (vàng), #2 (bạc), #3 (đồng) kèm ngày làm và tiền công.
      + Quản lý & An toàn dữ liệu: Nút Xuất file sao lưu JSON (`sjob-backup-YYYY-MM-DD.json`) về máy, liên kết đồng bộ Google Cloud, và Xoá toàn bộ dữ liệu máy.
    - Files thay đổi: `frontend/src/context/JobContext.tsx`, `frontend/src/components/BottomNav.tsx`, `frontend/src/components/AccountPage.tsx`, `frontend/src/app/page.tsx`, `frontend/src/app/globals.css`. Build frontend thành công 100% (Turbopack, TypeScript 0 lỗi).
  - Loại bỏ khối "Top công việc thu nhập cao" theo yêu cầu người dùng:
    - Xóa phần hiển thị danh sách Top 5 công việc thu nhập cao nhất khỏi trang `AccountPage.tsx`, dọn dẹp các icon (`Award`, `Clock`) và biến tính toán `topPayingJobs`.
    - Dọn dẹp các class CSS liên quan (`.top-jobs-list`, `.top-job-item`, `.rank-badge`, ...) trong `frontend/src/app/globals.css`.
    - Giúp giao diện trang Tài khoản & Thống kê gọn gàng, liền mạch từ Biểu đồ doanh thu theo tháng trực tiếp sang Công cụ quản trị & Sao lưu. Build frontend thành công 100%.

- **2026-09-24**:
  - Thêm tính năng Theo dõi Trạng thái Thanh toán (Paid/Unpaid) xuyên suốt Full Stack:
    - **Prisma Schema**: Thêm cột `paid Boolean @default(false)` vào bảng `jobs`, migrate MySQL thành công.
    - **Backend**: Thêm `paid` (IsBoolean) vào `CreateJobDto` (UpdateJobDto tự kế thừa). Cập nhật `JobsService`: create, update, syncGuest đều hỗ trợ `paid`. `formatJob` trả về `paid` + `cost` đầy đủ. Build backend thành công 100%.
    - **Frontend Types**: Thêm `paid?: boolean` vào interface `Job` & `CreateJobInput`.
    - **LocalStorage**: `saveGuestJob` lưu `paid` cho cả tạo mới và cập nhật.
    - **JobContext**: Truyền `paid` khi sync guest jobs lên cloud.
    - **JobFormSheet**: Thêm 2 nút toggle "Đã trả tiền" (xanh lá) / "Chưa trả" (cam) dạng radio button với icon `CircleCheck` / `CircleDashed`. Tự động sync trạng thái khi mở form sửa.
    - **CalendarView (Thẻ Job)**: Hiển thị badge trạng thái thanh toán trên mỗi thẻ job — xanh lá "Đã trả tiền" hoặc cam "Chưa trả tiền".
    - **CalendarView (Lịch Tháng)**: Phân biệt trực quan ngày theo trạng thái thanh toán: 🟢 Xanh lá = tất cả job đã trả, 🟠 Cam = trả một phần, 🔴 Đỏ = chưa trả. Chấm indicator dot cũng đổi màu tương ứng. Thêm hàng chú thích màu sắc riêng cho trạng thái thanh toán (Đã trả / Trả 1 phần / Chưa trả).
    - **CSS**: Thêm styles cho `.paid-toggle-row`, `.paid-toggle-btn`, `.job-paid-badge`, `.month-cell.all-paid`, `.month-cell.some-paid`, `.month-cell.no-paid`, `.month-job-dot.dot-paid/dot-some-paid/dot-unpaid`, `.legend-indicator.paid-*`.
    - Files thay đổi: `prisma/schema.prisma`, `backend/src/jobs/dto/create-job.dto.ts`, `backend/src/jobs/jobs.service.ts`, `frontend/src/types/job.ts`, `frontend/src/lib/storage.ts`, `frontend/src/context/JobContext.tsx`, `frontend/src/components/JobFormSheet.tsx`, `frontend/src/components/CalendarView.tsx`, `frontend/src/app/globals.css`. Build backend + frontend thành công 100% (TypeScript 0 lỗi).
  - Chuyển đổi Huy hiệu Thanh toán trên Thẻ Job thành Nút Bấm Chuyển Đổi Trực Tiếp 1-Chạm (Quick Inline 1-Tap Toggle):
    - Cho phép người dùng chạm/bấm trực tiếp vào huy hiệu "Chưa trả tiền" / "Đã trả tiền" ngay trên thẻ job ngoài lịch để đổi trạng thái thanh toán ngay lập tức, không cần phải mở form chỉnh sửa.
    - Hỗ trợ mượt mà cả Chế độ Khách (Local Storage với hàm `toggleGuestJobPaid`) và Chế độ Tài khoản Cloud (gọi `api.updateJob` với Optimistic UI cập nhật tức thì).
    - Cập nhật hàm `toggleJobPaid` trong `JobContext.tsx`.
    - Bổ sung hiệu ứng tương tác cao cấp trong `globals.css`: hover nổi nhẹ, đổ bóng glow màu tương ứng (xanh ngọc cho đã trả / cam ấm cho chưa trả), hiệu ứng bấm chìm nút (active scale 0.95), và tooltip hướng dẫn.
    - Đồng bộ tính năng vào `DayJobsList.tsx`.
    - Files thay đổi: `frontend/src/lib/storage.ts`, `frontend/src/context/JobContext.tsx`, `frontend/src/components/CalendarView.tsx`, `frontend/src/components/DayJobsList.tsx`, `frontend/src/app/globals.css`. Build backend + frontend thành công 100% (TypeScript 0 lỗi).
  - Khôi phục màu nền Lịch Tháng & Thể hiện đã nhận tiền bằng Tích xanh nhỏ gọn trong ô:
    - Khôi phục triệt để màu nền các ô lịch tháng về chuẩn: 🟢 Xanh lá = ngày đi làm (`has-jobs`), 🔴 Đỏ = ngày nghỉ (`no-jobs`). Không còn bị lớp màu thanh toán đè lên gây nhầm lẫn giữa ngày đi làm và ngày nghỉ.
    - Trạng thái đã trả tiền ("trả cast") được thể hiện tinh tế bằng dấu tích xanh nhỏ gọn (`Check` icon đặt ở góc trên phải ô ngày `.month-paid-check`).
    - Gộp thanh chú thích màu thành một hàng duy nhất gọn gàng: `🟢 Đi làm: X ngày | 🔴 Nghỉ: Y ngày | ✓ Đã trả tiền`.
    - Files thay đổi: `frontend/src/components/CalendarView.tsx`, `frontend/src/app/globals.css`. Build frontend thành công 100% (TypeScript 0 lỗi).

- **2026-09-25**:
  - Tối ưu hóa Thẻ Công việc Siêu Tinh gọn (Ultra-Compact Job Card Refactor):
    - Khắc phục tình trạng thẻ job bị kéo dài theo chiều dọc do xếp chồng 4 hàng rời rạc (khung giờ, tiêu đề, nút thanh toán, huy hiệu tiền công).
    - Tái cấu trúc thẻ công việc (`.pro-job-card` trong [CalendarView.tsx](file:///d:/SJob/frontend/src/components/CalendarView.tsx)) thành bố cục 2 dòng chuẩn hiện đại:
      + **Dòng 1 (Tiêu đề & Hành động)**: Tiêu đề công việc to rõ ở bên trái và cụm nút thao tác (Sửa / Xóa) tinh gọn bên phải.
      + **Dòng 2 (Cụm Thẻ Thông tin Inline)**: Đưa Khung giờ (`00:00 — 16:00`), Tiền công (`💰 xxx.xxxđ` / ẩn) và Nút đổi nhanh thanh toán 1-chạm (`Đã trả tiền` / `Chưa trả tiền`) vào cùng một hàng ngang duy nhất (`.job-card-meta`), tự động căn đều và tương thích màn hình hẹp.
    - Giảm padding thẻ từ `14px 16px` xuống `9px 12px`, chuẩn hóa kích thước các huy hiệu dạng capsule pill siêu gọn, giúp giảm hơn 50% chiều cao của thẻ mà vẫn giữ đầy đủ 100% chức năng và tính tương tác.
    - Files thay đổi: `frontend/src/components/CalendarView.tsx`, `frontend/src/app/globals.css`. Build frontend thành công 100% (Turbopack, TypeScript 0 lỗi).
  - Tối giản Form Tạo & Sửa Job (Loại bỏ tùy chọn Trạng thái thanh toán khỏi modal):
    - Loại bỏ phần chọn Trạng thái thanh toán ("Đã trả tiền" / "Chưa trả") khỏi [JobFormSheet.tsx](file:///d:/SJob/frontend/src/components/JobFormSheet.tsx) theo yêu cầu người dùng, giúp form tạo/sửa việc ngắn gọn và tập trung hơn.
    - Người dùng có thể đổi trạng thái thanh toán trực tiếp 1-chạm ngay trên thẻ job ngoài lịch. Khi sửa job, trạng thái thanh toán hiện tại vẫn được giữ nguyên vẹn (`paid: editingJob?.paid ?? false`).
    - Files thay đổi: `frontend/src/components/JobFormSheet.tsx`. Build frontend thành công 100% (Turbopack, TypeScript 0 lỗi).
  - Thay thế Tab "Hôm nay" bằng Tính năng Đặt Chỉ Tiêu Theo Tháng (Monthly Goals Tracker):
    - **BottomNav**: Thay thế tab thừa "Hôm nay" bằng tab **"Chỉ tiêu"** (icon `Target`), hỗ trợ `activeTab: 'calendar' | 'goals' | 'account'`.
    - **Màn hình GoalsPage.tsx**: Xây dựng trang quản lý chỉ tiêu hàng tháng toàn diện:
      + Bộ chọn tháng linh hoạt (xem lại các tháng trước hoặc đặt trước cho các tháng tới).
      + Theo dõi 2 chỉ tiêu cốt lõi: **Thu nhập mục tiêu** (VNĐ) và **Số ngày làm mục tiêu** (ngày).
      + Thanh tiến độ động (Progress Bar) đổi màu và phát sáng theo thời gian thực (tự động tính tổng tiền công và số ngày có job trong tháng).
      + Tính toán số tiền/ngày còn thiếu để về đích, kèm tốc độ cần đạt trung bình mỗi ngày còn lại trong tháng.
      + Trạng thái vinh danh & động lực (Gamification): Chúc mừng đạt chỉ tiêu (>= 100%), nhắc nhở khi sắp về đích (>= 80%).
      + Modal đặt & chỉnh sửa chỉ tiêu nhanh với các chip phím tắt (10tr, 15tr, 20tr, 25tr, 30tr / 15, 20, 22, 26 ngày).
      + Tích hợp nút con mắt che/hiển thị tiền công riêng tư.
    - **Lưu trữ bền vững**: Tích hợp hàm `getMonthlyGoal`, `saveMonthlyGoal` trong `storage.ts` lưu vào `localStorage` (`sjob_monthly_goals`), sử dụng 100% không cần đăng nhập.
  - Tinh Chỉnh Giao Diện "Chỉ Tiêu" Sang Chuẩn Tối Giản, Gọn Gàng (Minimalist Apple-Style Clean Design):
    - Khắc phục triệt để tình trạng giao diện rườm rà, rối mắt (loại bỏ các banner khẩu hiệu thừa thãi, bỏ hiệu ứng nhấp nháy, bỏ vòng tròn SVG cồng kềnh gây chật chội).
    - Tái cấu trúc thành **2 Thẻ Mục Tiêu Siêu Gọn & Sang Trọng** (Thu nhập & Ngày đi làm):
      + Dòng tiêu đề nhỏ gọn: Icon + Tên mục tiêu + Huy hiệu `%` nhỏ ở góc phải (`65%` / `✓ Đạt 100%`).
      + Hiển thị số liệu nổi bật: Số tiền thực tế to đậm (`9.200.000đ`) đặt cạnh mục tiêu (`/ 15.000.000đ`).
      + Thanh tiến độ mỏng nhẹ 6px phẳng thanh lịch.
      + Dòng chú thích ngắn gọn bên dưới: Số tiền/ngày còn thiếu và tốc độ cần đạt mỗi ngày.
    - Sửa triệt để lỗi tràn dòng & vỡ chữ trên thanh tiêu đề tháng ([GoalsPage.tsx](file:///d:/SJob/frontend/src/components/GoalsPage.tsx)):
      + Loại bỏ chữ "Hiện tiền" / "Ẩn tiền" rườm rà, thay bằng nút icon mắt tối giản 30x30px chuẩn UX.
      + Rút gọn nút "Sửa chỉ tiêu" thành nút "Sửa" tinh gọn kèm icon bút chì.
      + Thiết lập `white-space: nowrap` và `flex-shrink: 0` trên toàn bộ tiêu đề tháng và các nút bấm, loại bỏ hoàn toàn hiện tượng chữ bị bẻ xuống 2 dòng gây méo mó trên di động.
      + Cân đối khoảng cách và kích thước nút mũi tên `<` `>` nhỏ gọn (30x30px), giúp thanh header thoáng đãng, sang trọng và chuẩn mobile-first.
    - Files thay đổi: `frontend/src/components/GoalsPage.tsx`, `frontend/src/app/globals.css`. Build frontend thành công 100% (Turbopack, TypeScript 0 lỗi).
  - Tinh Chỉnh & Đồng Bộ Trang Cá Nhân Với Chỉ Tiêu Hàng Tháng (Account Page Refactor & Goal Integration):
    - **Tích hợp Widget Chỉ Tiêu Tháng Hiện Tại (`account-goal-card`)**:
      + Đặt ngay dưới thẻ hồ sơ (Profile Hero), tự động đồng bộ theo thời gian thực với dữ liệu chỉ tiêu từ `GoalsPage`.
      + Nếu đã có chỉ tiêu: Hiển thị 2 thanh tiến độ song song siêu gọn (Doanh thu & Số ngày làm việc đạt được / mục tiêu), tự động đổi trạng thái sang "Hoàn thành" khi đạt >= 100%, kèm nút chuyển hướng nhanh sang tab Chỉ tiêu (`setActiveTab('goals')`).
      + Nếu chưa có chỉ tiêu: Hiển thị hộp gợi ý tinh tế (`account-empty-goal-callout`) kèm nút bấm "+ Đặt chỉ tiêu" 1-chạm giúp người dùng thiết lập ngay mà không cần mò mẫm.
    - **Nâng cấp Mục Phân Tích Thu Nhập Từng Tháng (`monthly-breakdown-list`)**:
      + Liên kết dữ liệu chỉ tiêu của từng tháng trong lịch sử: hiển thị huy hiệu `✓ Đạt chỉ tiêu` (xanh ngọc) hoặc `Chỉ tiêu: xxxđ (xx%)`.
      + Thanh tiến độ tháng tự động căn theo % mục tiêu đã đặt của chính tháng đó.
    - **Đồng bộ Bảo mật & Trực quan hóa**:
      + Đồng bộ trạng thái ẩn/hiện tiền tệ bảo mật trên toàn bộ các widget và danh sách phân tích.
      + Chuẩn hóa bố cục, khoảng cách và màu sắc thẻ theo phong cách tối giản Dark SaaS sang trọng, hài hòa với giao diện ứng dụng.
      + Sửa lỗi cú pháp thiếu dấu đóng ngoặc nhọn `}` ở class `.btn-privacy-eye:hover` trong `globals.css` khiến trình duyệt không nhận diện được toàn bộ khối CSS trang cá nhân bên dưới.
    - Files thay đổi: `frontend/src/components/AccountPage.tsx`, `frontend/src/app/globals.css`, `SKILL.md`. Build frontend thành công 100% (Turbopack, TypeScript 0 lỗi).
  - Hoàn thiện Đóng gói Ứng dụng PWA Toàn Diện (Progressive Web App - Add to Home Screen):
    - **Bộ biểu tượng thương hiệu PWA (Brand Icon Suite)**:
      + Tạo bộ icon độ nét cao (`icon.svg`, `icon-192x192.png`, `icon-512x512.png`, `icon-maskable-512x512.png`, `apple-touch-icon.png`) mang phong cách Neon Glow Dark Theme với biểu tượng lịch và dấu tích xanh ngọc/tím chuẩn nhận diện SJob.
    - **Web App Manifest**:
      + Thiết lập cả `frontend/public/manifest.json` và `frontend/src/app/manifest.ts` chuẩn Next.js Metadata Route (`/manifest.webmanifest`).
      + Cấu hình chế độ hiển thị `standalone` (toàn màn hình, không thanh URL), `orientation: portrait`, `theme_color: #090d16`.
    - **Offline Resilience & Caching (Service Worker)**:
      + Xây dựng `frontend/public/sw.js` tự động precache tài nguyên tĩnh cốt lõi, áp dụng chiến lược Cache-first cho icon/assets và Network-first (fallback to cache) cho trang, giúp app vẫn mở được ngay cả khi mất mạng.
      + Tích hợp component đăng ký `ServiceWorkerRegister.tsx` an toàn trong `layout.tsx`.
    - **Trải nghiệm Cài đặt Trực quan (PWAInstallBanner & Account Quick Install)**:
      + Tự động lắng nghe sự kiện `beforeinstallprompt` trên Android/Chrome để kích hoạt cài đặt 1-chạm mượt mà.
      + Tích hợp hướng dẫn từng bước trực quan cho người dùng iPhone/iPad sử dụng Safari ("Bấm Chia sẻ 📤 -> Thêm vào MH chính").
      + Thêm tùy chọn "Cài đặt ứng dụng (PWA)" trực tiếp trong mục Quản trị tiện ích của trang Cá nhân (`AccountPage.tsx`).
    - Files thay đổi: `frontend/public/manifest.json`, `frontend/src/app/manifest.ts`, `frontend/public/sw.js`, `frontend/src/app/layout.tsx`, `frontend/src/app/page.tsx`, `frontend/src/components/PWAInstallBanner.tsx`, `frontend/src/components/ServiceWorkerRegister.tsx`, `frontend/src/components/AccountPage.tsx`, `frontend/src/app/globals.css`, `SKILL.md`. Build frontend thành công 100% (Turbopack, TypeScript 0 lỗi).
  - Cập Nhật Nhận Diện Thương Hiệu & Logo Mới Theo Yêu Cầu (Brand Logo Overhaul):
    - **Tích hợp Logo Biểu Tượng Lục Giác & Lịch (Hexagon Calendar Emblem)**:
      + Đưa biểu tượng nhận diện chính thức của người dùng (khung lục giác bo góc chứa biểu tượng lịch làm việc và dấu tích hoàn thành `✓`) vào toàn bộ ứng dụng.
      + Xử lý hình ảnh gốc bằng `sharp` để trích xuất biểu tượng sắc nét, tạo phiên bản trong suốt (`logo.png`, `logo-white.png`, `emblem.png`, `emblem-white.png`).
      + Tạo bản vẽ Vector chuẩn SVG (`icon.svg`, `logo.svg`) sắc nét vô hạn trên mọi độ phân giải màn hình.
    - **Đồng bộ Header & Trải nghiệm Điều hướng**:
      + Thay thế chữ "S" đơn điệu trong `Header.tsx` bằng huy hiệu biểu tượng logo chính thức (`emblem-white.png`).
      + Bổ sung tính năng chạm vào cụm Logo ở Header để quay nhanh về màn hình Lịch (`setActiveTab('calendar')`).
    - **Đồng bộ Toàn Bộ Icon Ứng dụng PWA**:
      + Tự động cập nhật `icon-192x192.png`, `icon-512x512.png`, `icon-maskable-512x512.png` và `apple-touch-icon.png` theo biểu tượng logo mới trên nền squircle sang trọng.
    - Files thay đổi: `frontend/public/logo.jpg`, `frontend/public/logo.png`, `frontend/public/logo-white.png`, `frontend/public/icons/*`, `frontend/src/components/Header.tsx`, `frontend/src/app/globals.css`, `SKILL.md`. Build frontend thành công 100% (Turbopack, TypeScript 0 lỗi).
  - Xây Dựng Bộ Kiểm Thử Tự Động Toàn Diện (Automated Testing Suite with Vitest):
    - **Bộ test Backend Overlap (`backend/src/jobs/jobs-overlap.spec.ts`)**:
      + 13 kịch bản kiểm thử tự động bao phủ 100% các trường hợp: Không trùng, khung giờ tách biệt, chạm mốc giờ liền kề (boundary touching), trùng góc trái, trùng góc phải, trùng lọt lòng (inner overlap), bao trùm toàn bộ (engulfing), trùng nhiều job cùng ngày, loại trừ chính ID khi cập nhật (`excludeJobId`), và kiểm tra lỗi validation khi `startTime >= endTime`.
    - **Bộ test Frontend Goals Calculator (`frontend/src/lib/goals-calculator.spec.ts`)**:
      + Tách module tính toán độc lập `goals-calculator.ts` phục vụ tính tổng doanh thu tháng, số ngày làm việc duy nhất, tiến độ phần trăm, số tiền/ngày còn thiếu và tốc độ cần đạt mỗi ngày (daily pace).
      + 8 kịch bản kiểm thử: Mảng job rỗng, lọc chính xác theo tháng, cộng dồn tiền công nhưng chỉ tính 1 ngày làm việc duy nhất khi có nhiều job trong cùng ngày, xử lý an toàn giá trị null/0, tính đúng % khi chưa đạt và khi đã vượt chỉ tiêu (>= 100%), phòng ngừa chia cho 0 khi hết tháng.
    - **Bộ test Frontend Guest Storage Overlap (`frontend/src/lib/storage-overlap.spec.ts`)**:
      + 5 kịch bản kiểm thử độc lập cho hàm `checkGuestOverlap` lưu trữ LocalStorage, đảm bảo tính nhất quán giữa Chế độ Khách và Chế độ Cloud.
    - **Tích hợp Monorepo Test Runner**:
      + Cấu hình lệnh `npm run test` ở root package.json kích hoạt đồng thời test runner trên cả hai workspace (`frontend` và `backend`).
      + Tổng cộng 27/27 bài test chạy thành công 100% chỉ trong ~4 giây.
    - Files thay đổi: `backend/src/jobs/jobs-overlap.spec.ts`, `frontend/src/lib/goals-calculator.ts`, `frontend/src/lib/goals-calculator.spec.ts`, `frontend/src/lib/storage-overlap.spec.ts`, `frontend/package.json`, `package.json`, `SKILL.md`. Build frontend + backend thành công 100%.
  - Chuẩn Bị & Lập Kế Hoạch Triển Khai Thực Tế 100% Miễn Phí (0 VNĐ/tháng):
    - **Cấu hình CORS Sản xuất linh hoạt (`backend/src/main.ts`)**:
      + Mở rộng middleware CORS tự động nhận diện các domain Vercel (`*.vercel.app`), biến môi trường `CORS_ORIGIN` và localhost, đảm bảo bảo mật và không bị chặn request API.
    - **Đóng gói Dockerfile & Render Blueprint**:
      + Tạo [backend/Dockerfile](file:///d:/SJob/backend/Dockerfile) đa tầng (multi-stage build) siêu nhẹ cho môi trường production.
      + Tạo [render.yaml](file:///d:/SJob/render.yaml) cho phép triển khai 1-click tự động trên Render.com Free Tier.
      + Tạo [.dockerignore](file:///d:/SJob/.dockerignore) loại bỏ các file rác khi build image.
    - **Tài liệu Kế hoạch Triển khai Chi tiết**:
      + Xây dựng tài liệu chi tiết quy trình 5 bước đưa SJob lên môi trường thực tế hoàn toàn miễn phí (Vercel cho Frontend PWA, Render.com cho Backend NestJS API, TiDB Serverless cho Cloud MySQL 8 với 25GB lưu trữ trọn đời).
    - Files thay đổi: `backend/src/main.ts`, `backend/Dockerfile`, `render.yaml`, `.dockerignore`, `SKILL.md`. Build frontend + backend thành công 100%.
  - Sửa Lỗi Triển Khai Render.com (Fix Render Build Code 127 nest: not found):
    - **Nguyên nhân**: Khi biến môi trường `NODE_ENV=production` được bật trên Render, `npm install` mặc định tự động bỏ qua `devDependencies` (`--omit=dev`), khiến gói `@nestjs/cli` không được cài đặt và lệnh `nest build` báo lỗi `sh: 1: nest: not found`.
    - **Khắc phục**:
      + Chuyển `@nestjs/cli` từ `devDependencies` sang `dependencies` trong [backend/package.json](file:///d:/SJob/backend/package.json).
      + Chuyển `prisma` từ `devDependencies` sang `dependencies` trong [package.json](file:///d:/SJob/package.json) gốc.
      + Cập nhật lệnh build trong [render.yaml](file:///d:/SJob/render.yaml) thêm cờ `--include=dev`.
      + Đã commit và push bản sửa lỗi lên GitHub branch `main`.
    - Files thay đổi: `backend/package.json`, `package.json`, `render.yaml`, `SKILL.md`.
  - Khắc Phục Lỗi TypeScript Khi Build Trên Môi Trường Production Render:
    - **Nguyên nhân**:
      + Thiếu các type definition cho `bcrypt` và `passport-jwt` do nằm trong `devDependencies`.
      + `tsconfig.build.json` kế thừa `vitest/globals` từ `tsconfig.json`.
      + `src/main.ts` thiếu định nghĩa kiểu tường minh cho callback CORS (`origin`, `callback`).
    - **Khắc phục**:
      + Chuyển `@types/node`, `@types/bcrypt`, `@types/passport-jwt`, `@types/express` sang `dependencies` trong [backend/package.json](file:///d:/SJob/backend/package.json).
      + Khai báo kiểu chặt chẽ cho middleware CORS trong [backend/src/main.ts](file:///d:/SJob/backend/src/main.ts).
      + Cấu hình [backend/tsconfig.build.json](file:///d:/SJob/backend/tsconfig.build.json) chỉ nạp kiểu `["node"]` và `skipLibCheck: true`.
      + Đã kiểm tra build thành công và đẩy commit mới lên GitHub `main`.
    - Files thay đổi: `backend/src/main.ts`, `backend/tsconfig.build.json`, `backend/package.json`, `SKILL.md`.
  - Triển Khai Backend NestJS Lên Render.com Thành Công (Status Live):
    - Dịch vụ Web Service `sjob-api` đã hoạt động chính thức tại: `https://sjob-api.onrender.com`.
    - Kết nối Cloud MySQL TiDB Serverless ổn định qua cổng SSL 4000.
    - Đã xác thực thành công các endpoint API hoạt động chuẩn xác với JSON response và CORS.
  - Sửa Lỗi Build Frontend Trên Vercel (Cannot find module 'vitest'):
    - **Nguyên nhân**: Khi Vercel build dự án từ thư mục con `frontend`, TypeScript typecheck kiểm tra cả các file `*.spec.ts` mà `vitest` không nằm trong `dependencies` của frontend.
    - **Khắc phục**:
      + Thêm `**/*.spec.ts`, `**/*.spec.tsx`, `**/*.test.ts`, `**/*.test.tsx` vào mục `exclude` trong [frontend/tsconfig.json](file:///d:/SJob/frontend/tsconfig.json) để Next.js bỏ qua file test khi build production.
      + Bổ sung `vitest` vào `devDependencies` của [frontend/package.json](file:///d:/SJob/frontend/package.json).
      + Xác thực build và toàn bộ 27/27 bài test chạy thành công 100%.
    - Files thay đổi: `frontend/tsconfig.json`, `frontend/package.json`, `SKILL.md`.
  - Tích Hợp Google Sign-In Chính Thức (Google Identity Services):
    - Khởi tạo và liên kết Google OAuth 2.0 Client ID: `257067138162-fnaf04q43i1gqcdg5nk833g907ep2t2m.apps.googleusercontent.com`.
    - Nhúng Google Identity Services SDK (`https://accounts.google.com/gsi/client`) vào `frontend/src/app/layout.tsx`.
    - Xây dựng component `GoogleAuthModal.tsx` hiển thị giao diện đăng nhập Google Cloud sang trọng, render nút Google chính thức và kích hoạt Google One Tap.
    - Cập nhật `Header.tsx` và `AccountSheet.tsx` mở GoogleAuthModal thay cho luồng mock cũ.
    - Cấu hình Backend `AuthService` xác thực token với audience Google Client ID chính thức.
    - Files thay đổi: `backend/src/auth/auth.service.ts`, `frontend/src/app/layout.tsx`, `frontend/src/app/page.tsx`, `frontend/src/app/globals.css`, `frontend/src/components/GoogleAuthModal.tsx`, `frontend/src/components/Header.tsx`, `frontend/src/components/AccountSheet.tsx`, `frontend/src/context/JobContext.tsx`, `SKILL.md`.
  - Khắc Phục Lỗi React removeChild DOM Collision Khi Render Nút Google:
    - **Nguyên nhân**: Khi đặt `<Script>` trong `<body>` của `layout.tsx` và để React render text bên trong container chứa nút Google `GoogleAuthModal`, Google SDK chèn iframe vào DOM khiến React bị xung đột hydration (`Failed to execute 'removeChild' on 'Node'`).
    - **Khắc phục**:
      + Xóa thẻ `<Script>` trực tiếp khỏi `<body>` trong [layout.tsx](file:///d:/SJob/frontend/src/app/layout.tsx).
      + Sử dụng cơ chế nạp động Google GSI Script an toàn vào `document.head` trong [GoogleAuthModal.tsx](file:///d:/SJob/frontend/src/components/GoogleAuthModal.tsx).
      + Sử dụng `useRef` cho container nút Google với cấu trúc rỗng hoàn toàn, không có React children để React không can thiệp vào iframe của Google.
    - Files thay đổi: `frontend/src/app/layout.tsx`, `frontend/src/components/GoogleAuthModal.tsx`, `SKILL.md`.
  - Tối Ưu Safe-Area & Đẩy Lùi Header Tránh Bị Che Trên Ứng Dụng Di Động PWA:
    - **Vấn đề**: Khi cài đặt PWA ra màn hình chính điện thoại (Standalone mode), phần Header bị thanh trạng thái (đồng hồ, biểu tượng pin, sóng) và camera nốt ruồi / notch đè lên trực tiếp.
    - **Khắc phục**:
      + Thêm cơ chế nhận diện tự động chế độ Standalone PWA (`(display-mode: standalone)` và `window.navigator.standalone`) trong [Header.tsx](file:///d:/SJob/frontend/src/components/Header.tsx).
      + Cập nhật [globals.css](file:///d:/SJob/frontend/src/app/globals.css) bổ sung `padding-top: max(48px, calc(14px + env(safe-area-inset-top, 36px)))` cho `.app-header.standalone-header` và `@media (display-mode: standalone)`.
      + Đồng thời bổ sung `padding-bottom` và an toàn cho thanh điều hướng đáy `.bottom-nav` và nút nổi `.fab-btn` tránh bị thanh điều hướng ảo/home indicator của điện thoại che mất.
    - Files thay đổi: `frontend/src/app/globals.css`, `frontend/src/components/Header.tsx`, `SKILL.md`.





















