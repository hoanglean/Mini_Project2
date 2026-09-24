# 🎓 Campus Space - Real-Time Study Room & Lab Booking App

> **Ứng dụng di động & web đặt phòng tự học & phòng thực hành máy tính theo thời gian thực dành cho sinh viên trường đại học.**  
> Xây dựng bằng **React Native (Expo SDK 57)**, **TypeScript**, **Supabase Cloud (PostgreSQL & OAuth)**, **Google Authentication**, **Zustand (AsyncStorage Persistence)**, **React Navigation**, và **Expo Notifications**.

[![Expo SDK](https://img.shields.io/badge/Expo-SDK%2057-black?style=flat&logo=expo)](https://docs.expo.dev/)
[![React Native](https://img.shields.io/badge/React%20Native-0.86.3-61DAFB?style=flat&logo=react)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0.3-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Backend-Supabase%20Cloud-3ECF8E?style=flat&logo=supabase)](https://supabase.com/)
[![Google OAuth](https://img.shields.io/badge/Auth-Google%20OAuth%202.0-EA4335?style=flat&logo=google)](https://cloud.google.com/)
[![Zustand](https://img.shields.io/badge/State-Zustand-orange?style=flat)](https://github.com/pmndrs/zustand)
[![Platform](https://img.shields.io/badge/Platforms-iOS%20%7C%20Android%20%7C%20Web%20%7C%20PWA-blue)](#)

---

## 🌟 Tính Năng Nổi Bật (Key Features)

### 1. 🔐 Đăng Nhập Google OAuth 2.0 & Chế Độ Khách (Google SSO)
- **Đăng nhập một chạm với Google:** Hỗ trợ đăng nhập nhanh chóng bằng tài khoản trường đại học (`@vku.udn.vn`) hoặc tài khoản Google cá nhân.
- **Bảo mật chuẩn OAuth 2.0:** Tích hợp qua hệ thống **Supabase Auth**, mã hóa token an toàn và tự động lấy danh tính sinh viên (họ tên, email, avatar).
- **Chế độ Khách tham quan (Guest Mode):** Cho phép người dùng trải nghiệm tra cứu danh sách phòng học và tiện ích mà không bắt buộc đăng nhập ngay.
- **Giao diện đăng nhập hiện đại:** Thiết kế mới mang đậm bản sắc trường học thông minh, nút Google chuẩn SVG sắc nét và tối ưu mượt mà trên cả Mobile lẫn Web.

### 2. ☁️ Cơ Sở Dữ Liệu Đám Mây Supabase (Cloud Database Sync)
- **Hệ quản trị PostgreSQL:** Dữ liệu đặt phòng và hồ sơ sinh viên được lưu trữ trực tiếp trên đám mây Supabase (`profiles` và `reservations`).
- **Bảo mật cấp hàng (Row Level Security - RLS):** Đảm bảo sinh viên chỉ có thể xem và quản lý các lượt đặt phòng của chính mình.
- **Đồng bộ hóa 2 chiều:** Kết hợp giữa lưu trữ cục bộ offline (**Zustand + AsyncStorage**) và lưu trữ đám mây, tự động đồng bộ khi có kết nối mạng.

### 3. 🔍 Khám Phá & Lọc Phòng Đa Tiêu Chí (Smart Discovery & Filter)
- **Tìm kiếm tức thì (Instant Search):** Tìm kiếm theo tên phòng, mã phòng (vd: `A-101`, `B-204`, `Quantum`...) theo thời gian thực.
- **Phân loại phòng (Room Types):** Xem tất cả phòng (*All Rooms*), phòng thực hành máy tính (*Computer Labs*), hoặc phòng tự học/thảo luận (*Study Rooms*).
- **Bộ lọc đa thông số:**
  - **Tòa nhà (Building):** Tòa A, Tòa B, Tòa C, Tòa V.
  - **Sức chứa (Capacity):** Bất kỳ (*Any size*), 4+, 8+, 12+, 16+ chỗ ngồi.
  - **Trang thiết bị (Equipment):** Máy tính cấu hình cao (*High-spec PC*), Máy chiếu (*Projector*), Bảng viết (*Whiteboard*), Điều hòa (*AC*), 2 Màn hình (*Dual Monitors*), Cách âm (*Soundproofing*).
- **Phản hồi kết quả tự động:** Hiển thị số lượng phòng phù hợp ngay lập tức kèm nút *Xem kết quả* thu gọn bộ lọc tiện lợi.

### 4. 📅 Đặt Lịch 7 Ngày & Động Cơ Chống Trùng (7-Day Conflict Engine)
- **Chọn ngày linh hoạt:** Lịch 7 ngày kế tiếp hiển thị trực quan.
- **Khung giờ cố định 2 tiếng:** `07:30 - 09:30`, `09:30 - 11:30`, `13:00 - 15:00`, `15:00 - 17:00`.
- **Ngăn chặn Double-Booking:** Khung giờ đã được sinh viên khác đặt sẽ tự động bị khóa, đổi màu xám và gắn nhãn kèm tên người đã giữ chỗ.
- **Vô hiệu hóa giờ đã qua:** Tự động chặn các khung giờ đã trôi qua trong ngày hiện tại.
- **Khởi tạo dữ liệu sạch:** Danh sách phòng ban đầu hoàn toàn trống, phản ánh chính xác các lượt đặt phòng thực tế của người dùng.

### 5. 🎫 Thẻ Vào Phòng Điện Tử Mã QR (Dynamic Booking QR Pass)
- Thẻ thông hành thiết kế dạng vé máy bay cao cấp (*Boarding Pass*).
- Mã **SVG QR Code** vector động (`react-native-qrcode-svg`) chứa thông tin phiên đặt phòng để quét mã tại cửa phòng máy / phòng tự học.
- Hỗ trợ nút **Mô phỏng điểm danh (Check-in)** và **Chia sẻ thẻ thông hành (Share Pass)**.

### 6. 🔔 Thông Báo Đẩy Nhắc Lịch Tự Động (Local Push Notifications)
- Tích hợp `expo-notifications` chuẩn Expo SDK 57.
- Tự động tính toán và kích hoạt chuông/thông báo đẩy **trước 15 phút** khi đến giờ nhận phòng.
- Bắn thông báo xác nhận tức thì ngay sau khi hoàn tất đặt phòng.

### 7. ❌ Quản Lý & Hủy Đặt Phòng An Toàn (Release Slot)
- Xem danh sách vé đã đặt: phân loại theo **Active & Upcoming** (Đang hiệu lực) và **Cancelled** (Đã hủy).
- Hộp thoại xác nhận hủy phòng chuyên biệt (**In-App Confirmation Modal**), tương thích 100% mượt mà trên cả trình duyệt Web và điện thoại.
- Giải phóng khung giờ tức thì trên cả Local và Supabase Cloud để sinh viên khác có thể đăng ký sử dụng.

---

## 🏗️ Cấu Trúc Dự Án (Project Architecture)

```
Mini_Project2/
├── assets/                 # Logo, favicon, icon ứng dụng
├── src/
│   ├── components/         # Các component UI tái sử dụng
│   │   ├── BookingQRModal.tsx   # Modal hiển thị thẻ thông hành & mã QR Code
│   │   ├── FilterChips.tsx      # Bộ lọc loại phòng, tòa nhà, sức chứa, thiết bị
│   │   ├── RoomCard.tsx         # Thẻ hiển thị phòng (tối ưu hóa React.memo)
│   │   ├── SearchBar.tsx        # Thanh tìm kiếm từ khóa real-time
│   │   └── SlotPicker.tsx       # Lịch chọn ngày & khung giờ chống trùng lịch
│   ├── data/
│   │   └── mockRooms.ts         # Dữ liệu 10 không gian học tập & labs mẫu
│   ├── lib/
│   │   └── supabase.ts          # Cấu hình kết nối Supabase Client & Auth
│   ├── navigation/         # Điều hướng Bottom Tabs & Native Stack
│   │   ├── AppNavigator.tsx
│   │   └── types.ts
│   ├── screens/            # Các màn hình chính của ứng dụng
│   │   ├── AuthScreen.tsx       # Màn hình Đăng nhập Google SSO & Khách
│   │   ├── HomeScreen.tsx       # Khám phá phòng, thống kê & lọc
│   │   ├── RoomDetailScreen.tsx # Chi tiết phòng, xem tiện ích & đặt chỗ
│   │   ├── MyBookingsScreen.tsx # Quản lý vé đặt, xem QR pass & hủy phòng
│   │   └── ProfileScreen.tsx    # Thẻ sinh viên, thống kê & tài khoản Google
│   ├── store/
│   │   └── useBookingStore.ts   # Zustand store quản lý state, AsyncStorage & Supabase sync
│   ├── types/
│   │   └── booking.ts           # Type definitions TypeScript
│   └── utils/
│       ├── dateHelper.ts        # Tiện ích xử lý ngày tháng & khung giờ
│       ├── notificationHelper.ts# Tiện ích đặt lịch thông báo Expo
│       └── theme.ts             # Bảng màu Campus Tech (Indigo/Emerald/Slate)
├── App.tsx                 # Root Component
├── app.json                # Cấu hình Expo Application
├── supabase-setup.sql      # Database Schema & RLS Policies cho Supabase
├── package.json            # Dependencies & Scripts (hỗ trợ npm run build web)
└── tsconfig.json           # Cấu hình TypeScript
```

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Ứng Dụng (Getting Started)

### 1. Cài đặt các thư viện (Dependencies)
Mở terminal trong thư mục dự án và chạy:
```bash
npm install
```

### 2. Thiết lập Cơ sở dữ liệu Supabase
1. Đăng nhập vào [Supabase Dashboard](https://supabase.com).
2. Vào **SQL Editor** $\rightarrow$ Tạo Query mới.
3. Sao chép toàn bộ nội dung file `supabase-setup.sql` và bấm **Run**.
4. Vào mục **Authentication** $\rightarrow$ **Providers** $\rightarrow$ Bật **Google** và điền Google Client ID & Secret.

### 3. Khởi chạy ứng dụng (Start App)

- **Chạy trên Trình Duyệt Web:**
  ```bash
  npm run web
  # hoặc
  npx expo start --web
  ```
  Ứng dụng sẽ tự động mở trên trình duyệt tại `http://localhost:8081`.

- **Chạy trên Điện Thoại (Expo Go qua Tunnel):**
  ```bash
  npx expo start --tunnel
  ```
  Quét mã QR bằng ứng dụng Expo Go trên điện thoại iOS / Android để trải nghiệm.

- **Đóng gói Web để Deploy (Cloudflare / Netlify / Vercel):**
  ```bash
  npm run build
  # Xuất bản build web tĩnh vào thư mục dist/
  ```

---

## 📱 Cài Đặt Ứng Dụng Lên Điện Thoại (PWA Installation)
Khi truy cập đường link Live Demo trên trình duyệt điện thoại:
* **Trên iPhone (iOS - Safari):** Bấm nút **Chia sẻ** $\rightarrow$ Chọn **"Thêm vào Màn hình chính" (Add to Home Screen)**.
* **Trên Android (Chrome):** Bấm menu **3 chấm** $\rightarrow$ Chọn **"Cài đặt ứng dụng"** hoặc **"Thêm vào màn hình chính"**.
👉 Biểu tượng ứng dụng **Campus Space** sẽ xuất hiện trên màn hình điện thoại và hoạt động toàn màn hình mượt mà như một ứng dụng gốc tải từ App Store / Google Play.

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

| Công nghệ | Mục đích |
| :--- | :--- |
| **React Native (Expo SDK 57)** | Nền tảng xây dựng ứng dụng di động & web đa nền tảng |
| **Supabase Cloud** | Cơ sở dữ liệu PostgreSQL đám mây & Backend xác thực người dùng |
| **Google OAuth 2.0** | Đăng nhập tài khoản sinh viên bảo mật một chạm |
| **TypeScript** | Định kiểu tĩnh an toàn, hạn chế lỗi runtime |
| **Zustand** | Quản lý state toàn cục gọn nhẹ kết hợp lưu trữ đám mây & offline |
| **AsyncStorage** | Lưu trữ phiên làm việc và dữ liệu cục bộ |
| **React Navigation 7** | Điều hướng Bottom Tabs kết hợp Native Stack mượt mà |
| **react-native-qrcode-svg** | Tạo mã QR Code SVG động chất lượng cao |
| **expo-notifications** | Lên lịch thông báo đẩy nhắc giờ nhận phòng tự động |
| **expo-web-browser** | Xử lý phiên xác thực OAuth trên nền tảng di động |
| **@expo/vector-icons** | Bộ biểu tượng Ionicons hiện đại chuẩn thiết kế |

---

## 👨‍💻 Tác Giả (Author)
- Dự án phát triển bởi: **hoanglean**
- GitHub: [https://github.com/hoanglean](https://github.com/hoanglean)
- Repository: [https://github.com/hoanglean/Mini_Project2](https://github.com/hoanglean/Mini_Project2)
