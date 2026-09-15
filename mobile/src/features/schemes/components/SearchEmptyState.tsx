import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { palette } from '@/core/theme/colors';
import { spacing } from '@/core/theme/spacing';

interface SearchEmptyStateProps {
  readonly query: string;
  readonly onBrowseAll: () => void;
  readonly onSelectSuggestion: (suggestion: string) => void;
}

const SUGGESTIONS = [
  'education subsidy',
  'student support',
  'digital devices',
  'skill development',
];

export function SearchEmptyState({
  query,
  onBrowseAll,
  onSelectSuggestion,
}: SearchEmptyStateProps) {
  return (
    <View style={styles.container}>
      {/* Search Empty Icon Graphic */}
      <View style={styles.iconCircle}>
        <FontAwesome name="file-text-o" size={38} color="#94A3B8" />
        <View style={styles.magnifierBadge}>
          <FontAwesome name="search" size={16} color="#0D7A5F" />
        </View>
      </View>

      {/* Query Title */}
      <Text style={styles.title}>
        No schemes found for{'\n'}
        <Text style={styles.queryHighlight}>"{query}"</Text>
      </Text>

      {/* Subtitle */}
      <Text style={styles.subtitle}>
        Try a different keyword, check the spelling,{'\n'}or browse by category.
      </Text>

      {/* Browse All Schemes CTA */}
      <TouchableOpacity
        style={styles.browseButton}
        onPress={onBrowseAll}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Browse All Schemes"
      >
        <Text style={styles.browseButtonText}>Browse All Schemes</Text>
      </TouchableOpacity>

      {/* Try These Instead Suggestions */}
      <View style={styles.suggestionsContainer}>
        <Text style={styles.suggestionsHeader}>Try these instead</Text>
        <View style={styles.chipsGrid}>
          {SUGGESTIONS.map((item) => (
            <TouchableOpacity
              key={item}
              style={styles.suggestionChip}
              onPress={() => onSelectSuggestion(item)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Search for ${item}`}
            >
              <FontAwesome name="search" size={12} color="#0D7A5F" />
              <Text style={styles.suggestionText}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: spacing.lg,
  },
  magnifierBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#DCFCE7',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    lineHeight: 25,
    marginBottom: spacing.xs,
  },
  queryHighlight: {
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.xl,
  },
  browseButton: {
    width: '100%',
    backgroundColor: '#0D7A5F',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0D7A5F',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: spacing.xl,
  },
  browseButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  suggestionsContainer: {
    width: '100%',
    alignItems: 'flex-start',
  },
  suggestionsHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: spacing.sm,
  },
  chipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    width: '100%',
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  suggestionText: {
    fontSize: 12.5,
    color: '#1E293B',
    fontWeight: '500',
  },
});
