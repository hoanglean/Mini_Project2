import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Room,
  Reservation,
  FilterState,
  UserSession,
  TimeSlot,
  Building,
  EquipmentTag,
} from '../types/booking';
import { MOCK_ROOMS, MOCK_USER, getInitialReservations } from '../data/mockRooms';
import { getUpcomingDays, isSlotInPast } from '../utils/dateHelper';
import {
  schedulePreSlotReminder,
  triggerInstantBookingConfirmation,
  cancelScheduledReminder,
} from '../utils/notificationHelper';

export interface BookingStoreState {
  // Slices
  rooms: Room[];
  activeReservations: Reservation[];
  selectedDate: string;
  filters: FilterState;
  userSession: UserSession;
  isHydrated: boolean;

  // Actions
  setSelectedDate: (date: string) => void;
  setFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;
  bookRoom: (
    roomId: string,
    date: string,
    slot: TimeSlot,
    studentInfo?: {
      name: string;
      studentId: string;
      email?: string;
      faculty?: string;
    }
  ) => Promise<{ success: boolean; reservation?: Reservation; error?: string }>;
  updateUserSession: (session: Partial<UserSession>) => void;
  cancelBooking: (bookingId: string) => Promise<boolean>;
  checkInBooking: (bookingId: string) => void;
  isSlotBooked: (roomId: string, date: string, slot: TimeSlot) => boolean;
  isRoomAvailableNow: (roomId: string) => boolean;
  getFilteredRooms: () => Room[];
  setHydrated: (state: boolean) => void;
}

const initialFilters: FilterState = {
  searchQuery: '',
  building: 'ALL',
  minCapacity: 0,
  equipment: [],
  type: 'ALL',
};

