import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { colors, palette } from '@/core/theme/colors';
import { spacing } from '@/core/theme/spacing';
import { fontSizes, fontWeights } from '@/core/theme/typography';

interface AdvisorHeaderProps {
  readonly onProfilePress?: () => void;
  readonly onNotificationPress?: () => void;
  readonly onHistoryPress?: () => void;
}

export function AdvisorHeader({
  onProfilePress,
  onNotificationPress,
  onHistoryPress,
}: AdvisorHeaderProps) {
  const router = useRouter();
  const currentUser = useAuthStore((s) => s.currentUser);

  const handleBrandPress = () => {
    router.push('/onboarding');
  };

  return (
    <View style={styles.header}>
      {/* Brand Logo and Screen Title */}
      <TouchableOpacity
        style={styles.brandRow}
        onPress={handleBrandPress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Advisor"
      >
        <View style={styles.logoCircle}>
          <FontAwesome name="leaf" size={15} color="#FFFFFF" />
        </View>
        <Text style={styles.appTitle}>Advisor</Text>
      </TouchableOpacity>

      {/* Right Actions: History and Profile */}
      <View style={styles.rightActions}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onHistoryPress}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Open Consultation History"
        >
          <FontAwesome name="history" size={18} color={palette.emerald800} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.avatarButton}
          onPress={onProfilePress}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Open Citizen Profile"
        >
          {currentUser?.avatarUrl ? (
            <Image
              source={{ uri: currentUser.avatarUrl }}
              style={styles.avatarImage}
            />
          ) : (
            <View style={styles.avatarCircle}>
              <FontAwesome name="user" size={15} color={palette.emerald800} />
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  logoCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: palette.emerald900,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleColumn: {
    justifyContent: 'center',
  },
  appTitle: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.bold,
    color: colors.light.text,
    letterSpacing: -0.2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: palette.emerald500,
  },
  statusText: {
    fontSize: fontSizes.xs,
    color: colors.light.textMuted,
    fontWeight: fontWeights.medium,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconButton: {
    padding: spacing.xs,
    position: 'relative',
  },
  notifBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#EF4444',
  },
  avatarButton: {
    padding: spacing.xxs,
  },
  avatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: palette.emerald100,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: palette.emerald600,
  },
  avatarImage: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: palette.emerald600,
  },
});
