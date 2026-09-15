import React, { useEffect, useState } from 'react';
import {
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as Haptics from 'expo-haptics';
import { colors, palette } from '@/core/theme/colors';
import { borderRadius, spacing } from '@/core/theme/spacing';
import { fontSizes, fontWeights } from '@/core/theme/typography';

interface VoiceListeningModalProps {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly onFinish: (transcription: string) => void;
}

export function VoiceListeningModal({
  visible,
  onClose,
  onFinish,
}: VoiceListeningModalProps) {
  const [pulseAnim] = useState(() => new Animated.Value(1));
  const [waveAnim] = useState(() => new Animated.Value(0.5));

  useEffect(() => {
    if (visible) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 900,
            useNativeDriver: true,
          }),
        ])
      );

      const wave = Animated.loop(
        Animated.sequence([
          Animated.timing(waveAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(waveAnim, {
            toValue: 0.4,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );

      pulse.start();
      wave.start();
      return () => {
        pulse.stop();
        wave.stop();
      };
    }
  }, [visible, pulseAnim, waveAnim]);

  const handleStop = (query?: string) => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onFinish(query ?? 'I am a farmer and I want to know about schemes for drip irrigation.');
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheetContainer}>
          {/* Close button */}
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close voice search"
          >
            <FontAwesome name="times" size={16} color={colors.light.textMuted} />
          </TouchableOpacity>

          <Text style={styles.listeningTitle}>Listening...</Text>

          {/* Central Mic & Audio Waveform Visualizer */}
          <View style={styles.visualizerRow}>
            {/* Left Sound Wave Bars */}
            <View style={styles.waveSide}>
              <Animated.View style={[styles.waveBar, { height: 18, transform: [{ scaleY: waveAnim }] }]} />
              <Animated.View style={[styles.waveBar, { height: 32, transform: [{ scaleY: waveAnim }] }]} />
              <Animated.View style={[styles.waveBar, { height: 48, transform: [{ scaleY: waveAnim }] }]} />
              <Animated.View style={[styles.waveBar, { height: 26, transform: [{ scaleY: waveAnim }] }]} />
            </View>

            {/* Pulsing Mic Circle */}
            <View style={styles.micWrapper}>
              <Animated.View
                style={[
                  styles.pulseCircleOuter,
                  { transform: [{ scale: pulseAnim }] },
                ]}
              />
              <Animated.View
                style={[
                  styles.pulseCircleInner,
                  { transform: [{ scale: pulseAnim }] },
                ]}
              />
              <View style={styles.micCircle}>
                <FontAwesome name="microphone" size={32} color="#FFFFFF" />
              </View>
            </View>

            {/* Right Sound Wave Bars */}
            <View style={styles.waveSide}>
              <Animated.View style={[styles.waveBar, { height: 26, transform: [{ scaleY: waveAnim }] }]} />
              <Animated.View style={[styles.waveBar, { height: 48, transform: [{ scaleY: waveAnim }] }]} />
              <Animated.View style={[styles.waveBar, { height: 32, transform: [{ scaleY: waveAnim }] }]} />
              <Animated.View style={[styles.waveBar, { height: 18, transform: [{ scaleY: waveAnim }] }]} />
            </View>
          </View>

          <Text style={styles.languageHint}>
            Speak naturally in Hindi or English
          </Text>

          {/* Red Stop Button */}
          <TouchableOpacity
            style={styles.stopButton}
            onPress={() => handleStop()}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Stop recording"
          >
            <View style={styles.stopIconCircle}>
              <FontAwesome name="times" size={18} color="#DC2626" />
            </View>
            <Text style={styles.stopText}>Tap to stop</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  sheetContainer: {
    width: '100%',
    backgroundColor: colors.light.surfaceElevated,
    borderRadius: borderRadius.xl,
    padding: spacing.xxl,
    alignItems: 'center',
    shadowColor: palette.slate900,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  closeBtn: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
    padding: spacing.xs,
  },
  listeningTitle: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold,
    color: colors.light.text,
    marginBottom: spacing.xl,
  },
  visualizerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  waveSide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 50,
  },
  waveBar: {
    width: 4,
    backgroundColor: palette.emerald500,
    borderRadius: 2,
  },
  micWrapper: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  pulseCircleOuter: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: palette.emerald100,
    opacity: 0.5,
  },
  pulseCircleInner: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: palette.emerald200,
    opacity: 0.7,
  },
  micCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: palette.emerald800,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: palette.emerald900,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  languageHint: {
    fontSize: fontSizes.sm,
    color: colors.light.textMuted,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  stopButton: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  stopIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    borderColor: '#FEE2E2',
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  stopText: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
    color: colors.light.textMuted,
  },
});