export const useBookingStore = create<BookingStoreState>()(
  persist(
    (set, get) => ({
      rooms: MOCK_ROOMS,
      activeReservations: getInitialReservations(),
      selectedDate: getUpcomingDays(1)[0].dateString,
      filters: initialFilters,
      userSession: MOCK_USER,
      isHydrated: false,

      setSelectedDate: (date: string) => {
        set({ selectedDate: date });
      },

      setFilters: (partialFilters: Partial<FilterState>) => {
        set((state) => ({
          filters: { ...state.filters, ...partialFilters },
        }));
      },

      resetFilters: () => {
        set({ filters: initialFilters });
      },

      isSlotBooked: (roomId: string, date: string, slot: TimeSlot): boolean => {
        const { activeReservations } = get();
        return activeReservations.some(
          (res) =>
            res.roomId === roomId &&
            res.date === date &&
            res.timeSlot === slot &&
            res.status === 'confirmed'
        );
      },

      isRoomAvailableNow: (roomId: string): boolean => {
        const today = getUpcomingDays(1)[0].dateString;
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        // Check which slot we are in:
        // 07:30 - 09:30 (450 to 570)
        // 09:30 - 11:30 (570 to 690)
        // 13:00 - 15:00 (780 to 900)
        // 15:00 - 17:00 (900 to 1020)
        let activeSlot: TimeSlot | null = null;
        if (currentMinutes >= 450 && currentMinutes < 570) {
          activeSlot = '07:30 - 09:30';
        } else if (currentMinutes >= 570 && currentMinutes < 690) {
          activeSlot = '09:30 - 11:30';
        } else if (currentMinutes >= 780 && currentMinutes < 900) {
          activeSlot = '13:00 - 15:00';
        } else if (currentMinutes >= 900 && currentMinutes < 1020) {
          activeSlot = '15:00 - 17:00';
        }

        // If not in a class slot right now, room is generally available
        if (!activeSlot) return true;

        // Check if there is an active reservation right now
        return !get().isSlotBooked(roomId, today, activeSlot);
      },

      getFilteredRooms: (): Room[] => {
        const { rooms, filters } = get();
        return rooms.filter((room) => {
          // Search query filter (matches name, code, description)
          if (filters.searchQuery.trim().length > 0) {
            const query = filters.searchQuery.toLowerCase();
            const matchesName = room.name.toLowerCase().includes(query);
            const matchesCode = room.code.toLowerCase().includes(query);
            const matchesDesc = room.description.toLowerCase().includes(query);
            if (!matchesName && !matchesCode && !matchesDesc) {
              return false;
            }
          }

          // Building filter
          if (filters.building !== 'ALL' && room.building !== filters.building) {
            return false;
          }

          // Min Capacity filter
          if (filters.minCapacity > 0 && room.capacity < filters.minCapacity) {
            return false;
          }

          // Room Type filter
          if (filters.type !== 'ALL' && room.type !== filters.type) {
            return false;
          }

          // Equipment tags filter (room must possess all selected tags)
          if (filters.equipment.length > 0) {
            const hasAllEquipment = filters.equipment.every((eq) =>
              room.equipment.includes(eq)
            );
            if (!hasAllEquipment) return false;
          }

          return true;
        });
      },

      bookRoom: async (
        roomId: string,
        date: string,
        slot: TimeSlot,
        studentInfo?: {
          name: string;
          studentId: string;
          email?: string;
          faculty?: string;
        }
      ) => {
        const { rooms, activeReservations, userSession, isSlotBooked } = get();

        // 1. Conflict Prevention Check
        if (isSlotBooked(roomId, date, slot)) {
          return {
            success: false,
            error: `Slot ${slot} on ${date} is already reserved by another student.`,
          };
        }

        // Check if slot has already passed
        if (isSlotInPast(date, slot)) {
          return {
            success: false,
            error: `Cannot book a time slot that has already passed.`,
          };
        }

        const targetRoom = rooms.find((r) => r.id === roomId);
        if (!targetRoom) {
          return {
            success: false,
            error: 'Specified room was not found in campus directory.',
          };
        }

        // Determine student details from input or existing profile
        const activeName = studentInfo?.name?.trim() || userSession.name || 'Sinh viên';
        const activeStudentId =
          studentInfo?.studentId?.trim() ||
          userSession.studentId ||
          `STU-${Math.floor(10000 + Math.random() * 90000)}`;
        const activeEmail =
          studentInfo?.email?.trim() ||
          userSession.email ||
          `${activeStudentId.toLowerCase()}@campus.edu`;
        const activeFaculty =
          studentInfo?.faculty?.trim() || userSession.faculty || 'Trường Đại học';

        // 2. Generate Unique Booking ID & Pass Payload
        const timestamp = Date.now().toString().slice(-6);
        const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
        const bookingId = `BK-${randomHex}-${timestamp}`;

        const qrPayload = JSON.stringify({
          bookingId,
          roomId: targetRoom.id,
          roomCode: targetRoom.code,
          building: targetRoom.building,
          floor: targetRoom.floor,
          date,
          timeSlot: slot,
          studentId: activeStudentId,
          studentName: activeName,
          issuedAt: new Date().toISOString(),
        });

        const newReservation: Reservation = {
          id: bookingId,
          roomId: targetRoom.id,
          roomName: targetRoom.name,
          roomCode: targetRoom.code,
          building: targetRoom.building,
          floor: targetRoom.floor,
          date,
          timeSlot: slot,
          studentId: activeStudentId,
          studentName: activeName,
          status: 'confirmed',
          createdAt: new Date().toISOString(),
          qrPayload,
        };

        // 3. Local Push Notifications Integration
        // Schedule pre-slot reminder 15 minutes before
        const notificationId = await schedulePreSlotReminder(newReservation);
        if (notificationId) {
          newReservation.notificationId = notificationId;
        }

        // Trigger immediate booking confirmation
        await triggerInstantBookingConfirmation(newReservation);

        // 4. Update Global Store State and User Profile
        set({
          activeReservations: [newReservation, ...activeReservations],
          userSession: {
            ...userSession,
            name: activeName,
            studentId: activeStudentId,
            email: activeEmail,
            faculty: activeFaculty,
          },
        });

        return {
          success: true,
          reservation: newReservation,
        };
      },

      updateUserSession: (session: Partial<UserSession>) => {
        set((state) => ({
          userSession: {
            ...state.userSession,
            ...session,
          },
        }));
      },

      cancelBooking: async (bookingId: string): Promise<boolean> => {
        const { activeReservations } = get();
        const targetReservation = activeReservations.find(
          (r) => r.id === bookingId
        );

        if (!targetReservation) return false;

        // Cancel scheduled notification if one exists
        if (targetReservation.notificationId) {
          await cancelScheduledReminder(targetReservation.notificationId);
        }

        // Update reservation status to cancelled
        set({
          activeReservations: activeReservations.map((res) =>
            res.id === bookingId ? { ...res, status: 'cancelled' } : res
          ),
        });

        return true;
      },

      checkInBooking: (bookingId: string) => {
        const { activeReservations } = get();
        set({
          activeReservations: activeReservations.map((res) =>
            res.id === bookingId ? { ...res, status: 'checked-in' } : res
          ),
        });
      },

      setHydrated: (state: boolean) => {
        set({ isHydrated: state });
      },
    }),
    {
      name: 'campus-room-booking-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        activeReservations: state.activeReservations,
        userSession: state.userSession,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);
