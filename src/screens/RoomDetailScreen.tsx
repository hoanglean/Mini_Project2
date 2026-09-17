import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Platform,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { TimeSlot, Reservation } from '../types/booking';
import { useBookingStore } from '../store/useBookingStore';
import { SlotPicker } from '../components/SlotPicker';
import { BookingQRModal } from '../components/BookingQRModal';
import { theme } from '../utils/theme';
import { formatDisplayDate } from '../utils/dateHelper';

type RoomDetailRouteProp = RouteProp<RootStackParamList, 'RoomDetail'>;
type RoomDetailNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const RoomDetailScreen: React.FC = () => {
  const route = useRoute<RoomDetailRouteProp>();
  const navigation = useNavigation<RoomDetailNavigationProp>();
  const { roomId } = route.params;

  const rooms = useBookingStore((state) => state.rooms);
  const selectedDate = useBookingStore((state) => state.selectedDate);
  const setSelectedDate = useBookingStore((state) => state.setSelectedDate);
  const bookRoom = useBookingStore((state) => state.bookRoom);
  const isRoomAvailableNow = useBookingStore((state) => state.isRoomAvailableNow);
  const userSession = useBookingStore((state) => state.userSession);

  const room = rooms.find((r) => r.id === roomId);

  // Local selection state for the 2-hour slot
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedReservation, setConfirmedReservation] = useState<Reservation | null>(
    null
  );
  const [modalVisible, setModalVisible] = useState(false);

  // Student Profile Form Modal State
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [studentName, setStudentName] = useState(userSession.name || '');
  const [studentId, setStudentId] = useState(userSession.studentId || '');
  const [faculty, setFaculty] = useState(userSession.faculty || '');
  const [email, setEmail] = useState(userSession.email || '');
  const [formError, setFormError] = useState('');

  if (!room) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={54} color={theme.colors.danger} />
        <Text style={styles.errorTitle}>Room Not Found</Text>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backBtnText}>Return to Directory</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const isAvailableNow = isRoomAvailableNow(room.id);

  const getEquipmentIcon = (equipment: string): any => {
    switch (equipment) {
      case 'Projector':
        return 'projector';
      case 'Whiteboard':
        return 'clipboard-text-outline';
      case 'High-spec PC':
        return 'desktop-mac';
      case 'AC':
        return 'snowflake';
      case 'Dual Monitors':
        return 'monitor-multiple';
      case 'Soundproofing':
        return 'volume-mute';
      default:
        return 'check-circle-outline';
    }
  };

  const handleBooking = () => {
    if (!selectedSlot) {
      Alert.alert(
        'Chọn khung giờ',
        'Vui lòng chọn 1 trong các khung giờ 2 tiếng còn trống trước khi tiếp tục.'
      );
      return;
    }

    // Pre-fill with existing user session if available
    if (!studentName && userSession.name) setStudentName(userSession.name);
    if (!studentId && userSession.studentId) setStudentId(userSession.studentId);
    if (!faculty && userSession.faculty) setFaculty(userSession.faculty);
    if (!email && userSession.email) setEmail(userSession.email);
    setFormError('');
    setFormModalVisible(true);
  };

  const handleConfirmBooking = async () => {
    if (!studentName.trim()) {
      setFormError('Vui lòng nhập họ và tên của bạn.');
      return;
    }
    if (!studentId.trim()) {
      setFormError('Vui lòng nhập mã số sinh viên (MSSV).');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await bookRoom(room.id, selectedDate, selectedSlot!, {
        name: studentName.trim(),
        studentId: studentId.trim(),
        faculty: faculty.trim(),
        email: email.trim(),
      });

      if (result.success && result.reservation) {
        setConfirmedReservation(result.reservation);
        setFormModalVisible(false);
        setModalVisible(true);
        setSelectedSlot(null); // Reset selection
      } else {
        Alert.alert(
          'Booking Conflict',
          result.error ||
            'Khung giờ này vừa có người đặt. Vui lòng chọn khung giờ khác.'
        );
      }
    } catch (err) {
      Alert.alert('Booking Error', 'Có lỗi xảy ra khi đặt phòng.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Custom Header with Back Button */}
      <View style={styles.navBar}>
        <TouchableOpacity
          style={styles.navBackBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={22} color={theme.colors.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.navTitle} numberOfLines={1}>
          {room.code} • {room.name}
        </Text>

        <View style={styles.navPlaceholder} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Image */}
        <View style={styles.heroContainer}>
          <Image
            source={{ uri: room.imageUrl }}
            style={styles.heroImage}
            resizeMode="cover"
          />

          {/* Status overlay */}
          <View
            style={[
              styles.statusPill,
              isAvailableNow ? styles.statusPillAvail : styles.statusPillOccupied,
            ]}
          >
            <View style={styles.statusPillDot} />
            <Text style={styles.statusPillText}>
              {isAvailableNow ? 'Available Right Now' : 'Currently In Session'}
            </Text>
          </View>

          {/* Room Code Badge */}
          <View style={styles.roomCodePill}>
            <Text style={styles.roomCodeText}>{room.code}</Text>
          </View>
        </View>

        {/* Room Header Info */}
        <View style={styles.infoCard}>
          <View style={styles.infoCategoryRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>
                {room.type === 'computer_lab' ? 'COMPUTER LAB' : 'STUDY ROOM'}
              </Text>
            </View>

            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Text style={styles.ratingValue}>{room.rating.toFixed(1)}</Text>
              <Text style={styles.ratingSub}>({room.reviewCount} reviews)</Text>
            </View>
          </View>

          <Text style={styles.roomName}>{room.name}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons
                name="location-sharp"
                size={16}
                color={theme.colors.primary}
              />
              <Text style={styles.metaText}>
                {room.building} (Floor {room.floor})
              </Text>
            </View>

            <View style={styles.metaItem}>
              <Ionicons name="people" size={16} color={theme.colors.primary} />
              <Text style={styles.metaText}>Up to {room.capacity} seats</Text>
            </View>
          </View>

          {/* Overview description */}
          <Text style={styles.sectionHeader}>ROOM OVERVIEW</Text>
          <Text style={styles.description}>{room.description}</Text>

          {/* Amenities & Equipment */}
          <Text style={styles.sectionHeader}>INSTALLED EQUIPMENT & AMENITIES</Text>
          <View style={styles.equipmentGrid}>
            {room.equipment.map((eq) => (
              <View key={eq} style={styles.equipmentCard}>
                <MaterialCommunityIcons
                  name={getEquipmentIcon(eq)}
                  size={18}
                  color={theme.colors.primary}
                />
                <Text style={styles.equipmentLabel}>{eq}</Text>
              </View>
            ))}
          </View>

          {/* Usage Rules */}
          <Text style={styles.sectionHeader}>CAMPUS USAGE GUIDELINES</Text>
          <View style={styles.rulesList}>
            {room.rules.map((rule, idx) => (
              <View key={idx} style={styles.ruleItem}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={14}
                  color={theme.colors.accentDark}
                  style={{ marginTop: 2 }}
                />
                <Text style={styles.ruleText}>{rule}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Real-time Time-Slot Conflict Engine Selector */}
        <SlotPicker
          roomId={room.id}
          selectedDate={selectedDate}
          onSelectDate={(d) => {
            setSelectedDate(d);
            setSelectedSlot(null); // reset slot when date changes
          }}
          selectedSlot={selectedSlot}
          onSelectSlot={(s) => setSelectedSlot(s)}
        />
      </ScrollView>

      {/* Bottom Sticky Booking Action Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomSummary}>
          <Text style={styles.bottomLabel}>RESERVATION FOR</Text>
          <Text style={styles.bottomDate}>
            {formatDisplayDate(selectedDate)}
          </Text>
          <Text style={styles.bottomSlot}>
            {selectedSlot ? `Slot: ${selectedSlot}` : 'Select a slot above'}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.bookButton,
            (!selectedSlot || isSubmitting) && styles.bookButtonDisabled,
          ]}
          onPress={handleBooking}
          disabled={!selectedSlot || isSubmitting}
          activeOpacity={0.85}
        >
          <Text style={styles.bookButtonText}>
            {isSubmitting ? 'Securing...' : 'Reserve Room'}
          </Text>
          <Ionicons
            name="calendar"
            size={18}
            color="#FFFFFF"
            style={{ marginLeft: 6 }}
          />
        </TouchableOpacity>
      </View>

      {/* Student Profile Input Modal before Booking */}
      <Modal
        visible={formModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setFormModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconBadge}>
                <Ionicons name="person" size={20} color={theme.colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Thông Tin Người Đặt Phòng</Text>
                <Text style={styles.modalSubtitle}>
                  Nhập thông tin sinh viên để tạo thẻ ra vào và mã QR
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setFormModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={22} color={theme.colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Room & Time summary banner */}
            <View style={styles.summaryBanner}>
              <View style={styles.summaryRow}>
                <Ionicons name="business" size={14} color={theme.colors.primary} />
                <Text style={styles.summaryText}>
                  {room.name} ({room.code}) - {room.building}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Ionicons name="time" size={14} color={theme.colors.primary} />
                <Text style={styles.summaryText}>
                  {formatDisplayDate(selectedDate)} • Khung giờ: {selectedSlot}
                </Text>
              </View>
            </View>

            {formError ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={16} color={theme.colors.danger} />
                <Text style={styles.errorBannerText}>{formError}</Text>
              </View>
            ) : null}

            <ScrollView showsVerticalScrollIndicator={false} style={styles.formScroll}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  HỌ VÀ TÊN SINH VIÊN <Text style={{ color: theme.colors.danger }}>*</Text>
                </Text>
                <TextInput
                  value={studentName}
                  onChangeText={(val) => {
                    setStudentName(val);
                    if (formError) setFormError('');
                  }}
                  placeholder="Ví dụ: Nguyễn Văn An"
                  placeholderTextColor={theme.colors.textMuted}
                  style={styles.textInput}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  MÃ SỐ SINH VIÊN (MSSV) <Text style={{ color: theme.colors.danger }}>*</Text>
                </Text>
                <TextInput
                  value={studentId}
                  onChangeText={(val) => {
                    setStudentId(val);
                    if (formError) setFormError('');
                  }}
                  placeholder="Ví dụ: 22127001"
                  placeholderTextColor={theme.colors.textMuted}
                  style={styles.textInput}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>KHOA / LỚP HỌC</Text>
                <TextInput
                  value={faculty}
                  onChangeText={setFaculty}
                  placeholder="Ví dụ: Khoa Công nghệ Thông tin"
                  placeholderTextColor={theme.colors.textMuted}
                  style={styles.textInput}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>EMAIL SINH VIÊN</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Ví dụ: student@campus.edu.vn"
                  placeholderTextColor={theme.colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.textInput}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelModalBtn}
                onPress={() => setFormModalVisible(false)}
              >
                <Text style={styles.cancelModalBtnText}>Hủy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.confirmModalBtn,
                  isSubmitting && styles.bookButtonDisabled,
                ]}
                onPress={handleConfirmBooking}
                disabled={isSubmitting}
              >
                <Text style={styles.confirmModalBtnText}>
                  {isSubmitting ? 'Đang tạo vé...' : 'Xác Nhận & Lấy Mã QR'}
                </Text>
                <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Dynamic Booking Pass Modal with SVG QR Code */}
      <BookingQRModal
        visible={modalVisible}
        reservation={confirmedReservation}
        onClose={() => setModalVisible(false)}
        onNavigateToBookings={() => {
          navigation.navigate('MainTabs');
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  navBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  navPlaceholder: {
    width: 36,
  },
  scrollContent: {
    paddingBottom: 110,
  },
  heroContainer: {
    width: '100%',
    height: 220,
    position: 'relative',
    backgroundColor: '#E2E8F0',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  statusPill: {
    position: 'absolute',
    top: 14,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
    gap: 6,
  },
  statusPillAvail: {
    backgroundColor: 'rgba(16, 185, 129, 0.95)',
  },
  statusPillOccupied: {
    backgroundColor: 'rgba(239, 68, 68, 0.95)',
  },
  statusPillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  statusPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  roomCodePill: {
    position: 'absolute',
    bottom: 14,
    right: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.md,
  },
  roomCodeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  infoCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginHorizontal: theme.spacing.lg,
    marginTop: -20,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.medium,
  },
  infoCategoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryBadge: {
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.sm,
  },
  categoryText: {
    color: theme.colors.primaryDark,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingValue: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  ratingSub: {
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  roomName: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
    paddingBottom: 14,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.textMuted,
    letterSpacing: 0.8,
    marginTop: 10,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  equipmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  equipmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.md,
    gap: 6,
  },
  equipmentLabel: {
    fontSize: 12,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  rulesList: {
    gap: 6,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  ruleText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    flex: 1,
    lineHeight: 17,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.card,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 28 : theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...theme.shadows.medium,
  },
  bottomSummary: {
    flex: 1,
    marginRight: 12,
  },
  bottomLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.textMuted,
    letterSpacing: 0.5,
  },
  bottomDate: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  bottomSlot: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '600',
    marginTop: 1,
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.soft,
  },
  bookButtonDisabled: {
    backgroundColor: theme.colors.disabled,
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginTop: 12,
    marginBottom: 16,
  },
  backBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.md,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.xl,
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    padding: theme.spacing.xl,
    ...theme.shadows.medium,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  modalIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  modalSubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  summaryBanner: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 14,
    gap: 6,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryText: {
    fontSize: 12,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.dangerLight,
    borderRadius: theme.borderRadius.sm,
    padding: 10,
    gap: 8,
    marginBottom: 12,
  },
  errorBannerText: {
    fontSize: 12,
    color: theme.colors.danger,
    fontWeight: '600',
  },
  formScroll: {
    maxHeight: 280,
    marginBottom: 14,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
  },
  cancelModalBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cancelModalBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  confirmModalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: theme.borderRadius.md,
    gap: 8,
  },
  confirmModalBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
