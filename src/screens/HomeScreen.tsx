import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Room } from '../types/booking';
import { RootStackParamList } from '../navigation/types';
import { useBookingStore } from '../store/useBookingStore';
import { RoomCard } from '../components/RoomCard';
import { SearchBar } from '../components/SearchBar';
import { FilterChips } from '../components/FilterChips';
import { theme } from '../utils/theme';

type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'MainTabs'
>;

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const getFilteredRooms = useBookingStore((state) => state.getFilteredRooms);
  const rooms = useBookingStore((state) => state.rooms);
  const activeReservations = useBookingStore((state) => state.activeReservations);
  const isRoomAvailableNow = useBookingStore((state) => state.isRoomAvailableNow);
  const resetFilters = useBookingStore((state) => state.resetFilters);
  const userSession = useBookingStore((state) => state.userSession);

  // Compute filtered list
  const filteredRooms = getFilteredRooms();

  // Summary counts
  const availableNowCount = useMemo(() => {
    return rooms.filter((r) => isRoomAvailableNow(r.id)).length;
  }, [rooms, isRoomAvailableNow]);

  const activeBookingCount = useMemo(() => {
    return activeReservations.filter((r) => r.status === 'confirmed').length;
  }, [activeReservations]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 600);
  }, []);

  const handleRoomPress = useCallback(
    (room: Room) => {
      navigation.navigate('RoomDetail', { roomId: room.id });
    },
    [navigation]
  );

  const renderItem = useCallback(
    ({ item }: { item: Room }) => (
      <RoomCard room={item} onPress={handleRoomPress} />
    ),
    [handleRoomPress]
  );

  const keyExtractor = useCallback((item: Room) => item.id, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Campus Header */}
      <View style={styles.topHeader}>
        <View>
          <Text style={styles.campusSubtitle}>CAMPUS STUDY & LAB BOOKING</Text>
          <Text style={styles.campusTitle}>Find a Study Space</Text>
        </View>

        <TouchableOpacity
          style={styles.profileBadge}
          onPress={() => (navigation as any).navigate('MainTabs', { screen: 'ProfileTab' })}
          activeOpacity={0.8}
        >

          <View style={styles.avatarCircle}>
            {userSession.avatarUrl ? (
              <Image
                source={{ uri: userSession.avatarUrl }}
                style={{ width: '100%', height: '100%', borderRadius: 18 }}
              />
            ) : userSession.name ? (
              <Text style={styles.avatarInitial}>
                {userSession.name.charAt(0).toUpperCase()}
              </Text>
            ) : (
              <Ionicons name="person" size={16} color="#FFFFFF" />
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* Instant Search Bar */}
      <SearchBar
        showFilterToggle={true}
        filtersOpen={filtersOpen}
        onToggleFilters={() => setFiltersOpen(!filtersOpen)}
      />

      {/* Collapsible Multi-parameter Filter Chips */}
      {filtersOpen && (
        <FilterChips onCloseFilters={() => setFiltersOpen(false)} />
      )}

      {/* Main High-Performance Feed */}
      <FlatList
        data={filteredRooms}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        ListHeaderComponent={
          <View style={styles.statsBanner}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{rooms.length}</Text>
              <Text style={styles.statLabel}>Total Rooms</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <View style={styles.statRow}>
                <View style={styles.onlineDot} />
                <Text style={[styles.statValue, { color: theme.colors.accentDark }]}>
                  {availableNowCount}
                </Text>
              </View>
              <Text style={styles.statLabel}>Available Now</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                {activeBookingCount}
              </Text>
              <Text style={styles.statLabel}>Active Passes</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons
              name="search-outline"
              size={48}
              color={theme.colors.textMuted}
            />
            <Text style={styles.emptyTitle}>No matching rooms found</Text>
            <Text style={styles.emptySubtitle}>
              Try broadening your filters or clearing your keyword search.
            </Text>
            <TouchableOpacity
              style={styles.clearFiltersBtn}
              onPress={resetFilters}
              activeOpacity={0.8}
            >
              <Text style={styles.clearFiltersText}>Reset All Filters</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xs,
    backgroundColor: theme.colors.card,
  },
  campusSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.primary,
    letterSpacing: 1,
  },
  campusTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  profileBadge: {
    padding: 2,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  listContent: {
    paddingTop: theme.spacing.md,
    paddingBottom: 40,
  },
  statsBanner: {
    flexDirection: 'row',
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'space-around',
    ...theme.shadows.soft,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.accent,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  statLabel: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontWeight: '500',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: theme.colors.borderLight,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
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
  clearFiltersBtn: {
    marginTop: 18,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.md,
  },
  clearFiltersText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
