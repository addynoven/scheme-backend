import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Animated,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { palette } from '@/core/theme';

interface SplashScreenViewProps {
  onComplete: () => void;
  autoAdvance?: boolean;
}

export const SplashScreenView: React.FC<SplashScreenViewProps> = ({
  onComplete,
  autoAdvance = true,
}) => {
  const { width } = useWindowDimensions();
  const progressAnim = useRef(new Animated.Value(0.15)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in whole content smoothly
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();

    // Progress bar animation from 15% to 100% over 1.8 seconds (1-2 seconds spec)
    const animation = Animated.timing(progressAnim, {
      toValue: 1,
      duration: 1800,
      useNativeDriver: false,
    });

    animation.start(({ finished }) => {
      if (finished && autoAdvance) {
        onComplete();
      }
    });

    return () => {
      animation.stop();
    };
  }, [autoAdvance, fadeAnim, onComplete, progressAnim]);

  const progressBarWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Pressable
      style={({ pressed }) => [styles.container, { opacity: pressed ? 0.98 : 1 }]}
      onPress={onComplete}
    >
      <Animated.View style={[styles.innerContent, { opacity: fadeAnim }]}>
        {/* Brand Header */}
        <View style={styles.brandHeader}>
          <Image
            source={require('../../../../assets/onboarding/leaf_logo.png')}
            style={styles.leafLogo}
            resizeMode="contain"
          />
          <Text style={styles.brandTitle}>Scheme App</Text>
          <Text style={styles.brandSubtitle}>Sarkar ki yojana, aapke liye</Text>
        </View>

        {/* Catchphrase & Tricolor Ribbon */}
        <View style={styles.taglineSection}>
          <Text style={styles.taglineText}>A Brighter Tomorrow{'\n'}For Every Citizen</Text>
          <Image
            source={require('../../../../assets/onboarding/tricolor_ribbon.png')}
            style={styles.tricolorRibbon}
            resizeMode="contain"
          />
        </View>

        {/* Hero Citizens Artwork */}
        <View style={styles.artworkContainer}>
          <Image
            source={require('../../../../assets/onboarding/citizens_quartet.png')}
            style={[styles.citizensImage, { width: width - 32 }]}
            resizeMode="cover"
          />
        </View>

        {/* Bottom Card with Progress & Trust Badges */}
        <View style={styles.bottomSheetCard}>
          {/* Animated Progress Bar */}
          <View style={styles.progressSection}>
            <View style={styles.progressTrack}>
              <Animated.View style={[styles.progressBar, { width: progressBarWidth }]} />
            </View>
            <Text style={styles.progressLabel}>Building a more inclusive India...</Text>
          </View>

          {/* 3 Trust Badges */}
          <View style={styles.trustBadgesRow}>
            {/* 1. Secure */}
            <View style={styles.badgeItem}>
              <View style={styles.badgeIconBox}>
                <Ionicons name="shield-checkmark" size={18} color="#0D7A5F" />
              </View>
              <Text style={styles.badgeLabel}>Secure</Text>
            </View>

            <View style={styles.badgeDivider} />

            {/* 2. Government Verified */}
            <View style={styles.badgeItem}>
              <View style={styles.badgeIconBox}>
                <Ionicons name="people" size={18} color="#1E293B" />
              </View>
              <Text style={styles.badgeLabel}>Government Verified</Text>
            </View>

            <View style={styles.badgeDivider} />

            {/* 3. For Every Citizen */}
            <View style={styles.badgeItem}>
              <View style={styles.badgeIconBox}>
                <Ionicons name="heart" size={18} color="#10B981" />
              </View>
              <Text style={styles.badgeLabel}>For Every Citizen</Text>
            </View>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FCF9',
  },
  innerContent: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: 16,
  },
  brandHeader: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 4,
  },
  leafLogo: {
    width: 68,
    height: 68,
    marginBottom: 6,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0A2540',
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
    marginTop: 2,
  },
  taglineSection: {
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: 24,
  },
  taglineText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    lineHeight: 22,
  },
  tricolorRibbon: {
    width: 90,
    height: 28,
    marginTop: 6,
  },
  artworkContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    maxHeight: 280,
    overflow: 'hidden',
    marginTop: 4,
  },
  citizensImage: {
    height: 270,
    borderRadius: 16,
  },
  bottomSheetCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 18,
    paddingBottom: 24,
    paddingHorizontal: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  progressSection: {
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  progressTrack: {
    width: '90%',
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 99,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: palette.emerald700,
    borderRadius: 99,
  },
  progressLabel: {
    fontSize: 12.5,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 8,
  },
  trustBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  badgeItem: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 4,
  },
  badgeIconBox: {
    marginBottom: 4,
  },
  badgeLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#334155',
    textAlign: 'center',
  },
  badgeDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },
});
