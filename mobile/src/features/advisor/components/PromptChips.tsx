import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, palette } from '@/core/theme/colors';
import { borderRadius, spacing } from '@/core/theme/spacing';
import { fontSizes, fontWeights } from '@/core/theme/typography';
import type { PromptChip } from '../models/advisor.model';

interface PromptChipsProps {
  readonly chips: readonly PromptChip[];
  readonly onSelect: (queryText: string) => void;
  readonly onMoreTopics?: () => void;
}

export function PromptChips({ chips, onSelect, onMoreTopics }: PromptChipsProps) {
  const handlePress = (queryText: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(queryText);
  };

  return (
    <View style={styles.container}>
      <View style={styles.chipsList}>
        {chips.map((chip) => (
          <TouchableOpacity
            key={chip.id}
            style={styles.chipButton}
            onPress={() => handlePress(chip.queryText)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={chip.label}
          >
            <Text style={styles.chipIcon}>{chip.icon}</Text>
            <Text style={styles.chipText}>{chip.label}</Text>
          </TouchableOpacity>
        ))}

        {onMoreTopics ? (
          <TouchableOpacity
            style={styles.moreTopicsButton}
            onPress={onMoreTopics}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="More topics"
          >
            <Text style={styles.moreDots}>•••</Text>
            <Text style={styles.moreText}>More topics</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  chipsList: {
    gap: spacing.sm,
  },
  chipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.light.surfaceElevated,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.light.border,
    gap: spacing.md,
  },
  chipIcon: {
    fontSize: fontSizes.lg,
  },
  chipText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    color: palette.slate800,
  },
  moreTopicsButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    backgroundColor: palette.slate100,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: palette.slate200,
    gap: spacing.xs,
    marginTop: spacing.xxs,
  },
  moreDots: {
    fontSize: fontSizes.xs,
    fontWeight: '900',
    color: colors.light.textMuted,
    letterSpacing: 1,
  },
  moreText: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
    color: colors.light.textMuted,
  },
});
