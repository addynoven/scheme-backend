import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as Haptics from 'expo-haptics';
import { colors, palette } from '@/core/theme/colors';
import { borderRadius, spacing } from '@/core/theme/spacing';
import { fontSizes, fontWeights } from '@/core/theme/typography';
import type { SchemeRecommendation } from '../models/advisor.model';

interface SchemeRecommendationCardProps {
  readonly scheme: SchemeRecommendation;
  readonly onPress: (schemeId: string) => void;
}

function getTagStyle(tag: string) {
  const lower = tag.toLowerCase();
  if (lower.includes('all india') || lower.includes('state') || lower.includes('maharashtra') || lower.includes('central')) {
    return { bg: '#EFF6FF', text: '#1D4ED8' }; // blue
  }
  if (lower.includes('subsidy') || lower.includes('loan') || lower.includes('grant') || lower.includes('merit')) {
    return { bg: '#FEF3C7', text: '#B45309' }; // amber
  }
  return { bg: '#ECFDF5', text: '#065F46' }; // emerald
}

function getIconName(icon?: string): React.ComponentProps<typeof FontAwesome>['name'] {
  if (icon === 'tint') return 'tint';
  if (icon === 'users') return 'users';
  if (icon === 'leaf') return 'leaf';
  if (icon === 'graduation-cap') return 'graduation-cap';
  if (icon === 'heart') return 'heart';
  if (icon === 'shield') return 'shield';
  return 'institution';
}

export function SchemeRecommendationCard({
  scheme,
  onPress,
}: SchemeRecommendationCardProps) {
  const handlePress = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress(scheme.id);
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handlePress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`View details for ${scheme.title}`}
    >
      {/* Top Header Row with Icon, Title/Ministry, and Chevron */}
      <View style={styles.topRow}>
        <View style={styles.iconBox}>
          <FontAwesome name={getIconName(scheme.icon)} size={16} color={palette.emerald800} />
        </View>

        <View style={styles.titleCol}>
          <Text style={styles.titleText}>{scheme.title}</Text>
          <Text style={styles.ministryText} numberOfLines={1}>
            {scheme.ministry}
          </Text>
        </View>

        <FontAwesome name="chevron-right" size={13} color={colors.light.textSubtle} style={styles.chevron} />
      </View>

      {/* Benefit Highlight */}
      <View style={styles.benefitContainer}>
        <Text style={styles.benefitAmount}>{scheme.benefitAmount}</Text>
        <Text style={styles.benefitDesc}>{scheme.benefitDescription}</Text>
      </View>

      {/* Tags with Frame 4 color-coding */}
      <View style={styles.tagsContainer}>
        {scheme.tags.map((tag) => {
          const style = getTagStyle(tag);
          return (
            <View key={tag} style={[styles.tagPill, { backgroundColor: style.bg }]}>
              <Text style={[styles.tagText, { color: style.text }]}>{tag}</Text>
            </View>
          );
        })}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.light.surfaceElevated,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.light.border,
    marginVertical: spacing.xs,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.xs + 2,
    gap: spacing.sm,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D1FAE5',
    marginTop: 2,
  },
  titleCol: {
    flex: 1,
  },
  titleText: {
    fontSize: fontSizes.base - 1,
    fontWeight: fontWeights.bold,
    color: colors.light.text,
    lineHeight: 20,
    marginBottom: 2,
  },
  ministryText: {
    fontSize: fontSizes.xs,
    color: colors.light.textMuted,
    fontWeight: fontWeights.medium,
  },
  chevron: {
    marginTop: 6,
  },
  benefitContainer: {
    backgroundColor: palette.slate50,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: palette.emerald600,
  },
  benefitAmount: {
    fontSize: fontSizes.sm + 1,
    fontWeight: fontWeights.bold,
    color: palette.emerald700,
    marginBottom: 2,
  },
  benefitDesc: {
    fontSize: fontSizes.xs,
    color: colors.light.textMuted,
    lineHeight: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  tagPill: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  tagText: {
    fontSize: fontSizes.xs - 1,
    fontWeight: fontWeights.semibold,
  },
});
