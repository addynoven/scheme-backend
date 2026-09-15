import React from 'react';
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as Haptics from 'expo-haptics';
import { colors, palette } from '@/core/theme/colors';
import { borderRadius, spacing } from '@/core/theme/spacing';
import { fontSizes } from '@/core/theme/typography';

interface ChatInputBarProps {
  readonly value: string;
  readonly onChangeText: (text: string) => void;
  readonly onSubmit: () => void;
  readonly onVoicePress: () => void;
  readonly onAttachPress?: () => void;
  readonly disabled?: boolean;
}

export function ChatInputBar({
  value,
  onChangeText,
  onSubmit,
  onVoicePress,
  onAttachPress,
  disabled = false,
}: ChatInputBarProps) {
  const hasText = value.trim().length > 0;

  const handleSend = () => {
    if (!hasText || disabled) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSubmit();
  };

  const handleVoice = () => {
    if (disabled) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onVoicePress();
  };

  return (
    <View style={styles.container}>
      {/* Pill Input Wrapper */}
      <View style={styles.pillInput}>
        <TextInput
          style={styles.textInput}
          placeholder="Type your message..."
          placeholderTextColor={colors.light.textSubtle}
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={handleSend}
          returnKeyType="send"
          editable={!disabled}
          accessibilityLabel="Message input"
        />

        {/* Attachment Paperclip Button */}
        {onAttachPress ? (
          <TouchableOpacity
            style={styles.attachButton}
            onPress={onAttachPress}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Attach document"
          >
            <FontAwesome name="paperclip" size={17} color={colors.light.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Voice Mic or Send Arrow Button */}
      {hasText ? (
        <TouchableOpacity
          style={[styles.actionButton, styles.sendButton]}
          onPress={handleSend}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Send message"
        >
          <FontAwesome name="arrow-up" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.actionButton, styles.micButton]}
          onPress={handleVoice}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Start voice input"
        >
          <FontAwesome name="microphone" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.light.surfaceElevated,
    borderTopWidth: 1,
    borderTopColor: colors.light.border,
    gap: spacing.sm,
  },
  pillInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.slate100,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.lg,
    height: 46,
  },
  textInput: {
    flex: 1,
    fontSize: fontSizes.sm,
    color: colors.light.text,
    paddingVertical: 0,
  },
  attachButton: {
    padding: spacing.xs,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: palette.slate900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  micButton: {
    backgroundColor: palette.emerald800,
  },
  sendButton: {
    backgroundColor: palette.emerald700,
  },
});
