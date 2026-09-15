import React from 'react';
import {
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { spacing } from '@/core/theme/spacing';

interface NetworkFailureModalProps {
  readonly visible: boolean;
  readonly title?: string;
  readonly message?: string;
  readonly onTryAgain: () => void;
  readonly onUseOfflineMode: () => void;
  readonly onClose: () => void;
}

export function NetworkFailureModal({
  visible,
  title = 'Connection Problem',
  message = "We couldn't connect to our servers. Please check your internet connection and try again.",
  onTryAgain,
  onUseOfflineMode,
  onClose,
}: NetworkFailureModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.scrim}>
        <View style={styles.card}>
          {/* Header Close */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <FontAwesome name="times" size={16} color="#64748B" />
          </TouchableOpacity>

          {/* Wi-Fi Alert Graphic */}
          <View style={styles.iconContainer}>
            <View style={styles.wifiCircle}>
              <FontAwesome name="wifi" size={44} color="#0D7A5F" />
              <View style={styles.alertBadge}>
                <FontAwesome name="exclamation" size={14} color="#FFFFFF" />
              </View>
            </View>
          </View>

          {/* Title & Subtitle */}
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          {/* Action Buttons */}
          <TouchableOpacity
            style={styles.tryAgainButton}
            onPress={onTryAgain}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Try Again"
          >
            <Text style={styles.tryAgainText}>Try Again</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.offlineButton}
            onPress={onUseOfflineMode}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Use Offline Mode"
          >
            <Text style={styles.offlineText}>Use Offline Mode</Text>
          </TouchableOpacity>

          {/* Village Landscape Footer */}
          <View style={styles.landscapeContainer}>
            <Image
              source={require('@/../assets/onboarding/landscape_footer.png')}
              style={styles.landscapeImage}
              resizeMode="cover"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  iconContainer: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  wifiCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F0FDF4',
    borderWidth: 2,
    borderColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  alertBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#DC2626',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  message: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.sm,
  },
  tryAgainButton: {
    width: '100%',
    backgroundColor: '#0D7A5F',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    shadowColor: '#0D7A5F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  tryAgainText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  offlineButton: {
    width: '100%',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  offlineText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#334155',
  },
  landscapeContainer: {
    width: '100%',
    height: 70,
    marginTop: spacing.xs,
    overflow: 'hidden',
  },
  landscapeImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
});
