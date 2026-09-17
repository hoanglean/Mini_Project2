import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  StatusBar,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Reservation } from '../types/booking';
import { useBookingStore } from '../store/useBookingStore';
import { BookingQRModal } from '../components/BookingQRModal';
import { formatDisplayDate } from '../utils/dateHelper';
import { theme } from '../utils/theme';

export const MyBookingsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const activeReservations = useBookingStore(
    (state) => state.activeReservations
  );
  const cancelBooking = useBookingStore((state) => state.cancelBooking);

  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [selectedPass, setSelectedPass] = useState<Reservation | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // In-app Cancellation Confirmation Modal State (100% reliable across Web & Mobile)
  const [resToCancel, setResToCancel] = useState<Reservation | null>(null);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const activeList = activeReservations.filter(
    (r) => r.status === 'confirmed' || r.status === 'checked-in'
  );
  const historyList = activeReservations.filter((r) => r.status === 'cancelled');

  const displayedList = activeTab === 'active' ? activeList : historyList;

  const handleOpenPass = (res: Reservation) => {
    setSelectedPass(res);
    setModalVisible(true);
  };

  const handleCancelPress = (res: Reservation) => {
    setResToCancel(res);
    setCancelModalVisible(true);
  };

  const handleConfirmCancel = async () => {
    if (!resToCancel) return;
    setIsCancelling(true);
    try {
      await cancelBooking(resToCancel.id);
      setCancelModalVisible(false);
      setResToCancel(null);
    } catch (err) {
      console.warn('Cancel error:', err);
    } finally {
      setIsCancelling(false);
    }
  };

  const renderReservationCard = ({ item }: { item: Reservation }) => {
    const isCancelled = item.status === 'cancelled';
    const isCheckedIn = item.status === 'checked-in';

    return (
      <View style={[styles.card, isCancelled && styles.cardCancelled]}>
        {/* Top bar: Reference ID & Status Badge */}
        <View style={styles.cardHeader}>
          <View style={styles.refContainer}>
            <Ionicons
              name="ticket-outline"
              size={14}
              color={theme.colors.primary}
            />
            <Text style={styles.refText}>{item.id}</Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              isCheckedIn
                ? styles.badgeCheckedIn
                : isCancelled
                ? styles.badgeCancelled
                : styles.badgeConfirmed,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                isCheckedIn
                  ? styles.textCheckedIn
                  : isCancelled
                  ? styles.textCancelled
                  : styles.textConfirmed,
              ]}
            >
              {isCheckedIn
                ? 'CHECKED IN'
                : isCancelled
                ? 'CANCELLED'
                : 'CONFIRMED'}
            </Text>
          </View>
        </View>

        {/* Room Info */}
        <View style={styles.cardBody}>
          <Text style={styles.roomName}>{item.roomName}</Text>
          <Text style={styles.roomLocation}>
            {item.building} • Floor {item.floor} (Room {item.roomCode})
          </Text>

          {/* Schedule Info */}
          <View style={styles.scheduleRow}>
            <View style={styles.scheduleItem}>
              <Ionicons
                name="calendar-outline"
                size={14}
                color={theme.colors.primary}
              />
              <Text style={styles.scheduleText}>
                {formatDisplayDate(item.date)}
              </Text>
            </View>

            <View style={styles.scheduleItem}>
              <Ionicons
                name="time-outline"
                size={14}
                color={theme.colors.primary}
              />
              <Text style={[styles.scheduleText, { fontWeight: '700' }]}>
                {item.timeSlot}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons Footer */}
        {!isCancelled && (
          <View style={styles.cardFooter}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => handleCancelPress(item)}
              activeOpacity={0.7}
            >
              <Ionicons
                name="close-circle-outline"
                size={15}
                color={theme.colors.danger}
              />
              <Text style={styles.cancelBtnText}>Release Slot</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.qrPassBtn}
              onPress={() => handleOpenPass(item)}
              activeOpacity={0.8}
            >
              <Ionicons name="qr-code" size={15} color="#FFFFFF" />
              <Text style={styles.qrPassBtnText}>View QR Pass</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerSubtitle}>STUDENT RESERVATIONS</Text>
        <Text style={styles.headerTitle}>My Campus Bookings</Text>

        {/* Segmented Tabs */}
        <View style={styles.segmentContainer}>
          <TouchableOpacity
            style={[
              styles.segmentBtn,
              activeTab === 'active' && styles.segmentBtnActive,
            ]}
            onPress={() => setActiveTab('active')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.segmentText,
                activeTab === 'active' && styles.segmentTextActive,
              ]}
            >
              Active & Upcoming ({activeList.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentBtn,
              activeTab === 'history' && styles.segmentBtnActive,
            ]}
            onPress={() => setActiveTab('history')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.segmentText,
                activeTab === 'history' && styles.segmentTextActive,
              ]}
            >
              Cancelled ({historyList.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bookings List */}
      <FlatList
        data={displayedList}
        renderItem={renderReservationCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons
              name={activeTab === 'active' ? 'calendar-outline' : 'archive-outline'}
              size={56}
              color={theme.colors.textMuted}
            />
            <Text style={styles.emptyTitle}>
              {activeTab === 'active'
                ? 'No active reservations'
                : 'No cancelled bookings'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'active'
                ? 'Ready to collaborate or need a quiet study pod? Explore campus rooms now.'
                : 'Any reservations you cancel will be recorded here.'}
            </Text>

            {activeTab === 'active' && (
              <TouchableOpacity
                style={styles.exploreBtn}
                onPress={() => navigation.navigate('HomeTab')}
                activeOpacity={0.8}
              >
                <Text style={styles.exploreBtnText}>Discover Rooms</Text>
                <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
        }
      />

      {/* Cancellation Confirmation Modal */}
      <Modal
        visible={cancelModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => !isCancelling && setCancelModalVisible(false)}
      >
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmCard}>
            <View style={styles.confirmIconCircle}>
              <Ionicons name="warning-outline" size={28} color={theme.colors.danger} />
            </View>

            <Text style={styles.confirmTitle}>Xác Nhận Hủy Đặt Phòng</Text>
            <Text style={styles.confirmSubtitle}>
              Bạn có chắc chắn muốn hủy đặt phòng này không? Khung giờ sẽ được giải phóng ngay lập tức cho các bạn sinh viên khác.
            </Text>

            {resToCancel && (
              <View style={styles.confirmInfoBox}>
                <Text style={styles.confirmRoomName}>{resToCancel.roomName}</Text>
                <Text style={styles.confirmMeta}>
                  {resToCancel.building} • Tầng {resToCancel.floor} (Phòng {resToCancel.roomCode})
                </Text>
                <View style={styles.confirmScheduleRow}>
                  <View style={styles.confirmBadge}>
                    <Ionicons name="calendar-outline" size={12} color={theme.colors.primary} />
                    <Text style={styles.confirmBadgeText}>
                      {formatDisplayDate(resToCancel.date)}
                    </Text>
                  </View>
                  <View style={styles.confirmBadge}>
                    <Ionicons name="time-outline" size={12} color={theme.colors.primary} />
                    <Text style={styles.confirmBadgeText}>{resToCancel.timeSlot}</Text>
                  </View>
                </View>
              </View>
            )}

            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={styles.keepBtn}
                onPress={() => setCancelModalVisible(false)}
                disabled={isCancelling}
                activeOpacity={0.8}
              >
                <Text style={styles.keepBtnText}>Giữ Lại Phòng</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmReleaseBtn, isCancelling && { opacity: 0.6 }]}
                onPress={handleConfirmCancel}
                disabled={isCancelling}
                activeOpacity={0.8}
              >
                {isCancelling ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="trash" size={15} color="#FFFFFF" />
                    <Text style={styles.confirmReleaseText}>Xác Nhận Hủy</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Dynamic Booking Pass Modal */}
      <BookingQRModal
        visible={modalVisible}
        reservation={selectedPass}
        onClose={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  header: {
    backgroundColor: theme.colors.card,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.primary,
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    marginBottom: 14,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.borderLight,
    borderRadius: theme.borderRadius.md,
    padding: 3,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: theme.borderRadius.sm,
  },
  segmentBtnActive: {
    backgroundColor: theme.colors.card,
    ...theme.shadows.soft,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  segmentTextActive: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  listContent: {
    padding: theme.spacing.lg,
    paddingBottom: 40,
    gap: 14,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    ...theme.shadows.soft,
  },
  cardCancelled: {
    opacity: 0.65,
    backgroundColor: '#F8FAFC',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
    paddingBottom: 10,
    marginBottom: 10,
  },
  refContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  refText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primary,
    letterSpacing: 0.5,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },
  badgeConfirmed: {
    backgroundColor: theme.colors.primaryLight,
  },
  badgeCheckedIn: {
    backgroundColor: theme.colors.accentLight,
  },
  badgeCancelled: {
    backgroundColor: theme.colors.dangerLight,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  textConfirmed: {
    color: theme.colors.primaryDark,
  },
  textCheckedIn: {
    color: theme.colors.accentDark,
  },
  textCancelled: {
    color: theme.colors.danger,
  },
  cardBody: {
    marginBottom: 14,
  },
  roomName: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  roomLocation: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 2,
    marginBottom: 10,
  },
  scheduleRow: {
    flexDirection: 'row',
    gap: 16,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scheduleText: {
    fontSize: 12,
    color: theme.colors.textPrimary,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
    paddingTop: 12,
    gap: 10,
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.dangerLight,
    gap: 4,
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.danger,
  },
  qrPassBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary,
    gap: 6,
    ...theme.shadows.soft,
  },
  qrPassBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginTop: 14,
  },
  emptySubtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  exploreBtn: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.md,
    gap: 8,
  },
  exploreBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  confirmCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.xl,
    width: '100%',
    maxWidth: 440,
    padding: theme.spacing.xl,
    alignItems: 'center',
    ...theme.shadows.medium,
  },
  confirmIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.dangerLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
  },
  confirmSubtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  confirmInfoBox: {
    width: '100%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 18,
    alignItems: 'center',
  },
  confirmRoomName: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  confirmMeta: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
    marginBottom: 8,
  },
  confirmScheduleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  confirmBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
    gap: 4,
  },
  confirmBadgeText: {
    fontSize: 11,
    color: theme.colors.primaryDark,
    fontWeight: '600',
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  keepBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keepBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  confirmReleaseBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.danger,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.md,
    gap: 6,
    ...theme.shadows.soft,
  },
  confirmReleaseText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
