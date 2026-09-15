import React, { useState } from 'react';
import {
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { BenefitType, SchemeCategory } from '../models/schemes.model';
import { useCategoriesQuery } from '../hooks/useSchemesQuery';
import { spacing } from '@/core/theme/spacing';
import { palette } from '@/core/theme/colors';

interface SchemeFilterBarProps {
  selectedJurisdiction: string;
  onSelectJurisdiction: (jurisdiction: string) => void;
  selectedBenefitType: BenefitType;
  onSelectBenefitType: (type: BenefitType) => void;
  selectedCategory: SchemeCategory;
  onSelectCategory: (category: SchemeCategory) => void;
  resultsCount: number;
  userState?: string;
  onResetFilters?: () => void;
}

const BENEFIT_TYPES: { id: BenefitType; label: string }[] = [
  { id: 'all', label: 'All Benefits' },
  { id: 'cash_grant', label: 'Cash Grants' },
  { id: 'subsidy', label: 'Subsidies' },
  { id: 'loan', label: 'Loans' },
];

export const ALL_INDIAN_STATES = [
  'Andaman and Nicobar Islands',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chandigarh',
  'Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu and Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Ladakh',
  'Lakshadweep',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Puducherry',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
];

const ACTIVE_DB_STATES = ['Maharashtra', 'Madhya Pradesh', 'Karnataka'];

const getCategoryIcon = (category: string): string => {
  const lower = category.toLowerCase();
  if (lower.includes('agri') || lower.includes('farm')) return 'leaf';
  if (lower.includes('women') || lower.includes('girl') || lower.includes('child')) return 'female';
  if (lower.includes('edu') || lower.includes('school') || lower.includes('student')) return 'graduation-cap';
  if (lower.includes('health') || lower.includes('medic')) return 'heartbeat';
  if (lower.includes('business') || lower.includes('finance') || lower.includes('msme')) return 'briefcase';
  if (lower.includes('welfare') || lower.includes('social')) return 'users';
  if (lower.includes('skill') || lower.includes('employ') || lower.includes('job')) return 'cogs';
  if (lower.includes('hous') || lower.includes('home')) return 'home';
  return 'tag';
};

export const SchemeFilterBar: React.FC<SchemeFilterBarProps> = ({
  selectedJurisdiction,
  onSelectJurisdiction,
  selectedBenefitType,
  onSelectBenefitType,
  selectedCategory,
  onSelectCategory,
  resultsCount,
  userState,
  onResetFilters,
}) => {
  const [isStateModalVisible, setIsStateModalVisible] = useState(false);
  const [stateSearchQuery, setStateSearchQuery] = useState('');
  const { data: serverCategories } = useCategoriesQuery();

  const isStateSelected =
    selectedJurisdiction !== 'All India' &&
    selectedJurisdiction !== 'Central' &&
    selectedJurisdiction !== 'Central Only';

  const isAnyFilterActive =
    selectedJurisdiction !== 'All India' ||
    selectedCategory !== 'all' ||
    selectedBenefitType !== 'all';

  const filteredStates = ALL_INDIAN_STATES.filter((s) =>
    s.toLowerCase().includes(stateSearchQuery.toLowerCase().trim())
  );

  return (
    <View style={styles.container}>
      {/* Jurisdiction Row */}
      <View style={styles.dropdownRow}>
        {/* All India */}
        <TouchableOpacity
          style={[
            styles.dropdownPill,
            selectedJurisdiction === 'All India' && styles.dropdownPillActive,
          ]}
          onPress={() => onSelectJurisdiction('All India')}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Filter by All India schemes"
        >
          <Text
            style={[
              styles.dropdownText,
              selectedJurisdiction === 'All India' && styles.dropdownTextActive,
            ]}
          >
            All India
          </Text>
        </TouchableOpacity>

        {/* Central Only */}
        <TouchableOpacity
          style={[
            styles.dropdownPill,
            (selectedJurisdiction === 'Central' || selectedJurisdiction === 'Central Only') &&
              styles.dropdownPillActive,
          ]}
          onPress={() =>
            onSelectJurisdiction(
              selectedJurisdiction === 'Central' ? 'All India' : 'Central'
            )
          }
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Filter by Central Government schemes only"
        >
          <Text
            style={[
              styles.dropdownText,
              (selectedJurisdiction === 'Central' ||
                selectedJurisdiction === 'Central Only') &&
                styles.dropdownTextActive,
            ]}
          >
            Central Only
          </Text>
        </TouchableOpacity>

        {/* Dynamic State Selector Button */}
        <TouchableOpacity
          style={[
            styles.dropdownPill,
            isStateSelected && styles.dropdownPillActive,
            { flexDirection: 'row', alignItems: 'center', gap: 4 },
          ]}
          onPress={() => setIsStateModalVisible(true)}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Select State"
        >
          <FontAwesome
            name="map-marker"
            size={12}
            color={isStateSelected ? '#FFFFFF' : palette.emerald700}
          />
          <Text
            style={[
              styles.dropdownText,
              isStateSelected && styles.dropdownTextActive,
            ]}
            numberOfLines={1}
          >
            {isStateSelected ? selectedJurisdiction : (userState || 'Select State')} ▾
          </Text>
        </TouchableOpacity>
      </View>

      {/* Category Chips - Dynamically Populated from Backend Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryChipsScroll}
      >
        <TouchableOpacity
          style={[
            styles.categoryPill,
            selectedCategory === 'all' && styles.categoryPillActive,
          ]}
          onPress={() => onSelectCategory('all')}
          activeOpacity={0.7}
        >
          <FontAwesome
            name="th-large"
            size={12}
            color={selectedCategory === 'all' ? palette.emerald700 : '#64748B'}
            style={styles.catIcon}
          />
          <Text
            style={[
              styles.categoryPillText,
              selectedCategory === 'all' && styles.categoryPillTextActive,
            ]}
          >
            All
          </Text>
        </TouchableOpacity>

        {(serverCategories || []).map((cat) => {
          const isActive =
            selectedCategory.toLowerCase() === cat.category.toLowerCase();
          const iconName = getCategoryIcon(cat.category);
          return (
            <TouchableOpacity
              key={cat.category}
              style={[styles.categoryPill, isActive && styles.categoryPillActive]}
              onPress={() => onSelectCategory(isActive ? 'all' : cat.category)}
              activeOpacity={0.7}
            >
              <FontAwesome
                name={iconName as any}
                size={12}
                color={isActive ? palette.emerald700 : '#64748B'}
                style={styles.catIcon}
              />
              <Text
                style={[
                  styles.categoryPillText,
                  isActive && styles.categoryPillTextActive,
                ]}
              >
                {cat.category} ({cat.count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Benefit Type Horizontal Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.benefitChipsScroll}
      >
        {BENEFIT_TYPES.map((type) => {
          const isActive = selectedBenefitType === type.id;
          return (
            <TouchableOpacity
              key={type.id}
              style={[styles.chip, isActive && styles.chipActive]}
              onPress={() => onSelectBenefitType(type.id)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                {type.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Results Count & Clear Filter Action Bar */}
      <View style={styles.resultsBar}>
        <Text style={styles.resultsText}>
          <Text style={styles.resultsCount}>{resultsCount}</Text> schemes found
        </Text>

        {isAnyFilterActive && onResetFilters ? (
          <TouchableOpacity
            style={styles.resetBtn}
            onPress={onResetFilters}
            activeOpacity={0.7}
          >
            <FontAwesome name="times-circle" size={12} color="#DC2626" />
            <Text style={styles.resetText}>Clear Filters</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* State Picker Modal */}
      <Modal
        visible={isStateModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsStateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Select State Jurisdiction</Text>
                <Text style={styles.modalSubtitle}>
                  Choose a state to see state-specific government schemes
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsStateModalVisible(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <FontAwesome name="times" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* State Search Bar */}
            <View style={styles.modalSearchBox}>
              <FontAwesome name="search" size={14} color="#94A3B8" />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Search Indian states..."
                placeholderTextColor="#94A3B8"
                value={stateSearchQuery}
                onChangeText={setStateSearchQuery}
                autoCorrect={false}
              />
              {stateSearchQuery ? (
                <TouchableOpacity onPress={() => setStateSearchQuery('')}>
                  <FontAwesome name="times-circle" size={14} color="#94A3B8" />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Quick Presets */}
            <View style={styles.presetSection}>
              <Text style={styles.presetLabel}>Quick Selection:</Text>
              <View style={styles.presetRow}>
                <TouchableOpacity
                  style={[
                    styles.presetPill,
                    selectedJurisdiction === 'All India' && styles.presetPillActive,
                  ]}
                  onPress={() => {
                    onSelectJurisdiction('All India');
                    setIsStateModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.presetText,
                      selectedJurisdiction === 'All India' && styles.presetTextActive,
                    ]}
                  >
                    All India
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.presetPill,
                    selectedJurisdiction === 'Central' && styles.presetPillActive,
                  ]}
                  onPress={() => {
                    onSelectJurisdiction('Central');
                    setIsStateModalVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.presetText,
                      selectedJurisdiction === 'Central' && styles.presetTextActive,
                    ]}
                  >
                    Central Only
                  </Text>
                </TouchableOpacity>

                {ACTIVE_DB_STATES.map((st) => (
                  <TouchableOpacity
                    key={st}
                    style={[
                      styles.presetPill,
                      selectedJurisdiction === st && styles.presetPillActive,
                    ]}
                    onPress={() => {
                      onSelectJurisdiction(st);
                      setIsStateModalVisible(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.presetText,
                        selectedJurisdiction === st && styles.presetTextActive,
                      ]}
                    >
                      {st}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Full State List */}
            <FlatList
              data={filteredStates}
              keyExtractor={(item) => item}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.stateListContainer}
              renderItem={({ item }) => {
                const isSelected = selectedJurisdiction === item;
                const hasSchemes = ACTIVE_DB_STATES.includes(item);
                return (
                  <TouchableOpacity
                    style={[styles.stateItem, isSelected && styles.stateItemActive]}
                    onPress={() => {
                      onSelectJurisdiction(item);
                      setIsStateModalVisible(false);
                    }}
                  >
                    <View style={styles.stateItemLeft}>
                      <FontAwesome
                        name="map-pin"
                        size={13}
                        color={isSelected ? palette.emerald700 : '#94A3B8'}
                        style={{ marginRight: 10 }}
                      />
                      <Text
                        style={[
                          styles.stateItemText,
                          isSelected && styles.stateItemTextActive,
                        ]}
                      >
                        {item}
                      </Text>
                      {hasSchemes ? (
                        <View style={styles.activeBadge}>
                          <Text style={styles.activeBadgeText}>Available</Text>
                        </View>
                      ) : null}
                    </View>
                    {isSelected ? (
                      <FontAwesome name="check" size={14} color={palette.emerald700} />
                    ) : null}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.xs,
  },
  dropdownRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: spacing.md,
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  dropdownPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dropdownPillActive: {
    backgroundColor: palette.emerald700,
    borderColor: palette.emerald700,
  },
  dropdownText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  dropdownTextActive: {
    color: '#FFFFFF',
  },
  categoryChipsScroll: {
    paddingHorizontal: spacing.md,
    gap: 6,
    paddingVertical: 4,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryPillActive: {
    backgroundColor: palette.emerald50,
    borderColor: palette.emerald600,
  },
  catIcon: {
    marginRight: 6,
  },
  categoryPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  categoryPillTextActive: {
    color: palette.emerald800,
    fontWeight: '700',
  },
  benefitChipsScroll: {
    paddingHorizontal: spacing.md,
    gap: 6,
    paddingVertical: 4,
  },
  chip: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipActive: {
    backgroundColor: palette.emerald700,
    borderColor: palette.emerald700,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  resultsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: 6,
    paddingBottom: 2,
  },
  resultsText: {
    fontSize: 12,
    color: '#64748B',
  },
  resultsCount: {
    fontWeight: '700',
    color: '#0F172A',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#FEE2E2',
  },
  resetText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#DC2626',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  modalSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    marginBottom: spacing.md,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    padding: 0,
  },
  presetSection: {
    marginBottom: spacing.sm,
  },
  presetLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: spacing.sm,
  },
  presetPill: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  presetPillActive: {
    backgroundColor: palette.emerald700,
    borderColor: palette.emerald700,
  },
  presetText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  presetTextActive: {
    color: '#FFFFFF',
  },
  stateListContainer: {
    paddingBottom: spacing.lg,
  },
  stateItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  stateItemActive: {
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
  },
  stateItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  stateItemText: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '500',
  },
  stateItemTextActive: {
    color: palette.emerald800,
    fontWeight: '700',
  },
  activeBadge: {
    marginLeft: 8,
    paddingVertical: 2,
    paddingHorizontal: 6,
    backgroundColor: '#DCFCE7',
    borderRadius: 6,
  },
  activeBadgeText: {
    fontSize: 10,
    color: '#15803D',
    fontWeight: '700',
  },
});
