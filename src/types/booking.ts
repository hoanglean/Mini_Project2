export type Building = 'Building A' | 'Building B' | 'Building C' | 'Building V';

export type TimeSlot =
  | '07:30 - 09:30'
  | '09:30 - 11:30'
  | '13:00 - 15:00'
  | '15:00 - 17:00';

export type EquipmentTag =
  | 'Projector'
  | 'Whiteboard'
  | 'High-spec PC'
  | 'AC'
  | 'Dual Monitors'
  | 'Soundproofing';

export type RoomType = 'study_room' | 'computer_lab';

export interface Room {
  id: string;
  name: string;
  code: string; // e.g. "A-101"
  building: Building;
  floor: number;
  capacity: number;
  type: RoomType;
  equipment: EquipmentTag[];
  imageUrl: string;
  description: string;
  rating: number;
  reviewCount: number;
  rules: string[];
}

export type ReservationStatus = 'confirmed' | 'cancelled' | 'checked-in';

export interface Reservation {
  id: string;
  roomId: string;
  roomName: string;
  roomCode: string;
  building: Building;
  floor: number;
  date: string; // YYYY-MM-DD
  timeSlot: TimeSlot;
  studentId: string;
  studentName: string;
  status: ReservationStatus;
  createdAt: string;
  notificationId?: string;
  qrPayload: string;
}

export interface FilterState {
  searchQuery: string;
  building: Building | 'ALL';
  minCapacity: number;
  equipment: EquipmentTag[];
  type: RoomType | 'ALL';
}

export interface UserSession {
  studentId: string;
  name: string;
  email: string;
  faculty: string;
  avatarUrl: string;
  provider?: 'email' | 'google' | 'guest';
  isLoggedIn?: boolean;
}

