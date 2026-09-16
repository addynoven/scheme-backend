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
  if (lower.includes('verified')) {
    return { bg: '#ECFDF5', text: '#065F46' }; // emerald
  }
  if (lower.includes('all india') || lower.includes('state') || lower.includes('maharashtra') || lower.includes('central')) {
    return { bg: '#EFF6FF', text: '#1D4ED8' }; // blue
  }
  if (lower.includes('subsidy') || lower.includes('loan') || lower.includes('grant') || lower.includes('merit')) {
    return { bg: '#FEF3C7', text: '#B45309' }; // amber
  }
  return { bg: '#F1F5F9', text: '#475569' }; // slate
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

  const hasSummary = Boolean(
    scheme.benefitDescription &&
    scheme.benefitDescription !== 'Verified citizen welfare scheme' &&
    scheme.benefitDescription.trim().length > 0
  );

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handlePress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`View details for ${scheme.title}`}
    >
      {/* Top Header Row with Icon, Title, and Chevron */}
      <View style={styles.topRow}>
        <View style={styles.iconBox}>
          <FontAwesome name={getIconName(scheme.icon)} size={13} color={palette.emerald800} />
        </View>

        <View style={styles.titleCol}>
          <Text style={styles.titleText} numberOfLines={2}>{scheme.title}</Text>
          <Text style={styles.ministryText} numberOfLines={1}>
            {scheme.ministry}
          </Text>
        </View>

        <FontAwesome name="chevron-right" size={11} color={colors.light.textSubtle} style={styles.chevron} />
      </View>

      {/* Real Summary (No empty gray skeleton box) */}
      {hasSummary ? (
        <Text style={styles.summaryText} numberOfLines={2}>
          {scheme.benefitDescription}
        </Text>
      ) : null}

      {/* Benefit Amount if provided */}
      {scheme.benefitAmount ? (
        <Text style={styles.benefitAmount}>{scheme.benefitAmount}</Text>
      ) : null}

      {/* Compact Tags */}
      {scheme.tags && scheme.tags.length > 0 ? (
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
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.light.surfaceElevated,
    borderRadius: borderRadius.md,
    padding: spacing.sm + 2,
    borderWidth: 1,
    borderColor: colors.light.border,
    marginVertical: 3,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  titleCol: {
    flex: 1,
  },
  titleText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    color: colors.light.text,
    lineHeight: 18,
  },
  ministryText: {
    fontSize: fontSizes.xs - 1,
    color: colors.light.textMuted,
    fontWeight: fontWeights.medium,
    marginTop: 1,
  },
  chevron: {
    marginLeft: spacing.xs,
  },
  summaryText: {
    fontSize: fontSizes.xs,
    color: palette.slate600,
    lineHeight: 16,
    marginTop: 6,
  },
  benefitAmount: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    color: palette.emerald700,
    marginTop: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 6,
  },
  tagPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
  },
  tagText: {
    fontSize: fontSizes.xs - 2,
    fontWeight: fontWeights.semibold,
  },
});
