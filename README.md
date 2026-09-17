# 🎓 Campus Space - Real-Time Study Room & Lab Booking App

> **Ứng dụng di động đặt phòng tự học & phòng thực hành máy tính theo thời gian thực dành cho sinh viên trường đại học.**  
> Xây dựng bằng **React Native (Expo SDK 57)**, **TypeScript**, **Zustand (AsyncStorage Persistence)**, **React Navigation**, và **Expo Notifications**.

[![Expo SDK](https://img.shields.io/badge/Expo-SDK%2057-black?style=flat&logo=expo)](https://docs.expo.dev/)
[![React Native](https://img.shields.io/badge/React%20Native-0.81.5-61DAFB?style=flat&logo=react)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Zustand](https://img.shields.io/badge/State-Zustand-orange?style=flat)](https://github.com/pmndrs/zustand)
[![Platform](https://img.shields.io/badge/Platforms-iOS%20%7C%20Android%20%7C%20Web-blue)](#)

---

## 🌟 Tính Năng Nổi Bật (Key Features)

### 1. 🔍 Khám Phá & Lọc Phòng Đa Tiêu Chí (Smart Discovery & Filter)
- **Tìm kiếm tức thì (Instant Search):** Tìm kiếm theo tên phòng, mã phòng (vd: `A-101`, `B-204`, `Quantum`...) theo thời gian thực.
- **Phân loại phòng (Room Types):** Xem tất cả phòng (*All Rooms*), phòng thực hành máy tính (*Computer Labs*), hoặc phòng tự học/thảo luận (*Study Rooms*).
- **Bộ lọc đa thông số:**
  - **Tòa nhà (Building):** Tòa A, Tòa B, Tòa C, Tòa V.
  - **Sức chứa (Capacity):** Bất kỳ (*Any size*), 4+, 8+, 12+, 16+ chỗ ngồi.
  - **Trang thiết bị (Equipment):** Máy tính cấu hình cao (*High-spec PC*), Máy chiếu (*Projector*), Bảng viết (*Whiteboard*), Điều hòa (*AC*), 2 Màn hình (*Dual Monitors*), Cách âm (*Soundproofing*).
- **Phản hồi kết quả tự động:** Hiển thị số lượng phòng phù hợp ngay lập tức kèm nút *Xem kết quả* thu gọn bộ lọc tiện lợi.

### 2. 📅 Đặt Lịch 7 Ngày & Động Cơ Chống Trùng (7-Day Conflict Engine)
- **Chọn ngày linh hoạt:** Lịch 7 ngày kế tiếp hiển thị trực quan.
- **Khung giờ cố định 2 tiếng:** `07:30 - 09:30`, `09:30 - 11:30`, `13:00 - 15:00`, `15:00 - 17:00`.
- **Ngăn chặn Double-Booking:** Khung giờ đã được sinh viên khác đặt sẽ tự động bị khóa, đổi màu xám và gắn nhãn kèm tên người đã giữ chỗ.
- **Vô hiệu hóa giờ đã qua:** Tự động chặn các khung giờ đã trôi qua trong ngày hiện tại.

### 3. 👤 Hồ Sơ & Thông Tin Sinh Viên Tùy Biến (Student Profile Management)
- **Nhập thông tin khi đặt phòng:** Khi bấm đặt phòng, hệ thống hiển thị form popup cho phép sinh viên tự điền **Họ tên, MSSV, Khoa/Lớp, Email**.
- **Quản lý Ảnh Đại Diện (Avatar):**
  - Mặc định sử dụng biểu tượng học sinh `🎓` và chữ cái viết tắt tên (Monogram Initial) thanh lịch.
  - Tải ảnh trực tiếp từ máy tính/điện thoại hoặc chọn từ bộ ảnh đại diện sinh viên mẫu.
  - Hỗ trợ gỡ bỏ/xóa ảnh đại diện bất kỳ lúc nào.

### 4. 🎫 Thẻ Vào Phòng Điện Tử Mã QR (Dynamic Booking QR Pass)
- Thẻ thông hành thiết kế dạng vé máy bay cao cấp (*Boarding Pass*).
- Mã **SVG QR Code** vector động (`react-native-qrcode-svg`) chứa thông tin phiên đặt phòng để quét mã tại cửa phòng máy / phòng tự học.
- Hỗ trợ nút **Mô phỏng điểm danh (Check-in)** và **Chia sẻ thẻ thông hành (Share Pass)**.

### 5. 🔔 Thông Báo Đẩy Nhắc Lịch Tự Động (Local Push Notifications)
- Tích hợp `expo-notifications` chuẩn Expo SDK 57.
- Tự động tính toán và kích hoạt chuông/thông báo đẩy **trước 15 phút** khi đến giờ nhận phòng.
- Bắn thông báo xác nhận tức thì ngay sau khi hoàn tất đặt phòng.

### 6. ❌ Quản Lý & Hủy Đặt Phòng An Toàn (Release Slot)
- Xem danh sách vé đã đặt: phân loại theo **Active & Upcoming** (Đang hiệu lực) và **Cancelled** (Đã hủy).
- Hộp thoại xác nhận hủy phòng chuyên biệt (**In-App Confirmation Modal**), tương thích 100% mượt mà trên cả trình duyệt Web và điện thoại.
- Giải phóng khung giờ tức thì trên hệ thống để sinh viên khác có thể đăng ký sử dụng.

### 7. 💾 Lưu Trữ Bền Vững (Local State Persistence)
- Sử dụng **Zustand** kết hợp với `@react-native-async-storage/async-storage`.
- Dữ liệu phòng đã đặt, lịch sử và thông tin sinh viên được lưu trữ bền vững, không bị mất khi tải lại trang hoặc khởi động lại ứng dụng.

---

## 🏗️ Cấu Trúc Dự Án (Project Architecture)

```
Mini_Project2/
├── assets/                 # Logo, favicon, splash screen assets
├── scripts/                # Scripts kiểm tra và thiết lập môi trường
├── src/
│   ├── components/         # Các component UI tái sử dụng
│   │   ├── BookingQRModal.tsx   # Modal hiển thị thẻ thông hành & mã QR Code
│   │   ├── FilterChips.tsx      # Bộ lọc loại phòng, tòa nhà, sức chứa, thiết bị
│   │   ├── RoomCard.tsx         # Thẻ hiển thị phòng (tối ưu hóa React.memo)
│   │   ├── SearchBar.tsx        # Thanh tìm kiếm từ khóa real-time
│   │   └── SlotPicker.tsx       # Lịch chọn ngày & khung giờ chống trùng lịch
│   ├── data/
│   │   └── mockRooms.ts         # Dữ liệu 10 không gian học tập & labs mẫu
│   ├── navigation/         # Điều hướng Bottom Tabs & Native Stack
│   │   ├── AppNavigator.tsx
│   │   └── types.ts
│   ├── screens/            # Các màn hình chính của ứng dụng
│   │   ├── HomeScreen.tsx       # Khám phá phòng, thống kê & lọc
│   │   ├── RoomDetailScreen.tsx # Chi tiết phòng, xem tiện ích & đặt chỗ
│   │   ├── MyBookingsScreen.tsx # Quản lý vé đặt, xem QR pass & hủy phòng
│   │   └── ProfileScreen.tsx    # Thẻ sinh viên, thống kê & đổi avatar
│   ├── store/
│   │   └── useBookingStore.ts   # Zustand store quản lý state & AsyncStorage
│   ├── types/
│   │   └── booking.ts           # Type definitions TypeScript
│   └── utils/
│       ├── dateHelper.ts        # Tiện ích xử lý ngày tháng & khung giờ
│       ├── notificationHelper.ts# Tiện ích đặt lịch thông báo Expo
│       └── theme.ts             # Bảng màu Campus Tech (Indigo/Emerald/Slate)
├── App.tsx                 # Root Component
├── app.json                # Cấu hình Expo Application
├── package.json            # Dependencies & Scripts
└── tsconfig.json           # Cấu hình TypeScript
```

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Ứng Dụng (Getting Started)

### 1. Yêu cầu môi trường (Prerequisites)
- [Node.js](https://nodejs.org/) (phiên bản 18 trở lên khuyến nghị Node 20+)
- npm hoặc yarn
- Ứng dụng **Expo Go** trên điện thoại (nếu muốn chạy thử trên thiết bị thật)

### 2. Cài đặt các thư viện (Dependencies)
Mở terminal trong thư mục dự án và chạy:
```bash
npm install
```

### 3. Khởi chạy ứng dụng (Start App)

- **Chạy trên Trình Duyệt Web:**
  ```bash
  npm run web
  # hoặc
  npx expo start --web
  ```
  Ứng dụng sẽ tự động mở trên trình duyệt tại `http://localhost:8081`.

- **Chạy trên Điện Thoại (Expo Go):**
  ```bash
  npm start
  # hoặc
  npx expo start
  ```
  Quét mã QR hiển thị trên terminal bằng camera điện thoại (iOS) hoặc ứng dụng Expo Go (Android).

- **Kiểm tra TypeScript:**
  ```bash
  npm run check-types
  # hoặc
  npx tsc --noEmit
  ```

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

| Công nghệ | Mục đích |
| :--- | :--- |
| **React Native (Expo SDK 57)** | Nền tảng xây dựng ứng dụng di động đa nền tảng |
| **TypeScript** | Định kiểu tĩnh an toàn, hạn chế lỗi runtime |
| **Zustand** | Quản lý state toàn cục gọn nhẹ, hiệu năng cao |
| **AsyncStorage** | Lưu trữ dữ liệu đặt phòng & hồ sơ sinh viên offline |
| **React Navigation 7** | Điều hướng Bottom Tabs kết hợp Native Stack mượt mà |
| **react-native-qrcode-svg** | Tạo mã QR Code SVG động tốc độ cao |
| **expo-notifications** | Lên lịch thông báo đẩy nhắc giờ nhận phòng |
| **@expo/vector-icons** | Bộ biểu tượng Ionicons hiện đại |

---

## 👨‍💻 Tác Giả (Author)
- Dự án phát triển bởi: **hoanglean**
- GitHub: [https://github.com/hoanglean](https://github.com/hoanglean)
- Repository: [https://github.com/hoanglean/Mini_Project2](https://github.com/hoanglean/Mini_Project2)
