import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Building, EquipmentTag, RoomType } from '../types/booking';
import { theme } from '../utils/theme';
import { useBookingStore } from '../store/useBookingStore';

const BUILDINGS: (Building | 'ALL')[] = [
  'ALL',
  'Building A',
  'Building B',
  'Building C',
  'Building V',
];

const CAPACITIES = [
  { label: 'Any size', value: 0 },
  { label: '4+ seats', value: 4 },
  { label: '8+ seats', value: 8 },
  { label: '12+ seats', value: 12 },
  { label: '16+ seats', value: 16 },
];

const EQUIPMENT_OPTIONS: EquipmentTag[] = [
  'High-spec PC',
  'Projector',
  'Whiteboard',
  'AC',
  'Dual Monitors',
  'Soundproofing',
];

export interface FilterChipsProps {
  onCloseFilters?: () => void;
}

export const FilterChips: React.FC<FilterChipsProps> = ({ onCloseFilters }) => {
  const filters = useBookingStore((state) => state.filters);
  const setFilters = useBookingStore((state) => state.setFilters);
  const resetFilters = useBookingStore((state) => state.resetFilters);
  const getFilteredRooms = useBookingStore((state) => state.getFilteredRooms);

  const filteredCount = getFilteredRooms().length;

  const handleBuildingSelect = (b: Building | 'ALL') => {
    setFilters({ building: b });
  };

  const handleCapacitySelect = (val: number) => {
    setFilters({ minCapacity: val });
  };

  const handleEquipmentToggle = (eq: EquipmentTag) => {
    const exists = filters.equipment.includes(eq);
    const updated = exists
      ? filters.equipment.filter((item) => item !== eq)
      : [...filters.equipment, eq];
    setFilters({ equipment: updated });
  };

  const handleTypeSelect = (type: RoomType | 'ALL') => {
    setFilters({ type });
  };

  const hasActiveFilters =
    filters.building !== 'ALL' ||
    filters.minCapacity > 0 ||
    filters.equipment.length > 0 ||
    filters.type !== 'ALL' ||
    filters.searchQuery.length > 0;


  return (
    <View style={styles.container}>
      {/* Type & Reset header */}
      <View style={styles.topControlRow}>
        <View style={styles.typeSegment}>
          {(['ALL', 'computer_lab', 'study_room'] as (RoomType | 'ALL')[]).map(
            (type) => {
              const isSelected = filters.type === type;
              const label =
                type === 'ALL'
                  ? 'All Rooms'
                  : type === 'computer_lab'
                  ? 'Computer Labs'
                  : 'Study Rooms';
              return (
                <TouchableOpacity
                  key={type}
                  onPress={() => handleTypeSelect(type)}
                  style={[
                    styles.typeBtn,
                    isSelected && styles.typeBtnActive,
                  ]}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.typeBtnText,
                      isSelected && styles.typeBtnTextActive,
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            }
          )}
        </View>

        {hasActiveFilters && (
          <TouchableOpacity
            onPress={resetFilters}
            style={styles.resetBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh" size={13} color={theme.colors.danger} />
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Buildings row */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>BUILDING</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollList}
        >
          {BUILDINGS.map((b) => {
            const isSelected = filters.building === b;
            const displayLabel = b === 'ALL' ? 'All Buildings' : b;
            return (
              <TouchableOpacity
                key={b}
                onPress={() => handleBuildingSelect(b)}
                style={[
                  styles.chip,
                  isSelected ? styles.chipSelected : styles.chipUnselected,
                ]}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.chipText,
                    isSelected ? styles.chipTextSelected : styles.chipTextUnselected,
                  ]}
                >
                  {displayLabel}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Capacity row */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>CAPACITY</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollList}
        >
          {CAPACITIES.map((cap) => {
            const isSelected = filters.minCapacity === cap.value;
            return (
              <TouchableOpacity
                key={cap.value}
                onPress={() => handleCapacitySelect(cap.value)}
                style={[
                  styles.chip,
                  isSelected ? styles.chipSelected : styles.chipUnselected,
                ]}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.chipText,
                    isSelected ? styles.chipTextSelected : styles.chipTextUnselected,
                  ]}
                >
                  {cap.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Equipment tags row */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>EQUIPMENT</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollList}
        >
          {EQUIPMENT_OPTIONS.map((eq) => {
            const isSelected = filters.equipment.includes(eq);
            return (
              <TouchableOpacity
                key={eq}
                onPress={() => handleEquipmentToggle(eq)}
                style={[
                  styles.chip,
                  isSelected ? styles.chipTagSelected : styles.chipUnselected,
                ]}
                activeOpacity={0.75}
              >
                {isSelected && (
                  <Ionicons
                    name="checkmark"
                    size={13}
                    color="#FFFFFF"
                    style={{ marginRight: 4 }}
                  />
                )}
                <Text
                  style={[
                    styles.chipText,
                    isSelected
                      ? styles.chipTagTextSelected
                      : styles.chipTextUnselected,
                  ]}
                >
                  {eq}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Real-time Filter Result Feedback Bar */}
      <View style={styles.resultsBar}>
        <View style={styles.resultsInfo}>
          <Ionicons
            name={filteredCount > 0 ? 'checkmark-circle' : 'alert-circle'}
            size={16}
            color={filteredCount > 0 ? theme.colors.accentDark : theme.colors.danger}
          />
          <Text style={styles.resultsCountText}>
            {filteredCount > 0 ? (
              <>
                Đã lọc tự động: <Text style={styles.resultsCountBold}>{filteredCount} phòng</Text> phù hợp
              </>
            ) : (
              <Text style={{ color: theme.colors.danger, fontWeight: '600' }}>
                Không có phòng nào thỏa mãn tiêu chí
              </Text>
            )}
          </Text>
        </View>

        {onCloseFilters && (
          <TouchableOpacity
            style={styles.viewResultsBtn}
            onPress={onCloseFilters}
            activeOpacity={0.8}
          >
            <Text style={styles.viewResultsBtnText}>
              {filteredCount > 0 ? 'Xem kết quả' : 'Thu gọn'}
            </Text>
            <Ionicons name="chevron-down" size={14} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: theme.spacing.xs,
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  topControlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.xs,
  },
  typeSegment: {
    flexDirection: 'row',
    backgroundColor: theme.colors.borderLight,
    borderRadius: theme.borderRadius.md,
    padding: 3,
  },
  typeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.borderRadius.sm,
  },
  typeBtnActive: {
    backgroundColor: theme.colors.card,
    ...theme.shadows.soft,
  },
  typeBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  typeBtnTextActive: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.dangerLight,
    gap: 4,
  },
  resetText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.danger,
  },
  section: {
    marginTop: 6,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.textMuted,
    letterSpacing: 0.8,
    marginHorizontal: theme.spacing.lg,
    marginBottom: 4,
  },
  scrollList: {
    paddingHorizontal: theme.spacing.lg,
    gap: 8,
    paddingBottom: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
  },
  chipUnselected: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
  },
  chipSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  chipTagSelected: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextUnselected: {
    color: theme.colors.textSecondary,
  },
  chipTextSelected: {
    color: theme.colors.textInverse,
  },
  chipTagTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  resultsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    marginHorizontal: theme.spacing.lg,
    marginTop: 8,
    marginBottom: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  resultsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  resultsCountText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  resultsCountBold: {
    color: theme.colors.primary,
    fontWeight: '800',
  },
  viewResultsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.borderRadius.sm,
    gap: 4,
  },
  viewResultsBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

