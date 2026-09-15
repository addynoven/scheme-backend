import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { OtpChannel } from '../models/auth.model';
import { spacing } from '@/core/theme/spacing';
import { palette } from '@/core/theme/colors';

interface OtpChannelSelectorProps {
  selectedChannel: OtpChannel;
  onSelectChannel: (channel: OtpChannel) => void;
  onConfirmChannel: () => void;
  onBack: () => void;
}

export const OtpChannelSelector: React.FC<OtpChannelSelectorProps> = ({
  selectedChannel,
  onSelectChannel,
  onConfirmChannel,
  onBack,
}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backBtn}
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <FontAwesome name="chevron-left" size={14} color="#0F172A" />
      </TouchableOpacity>

      <Text style={styles.title}>Choose how to receive OTP</Text>
      <Text style={styles.subtitle}>
        Select a channel to get your 6-digit verification code.
      </Text>

      {/* Channel 1: WhatsApp */}
      <TouchableOpacity
        style={[
          styles.channelCard,
          selectedChannel === 'whatsapp' && styles.channelCardActive,
        ]}
        onPress={() => onSelectChannel('whatsapp')}
        activeOpacity={0.8}
      >
        <View style={[styles.iconCircle, { backgroundColor: '#DCFCE7' }]}>
          <FontAwesome name="whatsapp" size={22} color="#16A34A" />
        </View>
        <View style={styles.channelInfo}>
          <View style={styles.channelTitleRow}>
            <Text style={styles.channelTitle}>WhatsApp</Text>
            <View style={styles.recommendedBadge}>
              <Text style={styles.recommendedText}>Recommended</Text>
            </View>
          </View>
          <Text style={styles.channelSubtitle}>Fast and reliable</Text>
        </View>
        <View
          style={[
            styles.radioCircle,
            selectedChannel === 'whatsapp' && styles.radioCircleActive,
          ]}
        >
          {selectedChannel === 'whatsapp' ? (
            <FontAwesome name="check" size={12} color="#FFFFFF" />
          ) : null}
        </View>
      </TouchableOpacity>

      {/* Channel 2: SMS */}
      <TouchableOpacity
        style={[
          styles.channelCard,
          selectedChannel === 'sms' && styles.channelCardActive,
        ]}
        onPress={() => onSelectChannel('sms')}
        activeOpacity={0.8}
      >
        <View style={[styles.iconCircle, { backgroundColor: '#E0F2FE' }]}>
          <FontAwesome name="commenting" size={18} color="#0284C7" />
        </View>
        <View style={styles.channelInfo}>
          <Text style={styles.channelTitle}>SMS</Text>
          <Text style={styles.channelSubtitle}>Works on all phones</Text>
        </View>
        <View
          style={[
            styles.radioCircle,
            selectedChannel === 'sms' && styles.radioCircleActive,
          ]}
        >
          {selectedChannel === 'sms' ? (
            <FontAwesome name="check" size={12} color="#FFFFFF" />
          ) : null}
        </View>
      </TouchableOpacity>

      {/* Channel 3: Telegram */}
      <TouchableOpacity
        style={[
          styles.channelCard,
          selectedChannel === 'telegram' && styles.channelCardActive,
        ]}
        onPress={() => onSelectChannel('telegram')}
        activeOpacity={0.8}
      >
        <View style={[styles.iconCircle, { backgroundColor: '#EFF6FF' }]}>
          <FontAwesome name="paper-plane" size={17} color="#2563EB" />
        </View>
        <View style={styles.channelInfo}>
          <Text style={styles.channelTitle}>Telegram</Text>
          <Text style={styles.channelSubtitle}>Send via Telegram</Text>
        </View>
        <View
          style={[
            styles.radioCircle,
            selectedChannel === 'telegram' && styles.radioCircleActive,
          ]}
        >
          {selectedChannel === 'telegram' ? (
            <FontAwesome name="check" size={12} color="#FFFFFF" />
          ) : null}
        </View>
      </TouchableOpacity>

      {/* Confirm Button */}
      <TouchableOpacity
        style={styles.sendOtpBtn}
        onPress={onConfirmChannel}
        activeOpacity={0.85}
      >
        <Text style={styles.sendOtpText}>Send OTP</Text>
      </TouchableOpacity>

      <Text style={styles.helpText}>
        Didn't receive it? You can try a different method.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.sm,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 3,
    marginBottom: spacing.md,
  },
  channelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  channelCardActive: {
    borderColor: palette.emerald600,
    backgroundColor: '#F0FDF4',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  channelInfo: {
    flex: 1,
  },
  channelTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  channelTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  recommendedBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  recommendedText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#166534',
  },
  channelSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: {
    backgroundColor: palette.emerald600,
    borderColor: palette.emerald600,
  },
  sendOtpBtn: {
    backgroundColor: palette.emerald700,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  sendOtpText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  helpText: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
