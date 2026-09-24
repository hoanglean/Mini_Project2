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
import { supabase } from '../lib/supabase';

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
  // Auth state
  isAuthenticated: boolean;
  loginWithEmail: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  registerWithEmail: (data: {
    name: string;
    studentId: string;
    email: string;
    faculty: string;
    password: string;
  }) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: (
    googleData?: Partial<UserSession>
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  continueAsGuest: () => void;
  // Supabase sync
  syncReservationsFromSupabase: () => Promise<void>;
  syncReservationToSupabase: (reservation: Reservation) => Promise<void>;

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
      isAuthenticated: false,
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

        if (!activeSlot) return true;
        return !get().isSlotBooked(roomId, today, activeSlot);
      },

      getFilteredRooms: (): Room[] => {
        const { rooms, filters } = get();
        return rooms.filter((room) => {
          if (filters.searchQuery.trim().length > 0) {
            const query = filters.searchQuery.toLowerCase();
            const matchesName = room.name.toLowerCase().includes(query);
            const matchesCode = room.code.toLowerCase().includes(query);
            const matchesDesc = room.description.toLowerCase().includes(query);
            if (!matchesName && !matchesCode && !matchesDesc) {
              return false;
            }
          }
          if (filters.building !== 'ALL' && room.building !== filters.building) {
            return false;
          }
          if (filters.minCapacity > 0 && room.capacity < filters.minCapacity) {
            return false;
          }
          if (filters.type !== 'ALL' && room.type !== filters.type) {
            return false;
          }
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

        if (isSlotBooked(roomId, date, slot)) {
          return {
            success: false,
            error: `Slot ${slot} on ${date} is already reserved by another student.`,
          };
        }

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

        const notificationId = await schedulePreSlotReminder(newReservation);
        if (notificationId) {
          newReservation.notificationId = notificationId;
        }

        await triggerInstantBookingConfirmation(newReservation);

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

        // Sync to Supabase (non-blocking)
        get().syncReservationToSupabase(newReservation).catch((err) => {
          console.warn('Failed to sync reservation to Supabase:', err);
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

        // Also update Supabase profile (non-blocking)
        const updateSupabaseProfile = async () => {
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              await supabase
                .from('profiles')
                .update({
                  name: session.name,
                  student_id: session.studentId,
                  faculty: session.faculty,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', user.id);
            }
          } catch (err) {
            console.warn('Failed to update Supabase profile:', err);
          }
        };
        if (session.name || session.studentId || session.faculty) {
          updateSupabaseProfile();
        }
      },

      cancelBooking: async (bookingId: string): Promise<boolean> => {
        const { activeReservations } = get();
        const targetReservation = activeReservations.find(
          (r) => r.id === bookingId
        );

        if (!targetReservation) return false;

        if (targetReservation.notificationId) {
          await cancelScheduledReminder(targetReservation.notificationId);
        }

        set({
          activeReservations: activeReservations.map((res) =>
            res.id === bookingId ? { ...res, status: 'cancelled' } : res
          ),
        });

        // Sync cancellation to Supabase (non-blocking)
        (async () => {
          try {
            await supabase
              .from('reservations')
              .update({ status: 'cancelled' })
              .eq('id', bookingId);
          } catch (err) {
            console.warn('Failed to sync cancellation to Supabase:', err);
          }
        })();

        return true;
      },

      checkInBooking: (bookingId: string) => {
        const { activeReservations } = get();
        set({
          activeReservations: activeReservations.map((res) =>
            res.id === bookingId ? { ...res, status: 'checked-in' } : res
          ),
        });

        // Sync check-in to Supabase (non-blocking)
        (async () => {
          try {
            await supabase
              .from('reservations')
              .update({ status: 'checked-in' })
              .eq('id', bookingId);
          } catch (err) {
            console.warn('Failed to sync check-in to Supabase:', err);
          }
        })();
      },

      // ============ SUPABASE AUTH ============

      loginWithEmail: async (email: string, password: string) => {
        const cleanEmail = email.trim();
        const cleanPass = password.trim();
        if (!cleanEmail || !cleanPass) {
          return { success: false, error: 'Vui lòng nhập đầy đủ email và mật khẩu.' };
        }
        if (cleanPass.length < 6) {
          return { success: false, error: 'Mật khẩu phải có độ dài từ 6 ký tự trở lên.' };
        }

        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password: cleanPass,
          });

          if (error) {
            if (error.message.includes('Invalid login credentials')) {
              return { success: false, error: 'Email hoặc mật khẩu không đúng.' };
            }
            if (error.message.includes('Email not confirmed')) {
              return { success: false, error: 'Email chưa được xác nhận. Vui lòng kiểm tra hộp thư.' };
            }
            return { success: false, error: error.message };
          }

          if (data.user) {
            // Fetch profile from Supabase
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', data.user.id)
              .single();

            const updatedUser: UserSession = {
              studentId: profile?.student_id || '',
              name: profile?.name || data.user.user_metadata?.name || '',
              email: data.user.email || cleanEmail,
              faculty: profile?.faculty || 'Khoa Công Nghệ Thông Tin',
              avatarUrl: '',
              provider: 'email',
              isLoggedIn: true,
            };

            set({
              userSession: updatedUser,
              isAuthenticated: true,
            });

            // Sync reservations from Supabase
            get().syncReservationsFromSupabase();

            return { success: true };
          }

          return { success: false, error: 'Đăng nhập thất bại.' };
        } catch (err: any) {
          return { success: false, error: err.message || 'Lỗi kết nối. Vui lòng thử lại.' };
        }
      },

      registerWithEmail: async (regData) => {
        if (!regData.name.trim() || !regData.email.trim() || !regData.studentId.trim() || !regData.password.trim()) {
          return { success: false, error: 'Vui lòng điền đầy đủ các thông tin bắt buộc.' };
        }
        if (regData.password.length < 6) {
          return { success: false, error: 'Mật khẩu phải có độ dài từ 6 ký tự trở lên.' };
        }

        try {
          const { data: authData, error } = await supabase.auth.signUp({
            email: regData.email.trim(),
            password: regData.password,
            options: {
              data: {
                name: regData.name.trim(),
                student_id: regData.studentId.trim().toUpperCase(),
                faculty: regData.faculty.trim() || 'Khoa Công Nghệ Thông Tin',
              },
            },
          });

          if (error) {
            if (error.message.includes('already registered')) {
              return { success: false, error: 'Email này đã được đăng ký. Vui lòng đăng nhập.' };
            }
            return { success: false, error: error.message };
          }

          if (authData.user?.identities && authData.user.identities.length === 0) {
            return {
              success: false,
              error: 'Email này đã tồn tại trong hệ thống. Vui lòng chuyển sang tab "Đăng Nhập".',
            };
          }

          if (authData.user) {
            // Ensure profile is saved to Supabase profiles table
            try {
              await supabase.from('profiles').upsert({
                id: authData.user.id,
                student_id: regData.studentId.trim().toUpperCase(),
                name: regData.name.trim(),
                email: regData.email.trim(),
                faculty: regData.faculty.trim() || 'Khoa Công Nghệ Thông Tin',
              });
            } catch (profileErr) {
              console.warn('Profile upsert warning:', profileErr);
            }

            const newUser: UserSession = {
              studentId: regData.studentId.trim().toUpperCase(),
              name: regData.name.trim(),
              email: regData.email.trim(),
              faculty: regData.faculty.trim() || 'Khoa Công Nghệ Thông Tin',
              avatarUrl: '',
              provider: 'email',
              isLoggedIn: true,
            };

            set({
              userSession: newUser,
              isAuthenticated: true,
            });
            return { success: true };
          }

          return { success: false, error: 'Đăng ký thất bại.' };
        } catch (err: any) {
          return { success: false, error: err.message || 'Lỗi kết nối. Vui lòng thử lại.' };
        }
      },

      logout: () => {
        supabase.auth.signOut().catch((err) => {
          console.warn('Supabase sign out error:', err);
        });

        set({
          isAuthenticated: false,
          userSession: {
            studentId: '',
            name: '',
            email: '',
            faculty: '',
            avatarUrl: '',
            provider: undefined,
            isLoggedIn: false,
          },
        });
      },

      loginWithGoogle: async (googleData?: Partial<UserSession>) => {
        const googleUser: UserSession = {
          studentId: googleData?.studentId || 'GG-' + Math.floor(10000 + Math.random() * 90000),
          name: googleData?.name || '',
          email: googleData?.email || '',
          faculty: googleData?.faculty || 'Khoa Công Nghệ Thông Tin',
          avatarUrl: googleData?.avatarUrl || '',
          provider: 'google',
          isLoggedIn: true,
        };

        set({
          userSession: googleUser,
          isAuthenticated: true,
        });

        // Sync reservations from Supabase
        get().syncReservationsFromSupabase();

        return { success: true };
      },

      continueAsGuest: () => {
        set({
          isAuthenticated: false,
          userSession: {
            ...get().userSession,
            provider: 'guest',
            isLoggedIn: false,
          },
        });
      },

      // ============ SUPABASE SYNC ============

      syncReservationsFromSupabase: async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          const { data: reservations, error } = await supabase
            .from('reservations')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (error) {
            console.warn('Failed to fetch reservations from Supabase:', error);
            return;
          }

          if (reservations && reservations.length > 0) {
            const mapped: Reservation[] = reservations.map((r) => ({
              id: r.id,
              roomId: r.room_id,
              roomName: r.room_name,
              roomCode: r.room_code,
              building: r.building as Building,
              floor: r.floor,
              date: r.date,
              timeSlot: r.time_slot as TimeSlot,
              studentId: r.student_id,
              studentName: r.student_name,
              status: r.status as Reservation['status'],
              createdAt: r.created_at,
              notificationId: r.notification_id || undefined,
              qrPayload: r.qr_payload || '',
            }));

            const { activeReservations: localRes } = get();
            const supabaseIds = new Set(mapped.map((r) => r.id));
            const localOnly = localRes.filter((r) => !supabaseIds.has(r.id));
            set({ activeReservations: [...mapped, ...localOnly] });
          }
        } catch (err) {
          console.warn('syncReservationsFromSupabase error:', err);
        }
      },

      syncReservationToSupabase: async (reservation: Reservation) => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          await supabase.from('reservations').upsert({
            id: reservation.id,
            user_id: user.id,
            room_id: reservation.roomId,
            room_name: reservation.roomName,
            room_code: reservation.roomCode,
            building: reservation.building,
            floor: reservation.floor,
            date: reservation.date,
            time_slot: reservation.timeSlot,
            student_id: reservation.studentId,
            student_name: reservation.studentName,
            status: reservation.status,
            qr_payload: reservation.qrPayload,
            notification_id: reservation.notificationId || null,
            created_at: reservation.createdAt,
          });
        } catch (err) {
          console.warn('syncReservationToSupabase error:', err);
        }
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
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.userSession?.isLoggedIn) {
          state.isAuthenticated = true;
        }
        state?.setHydrated(true);
      },
    }
  )
);
