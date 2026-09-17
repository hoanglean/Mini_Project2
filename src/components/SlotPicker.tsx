import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TimeSlot } from '../types/booking';
import { theme } from '../utils/theme';
import {
  TIME_SLOTS,
  getUpcomingDays,
  isSlotInPast,
} from '../utils/dateHelper';
import { useBookingStore } from '../store/useBookingStore';

interface SlotPickerProps {
  roomId: string;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  selectedSlot: TimeSlot | null;
  onSelectSlot: (slot: TimeSlot) => void;
}

export const SlotPicker: React.FC<SlotPickerProps> = ({
  roomId,
  selectedDate,
  onSelectDate,
  selectedSlot,
  onSelectSlot,
}) => {
  const isSlotBooked = useBookingStore((state) => state.isSlotBooked);
  const activeReservations = useBookingStore((state) => state.activeReservations);
  const days = getUpcomingDays(7);

  // Calculate availability stats for selected date
  const bookedCount = TIME_SLOTS.filter(
    (slot) => isSlotBooked(roomId, selectedDate, slot) || isSlotInPast(selectedDate, slot)
  ).length;
  const availableCount = TIME_SLOTS.length - bookedCount;

  return (
    <View style={styles.container}>
      {/* 1. 7-Day Horizontal Calendar Picker */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>SELECT RESERVATION DATE</Text>
        <Text style={styles.dateSubtext}>Next 7 campus days</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.daysScroll}
      >
        {days.map((day) => {
          const isSelected = selectedDate === day.dateString;
          return (
            <TouchableOpacity
              key={day.dateString}
              onPress={() => onSelectDate(day.dateString)}
              style={[
                styles.dayCard,
                isSelected ? styles.dayCardSelected : styles.dayCardUnselected,
              ]}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.dayName,
                  isSelected ? styles.dayNameSelected : styles.dayNameUnselected,
                ]}
              >
                {day.dayName}
              </Text>
              <Text
                style={[
                  styles.dayNumber,
                  isSelected ? styles.dayNumberSelected : styles.dayNumberUnselected,
                ]}
              >
                {day.dayNumber}
              </Text>
              <Text
                style={[
                  styles.monthName,
                  isSelected ? styles.monthNameSelected : styles.monthNameUnselected,
                ]}
              >
                {day.monthName}
              </Text>
              {day.isToday && (
                <View
                  style={[
                    styles.todayDot,
                    isSelected ? styles.todayDotSelected : styles.todayDotUnselected,
                  ]}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* 2. Slot Conflict Engine Summary */}
      <View style={styles.slotHeaderRow}>
        <View>
          <Text style={styles.sectionTitle}>AVAILABLE 2-HOUR TIME SLOTS</Text>
          <Text style={styles.conflictEngineStatus}>
            {availableCount > 0
              ? `⚡ Real-time conflict engine: ${availableCount} open slot${
                  availableCount > 1 ? 's' : ''
                }`
              : '⚠️ All slots fully reserved for this date'}
          </Text>
        </View>
      </View>

      {/* 3. Discrete Time Slot Buttons Grid */}
      <View style={styles.slotsGrid}>
        {TIME_SLOTS.map((slot) => {
          // Real-time conflict engine check
          const isBooked = isSlotBooked(roomId, selectedDate, slot);
          const isPast = isSlotInPast(selectedDate, slot);
          const isDisabled = isBooked || isPast;
          const isSelected = selectedSlot === slot;

          // Find who booked if booked (for realistic campus context)
          const bookedReservation = activeReservations.find(
            (r) =>
              r.roomId === roomId &&
              r.date === selectedDate &&
              r.timeSlot === slot &&
              r.status === 'confirmed'
          );

          return (
            <TouchableOpacity
              key={slot}
              onPress={() => !isDisabled && onSelectSlot(slot)}
              disabled={isDisabled}
              activeOpacity={0.8}
              style={[
                styles.slotCard,
                isSelected && styles.slotCardSelected,
                isDisabled && styles.slotCardDisabled,
              ]}
            >
              <View style={styles.slotLeft}>
                <Ionicons
                  name={
                    isDisabled
                      ? isPast
                        ? 'time-outline'
                        : 'lock-closed'
                      : isSelected
                      ? 'checkmark-circle'
                      : 'radio-button-off'
                  }
                  size={20}
                  color={
                    isDisabled
                      ? theme.colors.textMuted
                      : isSelected
                      ? '#FFFFFF'
                      : theme.colors.primary
                  }
                />
                <View>
                  <Text
                    style={[
                      styles.slotTimeText,
                      isSelected && styles.slotTimeTextSelected,
                      isDisabled && styles.slotTimeTextDisabled,
                    ]}
                  >
                    {slot}
                  </Text>
                  <Text
                    style={[
                      styles.slotDurationText,
                      isSelected && styles.slotDurationTextSelected,
                      isDisabled && styles.slotDurationTextDisabled,
                    ]}
                  >
                    2-Hour Session
                  </Text>
                </View>
              </View>

              {/* Status Badge */}
              <View
                style={[
                  styles.slotBadge,
                  isSelected && styles.slotBadgeSelected,
                  isBooked && styles.slotBadgeBooked,
                  isPast && styles.slotBadgePast,
                  !isDisabled && !isSelected && styles.slotBadgeAvailable,
                ]}
              >
                <Text
                  style={[
                    styles.slotBadgeText,
                    isSelected && styles.slotBadgeTextSelected,
                    isBooked && styles.slotBadgeTextBooked,
                    isPast && styles.slotBadgeTextPast,
                    !isDisabled && !isSelected && styles.slotBadgeTextAvailable,
                  ]}
                >
                  {isBooked
                    ? bookedReservation?.studentName
                      ? `Booked (${bookedReservation.studentName.split(' ')[0]})`
                      : 'Booked'
                    : isPast
                    ? 'Past Slot'
                    : isSelected
                    ? 'Selected'
                    : 'Available'}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.soft,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.textMuted,
    letterSpacing: 0.8,
  },
  dateSubtext: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  daysScroll: {
    gap: 10,
    paddingBottom: 14,
  },
  dayCard: {
    width: 64,
    height: 84,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    position: 'relative',
  },
  dayCardUnselected: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
  },
  dayCardSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
    ...theme.shadows.medium,
  },
  dayName: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  dayNameUnselected: {
    color: theme.colors.textSecondary,
  },
  dayNameSelected: {
    color: '#FFFFFF',
  },
  dayNumber: {
    fontSize: 20,
    fontWeight: '800',
  },
  dayNumberUnselected: {
    color: theme.colors.textPrimary,
  },
  dayNumberSelected: {
    color: '#FFFFFF',
  },
  monthName: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  monthNameUnselected: {
    color: theme.colors.textMuted,
  },
  monthNameSelected: {
    color: 'rgba(255, 255, 255, 0.85)',
  },
  todayDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    position: 'absolute',
    bottom: 6,
  },
  todayDotUnselected: {
    backgroundColor: theme.colors.primary,
  },
  todayDotSelected: {
    backgroundColor: theme.colors.accent,
  },
  slotHeaderRow: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
    paddingTop: 14,
    marginBottom: 10,
  },
  conflictEngineStatus: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  slotsGrid: {
    gap: 10,
  },
  slotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  slotCardSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
    ...theme.shadows.soft,
  },
  slotCardDisabled: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
    opacity: 0.7,
  },
  slotLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  slotTimeText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  slotTimeTextSelected: {
    color: '#FFFFFF',
  },
  slotTimeTextDisabled: {
    color: theme.colors.textMuted,
    textDecorationLine: 'line-through',
  },
  slotDurationText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  slotDurationTextSelected: {
    color: 'rgba(255, 255, 255, 0.85)',
  },
  slotDurationTextDisabled: {
    color: theme.colors.textMuted,
  },
  slotBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
  },
  slotBadgeAvailable: {
    backgroundColor: theme.colors.accentLight,
  },
  slotBadgeSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  slotBadgeBooked: {
    backgroundColor: theme.colors.dangerLight,
  },
  slotBadgePast: {
    backgroundColor: theme.colors.borderLight,
  },
  slotBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  slotBadgeTextAvailable: {
    color: theme.colors.accentDark,
  },
  slotBadgeTextSelected: {
    color: '#FFFFFF',
  },
  slotBadgeTextBooked: {
    color: theme.colors.danger,
  },
  slotBadgeTextPast: {
    color: theme.colors.textMuted,
  },
});
