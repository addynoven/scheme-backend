import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { colors, palette } from '@/core/theme/colors';
import { borderRadius, spacing } from '@/core/theme/spacing';
import { fontSizes, fontWeights } from '@/core/theme/typography';
import { Card } from '@/core/components/Card';

export function WelcomeCard() {
  return (
    <Card padding="md" style={styles.card}>
      <View style={styles.textContainer}>
        <View style={styles.greetingRow}>
          <Text style={styles.greetingText}>Namaste!</Text>
          <Text style={styles.waveEmoji}>👋</Text>
        </View>

        <Text style={styles.questionText}>
          What welfare support are you looking for today?
        </Text>

        <Text style={styles.supportDescription}>
          I can help you find government schemes, check eligibility, and guide you through the application process.
        </Text>
      </View>

      {/* Civic Graphic Banner matching Frame 1 */}
      <View style={styles.bannerContainer}>
        <View style={styles.bannerBackdrop}>
          <View style={styles.sunGraphic} />
          <View style={styles.landscapeGraphic} />
        </View>

        <View style={styles.citizenAvatarWrapper}>
          <View style={styles.citizenIconCircle}>
            <FontAwesome name="user" size={32} color={palette.emerald800} />
          </View>
          <View style={styles.leafBadge}>
            <FontAwesome name="leaf" size={10} color="#FFFFFF" />
          </View>
        </View>

        <View style={styles.pillBadge}>
          <Text style={styles.pillFlag}>🇮🇳</Text>
          <Text style={styles.pillText}>Empowering Every Citizen</Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.lg,
    backgroundColor: colors.light.surfaceElevated,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.light.border,
  },
  textContainer: {
    marginBottom: spacing.md,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  greetingText: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold,
    color: colors.light.text,
  },
  waveEmoji: {
    fontSize: fontSizes.xl,
  },
  questionText: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.bold,
    color: palette.slate800,
    lineHeight: 22,
    marginBottom: spacing.xs,
  },
  supportDescription: {
    fontSize: fontSizes.sm,
    color: colors.light.textMuted,
    lineHeight: 19,
  },
  bannerContainer: {
    height: 120,
    borderRadius: borderRadius.lg,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
    gap: spacing.xs,
  },
  bannerBackdrop: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sunGraphic: {
    position: 'absolute',
    top: -20,
    right: 30,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FEF3C7',
    opacity: 0.6,
  },
  landscapeGraphic: {
    position: 'absolute',
    bottom: -30,
    left: -20,
    right: -20,
    height: 60,
    borderRadius: 50,
    backgroundColor: '#D1FAE5',
    opacity: 0.7,
  },
  citizenAvatarWrapper: {
    position: 'relative',
  },
  citizenIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: palette.slate900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: palette.emerald200,
  },
  leafBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: palette.emerald700,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  pillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: palette.emerald200,
    shadowColor: palette.slate900,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    gap: 4,
  },
  pillFlag: {
    fontSize: 12,
  },
  pillText: {
    fontSize: fontSizes.xs - 1,
    fontWeight: fontWeights.semibold,
    color: palette.emerald800,
  },
});
