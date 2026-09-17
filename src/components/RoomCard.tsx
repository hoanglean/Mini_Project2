import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Room } from '../types/booking';
import { theme } from '../utils/theme';
import { useBookingStore } from '../store/useBookingStore';

interface RoomCardProps {
  room: Room;
  onPress: (room: Room) => void;
}

export const RoomCard: React.FC<RoomCardProps> = React.memo(({ room, onPress }) => {
  const isAvailableNow = useBookingStore((state) => state.isRoomAvailableNow(room.id));

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

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={() => onPress(room)}
      style={styles.card}
      accessibilityRole="button"
      accessibilityLabel={`Room ${room.name} in ${room.building}`}
    >
      {/* Thumbnail with overlay badges */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: room.imageUrl }}
          style={styles.image}
          resizeMode="cover"
        />

        {/* Real-time availability indicator badge */}
        <View
          style={[
            styles.availabilityBadge,
            isAvailableNow ? styles.availableBg : styles.occupiedBg,
          ]}
        >
          <View
            style={[
              styles.statusDot,
              isAvailableNow ? styles.availableDot : styles.occupiedDot,
            ]}
          />
          <Text
            style={[
              styles.availabilityText,
              isAvailableNow ? styles.availableText : styles.occupiedText,
            ]}
          >
            {isAvailableNow ? 'Available Now' : 'Occupied'}
          </Text>
        </View>

        {/* Capacity badge */}
        <View style={styles.capacityBadge}>
          <Ionicons name="people" size={13} color="#FFFFFF" />
          <Text style={styles.capacityText}>{room.capacity} students</Text>
        </View>

        {/* Room Code Badge */}
        <View style={styles.codeBadge}>
          <Text style={styles.codeText}>{room.code}</Text>
        </View>
      </View>

      {/* Card Body */}
      <View style={styles.content}>
        {/* Location & Rating Header */}
        <View style={styles.headerRow}>
          <View style={styles.locationContainer}>
            <Ionicons
              name="location-sharp"
              size={14}
              color={theme.colors.primary}
            />
            <Text style={styles.locationText}>
              {room.building} • Floor {room.floor}
            </Text>
          </View>

          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={13} color="#F59E0B" />
            <Text style={styles.ratingText}>{room.rating.toFixed(1)}</Text>
            <Text style={styles.reviewCountText}>({room.reviewCount})</Text>
          </View>
        </View>

        {/* Room Name */}
        <Text style={styles.title} numberOfLines={1}>
          {room.name}
        </Text>

        {/* Description snippet */}
        <Text style={styles.description} numberOfLines={2}>
          {room.description}
        </Text>

        {/* Equipment Badges Row */}
        <View style={styles.equipmentRow}>
          {room.equipment.slice(0, 4).map((item) => (
            <View key={item} style={styles.equipmentBadge}>
              <MaterialCommunityIcons
                name={getEquipmentIcon(item)}
                size={13}
                color={theme.colors.primaryDark}
              />
              <Text style={styles.equipmentText}>{item}</Text>
            </View>
          ))}
          {room.equipment.length > 4 && (
            <View style={styles.moreEquipmentBadge}>
              <Text style={styles.moreEquipmentText}>
                +{room.equipment.length - 4}
              </Text>
            </View>
          )}
        </View>

        {/* Footer with action CTA */}
        <View style={styles.footerRow}>
          <View style={styles.typeTag}>
            <Text style={styles.typeText}>
              {room.type === 'computer_lab' ? 'Computer Lab' : 'Study Room'}
            </Text>
          </View>

          <View style={styles.ctaButton}>
            <Text style={styles.ctaText}>Select Slot</Text>
            <Ionicons
              name="arrow-forward"
              size={13}
              color={theme.colors.textInverse}
            />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
});

RoomCard.displayName = 'RoomCard';

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.medium,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    height: 160,
    position: 'relative',
    backgroundColor: '#E2E8F0',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  availabilityBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.borderRadius.full,
  },
  availableBg: {
    backgroundColor: 'rgba(16, 185, 129, 0.92)',
  },
  occupiedBg: {
    backgroundColor: 'rgba(239, 68, 68, 0.92)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  availableDot: {
    backgroundColor: '#FFFFFF',
  },
  occupiedDot: {
    backgroundColor: '#FFFFFF',
  },
  availabilityText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  availableText: {
    color: '#FFFFFF',
  },
  occupiedText: {
    color: '#FFFFFF',
  },
  capacityBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
    gap: 4,
  },
  capacityText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  codeBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },
  codeText: {
    color: theme.colors.textPrimary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  content: {
    padding: theme.spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primaryDark,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  reviewCountText: {
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  equipmentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  equipmentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
    gap: 4,
  },
  equipmentText: {
    fontSize: 11,
    color: theme.colors.primaryDark,
    fontWeight: '600',
  },
  moreEquipmentBadge: {
    backgroundColor: theme.colors.borderLight,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreEquipmentText: {
    fontSize: 11,
    color: theme.colors.textMuted,
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
    paddingTop: 12,
  },
  typeTag: {
    backgroundColor: theme.colors.borderLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.sm,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.md,
    gap: 4,
  },
  ctaText: {
    color: theme.colors.textInverse,
    fontSize: 12,
    fontWeight: '700',
  },
});
