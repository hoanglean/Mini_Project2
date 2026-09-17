import React from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../utils/theme';
import { useBookingStore } from '../store/useBookingStore';

interface SearchBarProps {
  onToggleFilters?: () => void;
  showFilterToggle?: boolean;
  filtersOpen?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onToggleFilters,
  showFilterToggle = true,
  filtersOpen = false,
}) => {
  const searchQuery = useBookingStore((state) => state.filters.searchQuery);
  const setFilters = useBookingStore((state) => state.setFilters);
  const filters = useBookingStore((state) => state.filters);

  const activeFilterCount =
    (filters.building !== 'ALL' ? 1 : 0) +
    (filters.minCapacity > 0 ? 1 : 0) +
    filters.equipment.length +
    (filters.type !== 'ALL' ? 1 : 0);

  return (
    <View style={styles.container}>
      <View style={styles.inputWrapper}>
        <Ionicons
          name="search-outline"
          size={18}
          color={theme.colors.textMuted}
          style={styles.searchIcon}
        />
        <TextInput
          value={searchQuery}
          onChangeText={(text) => setFilters({ searchQuery: text })}
          placeholder="Search room name, code (e.g. A-101)..."
          placeholderTextColor={theme.colors.textMuted}
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="never"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setFilters({ searchQuery: '' })}
            style={styles.clearBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name="close-circle"
              size={18}
              color={theme.colors.textMuted}
            />
          </TouchableOpacity>
        )}
      </View>

      {showFilterToggle && onToggleFilters && (
        <TouchableOpacity
          onPress={onToggleFilters}
          style={[
            styles.filterBtn,
            filtersOpen && styles.filterBtnActive,
            activeFilterCount > 0 && styles.filterBtnWithActive,
          ]}
          activeOpacity={0.8}
        >
          <Ionicons
            name={filtersOpen ? 'funnel' : 'funnel-outline'}
            size={18}
            color={
              filtersOpen || activeFilterCount > 0
                ? '#FFFFFF'
                : theme.colors.textSecondary
            }
          />
          {activeFilterCount > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    gap: 10,
    backgroundColor: theme.colors.card,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.textPrimary,
    height: '100%',
  },
  clearBtn: {
    padding: 2,
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  filterBtnActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterBtnWithActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  countBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: theme.colors.accent,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  countText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
});
