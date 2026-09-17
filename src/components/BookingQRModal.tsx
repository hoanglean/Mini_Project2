import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Share,
  Platform,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';
import { Reservation } from '../types/booking';
import { theme } from '../utils/theme';
import { formatDisplayDate } from '../utils/dateHelper';
import { useBookingStore } from '../store/useBookingStore';

interface BookingQRModalProps {
  visible: boolean;
  reservation: Reservation | null;
  onClose: () => void;
  onNavigateToBookings?: () => void;
}

export const BookingQRModal: React.FC<BookingQRModalProps> = ({
  visible,
  reservation,
  onClose,
  onNavigateToBookings,
}) => {
  const checkInBooking = useBookingStore((state) => state.checkInBooking);

  if (!reservation) return null;

  const isCheckedIn = reservation.status === 'checked-in';

  const handleSharePass = async () => {
    try {
      await Share.share({
        title: `Campus Pass: ${reservation.roomName}`,
        message: `Campus Booking Pass\nRoom: ${reservation.roomName} (${reservation.roomCode})\nBuilding: ${reservation.building}, Floor ${reservation.floor}\nDate: ${reservation.date}\nTime: ${reservation.timeSlot}\nBooking ID: ${reservation.id}\nStudent: ${reservation.studentName} (${reservation.studentId})`,
      });
    } catch (err) {
      console.warn('Share error:', err);
    }
  };

  const handleCheckIn = () => {
    checkInBooking(reservation.id);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* Top Grab Handle */}
          <View style={styles.handleBar} />

          {/* Close button */}
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name="close"
              size={22}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Header / Title */}
            <View style={styles.header}>
              <View style={styles.passTypeTag}>
                <Ionicons
                  name="shield-checkmark"
                  size={14}
                  color={theme.colors.accentDark}
                />
                <Text style={styles.passTypeTagText}>
                  VERIFIED CAMPUS ACCESS PASS
                </Text>
              </View>
              <Text style={styles.passTitle}>Official Check-in Pass</Text>
              <Text style={styles.passSubtitle}>
                Scan at turnstile or door scanner upon arrival
              </Text>
            </View>

            {/* Ticket Card */}
            <View style={styles.ticketCard}>
              {/* Ticket Upper Section: QR Code */}
              <View style={styles.qrSection}>
                <View style={styles.qrWrapper}>
                  <QRCode
                    value={reservation.qrPayload || reservation.id}
                    size={180}
                    color="#0F172A"
                    backgroundColor="#FFFFFF"
                  />
                </View>

                {/* Unique Booking ID Badge */}
                <View style={styles.bookingIdContainer}>
                  <Text style={styles.bookingIdLabel}>BOOKING REFERENCE ID</Text>
                  <Text style={styles.bookingIdValue}>{reservation.id}</Text>
                </View>
              </View>

              {/* Perforated ticket dividing line */}
              <View style={styles.perforatedLineContainer}>
                <View style={styles.cutoutLeft} />
                <View style={styles.dashedLine} />
                <View style={styles.cutoutRight} />
              </View>

              {/* Ticket Lower Section: Details */}
              <View style={styles.detailsSection}>
                {/* Room row */}
                <View style={styles.infoRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.infoLabel}>LOCATION / VENUE</Text>
                    <Text style={styles.roomNameText}>
                      {reservation.roomName}
                    </Text>
                    <Text style={styles.roomSubtext}>
                      {reservation.building} • Floor {reservation.floor} (Room{' '}
                      {reservation.roomCode})
                    </Text>
                  </View>
                </View>

                {/* Date & Time Grid */}
                <View style={styles.metaGrid}>
                  <View style={styles.metaCol}>
                    <Text style={styles.infoLabel}>RESERVATION DATE</Text>
                    <Text style={styles.infoValue}>
                      {formatDisplayDate(reservation.date)}
                    </Text>
                  </View>
                  <View style={styles.metaCol}>
                    <Text style={styles.infoLabel}>TIME WINDOW</Text>
                    <Text style={[styles.infoValue, { color: theme.colors.primary }]}>
                      {reservation.timeSlot}
                    </Text>
                  </View>
                </View>

                {/* Student Holder Grid */}
                <View style={styles.metaGrid}>
                  <View style={styles.metaCol}>
                    <Text style={styles.infoLabel}>STUDENT HOLDER</Text>
                    <Text style={styles.infoValue}>{reservation.studentName}</Text>
                  </View>
                  <View style={styles.metaCol}>
                    <Text style={styles.infoLabel}>STUDENT ID</Text>
                    <Text style={styles.infoValue}>{reservation.studentId}</Text>
                  </View>
                </View>

                {/* Status Indicator */}
                <View
                  style={[
                    styles.statusBanner,
                    isCheckedIn ? styles.statusCheckedIn : styles.statusConfirmed,
                  ]}
                >
                  <Ionicons
                    name={isCheckedIn ? 'checkmark-circle' : 'time'}
                    size={16}
                    color={
                      isCheckedIn
                        ? theme.colors.accentDark
                        : theme.colors.primaryDark
                    }
                  />
                  <Text
                    style={[
                      styles.statusBannerText,
                      isCheckedIn
                        ? styles.statusCheckedInText
                        : styles.statusConfirmedText,
                    ]}
                  >
                    {isCheckedIn
                      ? 'Checked In Successfully'
                      : 'Active Reservation • Ready for Check-in'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Instruction Tip */}
            <View style={styles.instructionBox}>
              <Ionicons
                name="information-circle-outline"
                size={18}
                color={theme.colors.primary}
              />
              <Text style={styles.instructionText}>
                Please arrive within 15 minutes of your slot start. Unclaimed
                reservations are released to standby students automatically.
              </Text>
            </View>

            {/* Actions */}
            <View style={styles.actionButtons}>
              {!isCheckedIn ? (
                <TouchableOpacity
                  style={styles.checkInBtn}
                  onPress={handleCheckIn}
                  activeOpacity={0.85}
                >
                  <Ionicons name="scan" size={18} color="#FFFFFF" />
                  <Text style={styles.checkInBtnText}>Simulate Check-in</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.completedBtn}>
                  <Ionicons name="checkmark-done" size={18} color={theme.colors.accentDark} />
                  <Text style={styles.completedBtnText}>Check-in Verified</Text>
                </View>
              )}

              <View style={styles.secondaryActions}>
                <TouchableOpacity
                  style={styles.shareBtn}
                  onPress={handleSharePass}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="share-outline"
                    size={18}
                    color={theme.colors.textPrimary}
                  />
                  <Text style={styles.shareBtnText}>Share Pass</Text>
                </TouchableOpacity>

                {onNavigateToBookings && (
                  <TouchableOpacity
                    style={styles.manageBtn}
                    onPress={() => {
                      onClose();
                      onNavigateToBookings();
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="bookmarks-outline"
                      size={18}
                      color={theme.colors.primary}
                    />
                    <Text style={styles.manageBtnText}>My Bookings</Text>
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                style={styles.doneBtn}
                onPress={onClose}
                activeOpacity={0.8}
              >
                <Text style={styles.doneBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    maxHeight: '92%',
    paddingTop: 12,
    position: 'relative',
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: theme.colors.disabled,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 8,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 18,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  header: {
    alignItems: 'center',
    marginVertical: 12,
  },
  passTypeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.accentLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
    gap: 4,
    marginBottom: 6,
  },
  passTypeTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.accentDark,
    letterSpacing: 0.5,
  },
  passTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  passSubtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  ticketCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.medium,
    marginTop: 10,
    overflow: 'hidden',
  },
  qrSection: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  qrWrapper: {
    padding: 12,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    backgroundColor: '#FFFFFF',
    ...theme.shadows.soft,
  },
  bookingIdContainer: {
    alignItems: 'center',
    marginTop: 14,
  },
  bookingIdLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.textMuted,
    letterSpacing: 0.8,
  },
  bookingIdValue: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.primary,
    letterSpacing: 1.5,
    marginTop: 2,
  },
  perforatedLineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    height: 24,
    backgroundColor: theme.colors.card,
  },
  cutoutLeft: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.surface,
    position: 'absolute',
    left: -10,
  },
  cutoutRight: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.surface,
    position: 'absolute',
    right: -10,
  },
  dashedLine: {
    flex: 1,
    marginHorizontal: 16,
    borderBottomWidth: 1.5,
    borderBottomColor: theme.colors.border,
    borderStyle: 'dashed',
  },
  detailsSection: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.card,
  },
  infoRow: {
    marginBottom: 14,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  roomNameText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  roomSubtext: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  metaGrid: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  metaCol: {
    flex: 1,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.md,
    gap: 8,
    marginTop: 4,
  },
  statusConfirmed: {
    backgroundColor: theme.colors.primaryLight,
  },
  statusCheckedIn: {
    backgroundColor: theme.colors.accentLight,
  },
  statusBannerText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusConfirmedText: {
    color: theme.colors.primaryDark,
  },
  statusCheckedInText: {
    color: theme.colors.accentDark,
  },
  instructionBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.borderRadius.md,
    padding: 12,
    marginTop: 14,
    gap: 8,
  },
  instructionText: {
    flex: 1,
    fontSize: 12,
    color: theme.colors.primaryDark,
    lineHeight: 17,
  },
  actionButtons: {
    marginTop: 16,
    gap: 10,
  },
  checkInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.accent,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.md,
    gap: 8,
    ...theme.shadows.soft,
  },
  checkInBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  completedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.accentLight,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.md,
    gap: 8,
  },
  completedBtnText: {
    color: theme.colors.accentDark,
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: 10,
  },
  shareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.md,
    gap: 6,
  },
  shareBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  manageBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primaryLight,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.md,
    gap: 6,
  },
  manageBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  doneBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  doneBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
});
