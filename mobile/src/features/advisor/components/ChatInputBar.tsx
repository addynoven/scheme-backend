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
    paddingTop: spacing.xs + 2,
    paddingBottom: spacing.sm + 2,
    backgroundColor: colors.light.surfaceElevated,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: spacing.sm,
  },
  pillInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: spacing.md + 2,
    height: 52,
  },
  textInput: {
    flex: 1,
    fontSize: fontSizes.sm + 1,
    color: colors.light.text,
    paddingVertical: 0,
  },
  attachButton: {
    padding: spacing.xs,
    marginRight: 2,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: palette.slate900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  micButton: {
    backgroundColor: palette.emerald800,
  },
  sendButton: {
    backgroundColor: palette.emerald700,
  },
});
