import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { colors, palette } from '@/core/theme/colors';
import { borderRadius, spacing } from '@/core/theme/spacing';
import { fontSizes, fontWeights } from '@/core/theme/typography';
import type { ChatMessage } from '../models/advisor.model';
import { SchemeRecommendationCard } from './SchemeRecommendationCard';

interface MessageBubbleProps {
  readonly message: ChatMessage;
  readonly onSchemePress: (schemeId: string) => void;
  readonly onVaultPress: () => void;
  readonly onFollowUpPress?: (text: string) => void;
  readonly onViewAllPress?: () => void;
}

function formatAiMessageText(text: string, hasRecommendations: boolean): string {
  if (!text) return '';

  let cleaned = text;

  // When rich recommendation cards are rendered below, remove redundant scheme list items
  // e.g. "1. 🇮🇳 **Central / National Scheme**: [PM ...](/schemes/...) - Description..."
  if (hasRecommendations) {
    cleaned = cleaned.replace(
      /^\s*(?:\d+\.|\*|\-)\s*(?:[^\n]*?)\[([^\]]+)\]\(\/schemes\/[^\)]+\)[^\n]*\n?/gim,
      ''
    );
  }

  // Strip raw markdown links [Text](url) -> Text so raw URLs/slugs never leak
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');

  // Clean up excess newlines
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();

  return cleaned;
}

export function MessageBubble({
  message,
  onSchemePress,
  onVaultPress,
  onFollowUpPress,
  onViewAllPress,
}: MessageBubbleProps) {
  const isUser = message.sender === 'user';

  if (isUser) {
    return (
      <View style={styles.userContainer}>
        <View style={styles.userBubble}>
          <Text style={styles.userText}>{message.text}</Text>
        </View>
        <View style={styles.userMetaRow}>
          <Text style={styles.timestampText}>{message.timestamp}</Text>
          <FontAwesome name="check" size={10} color={palette.emerald600} />
        </View>
      </View>
    );
  }

  const hasRecs = Boolean(message.recommendations && message.recommendations.length > 0);
  const formattedText = formatAiMessageText(message.text, hasRecs);

  return (
    <View style={styles.aiContainer}>
      {/* Bot Avatar */}
      <View style={styles.aiAvatar}>
        <FontAwesome name="android" size={14} color="#FFFFFF" />
      </View>

      {/* Bubble Content */}
      <View style={styles.aiBubble}>
        {formattedText ? <Text style={styles.aiText}>{formattedText}</Text> : null}

        {/* Structured Recommendations Section */}
        {hasRecs ? (
          <View style={styles.recommendationsSection}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionHeaderLeft}>
                <FontAwesome name="bookmark" size={11} color={palette.emerald700} />
                <Text style={styles.sectionTitle}>TOP MATCHES</Text>
              </View>
              <View style={styles.matchCountBadge}>
                <Text style={styles.matchCountText}>{message.recommendations!.length} Recommended</Text>
              </View>
            </View>

            <View style={styles.recommendationsList}>
              {message.recommendations!.map((scheme) => (
                <SchemeRecommendationCard
                  key={scheme.id}
                  scheme={scheme}
                  onPress={onSchemePress}
                />
              ))}
            </View>

            {onViewAllPress ? (
              <TouchableOpacity
                style={styles.viewAllBtn}
                onPress={onViewAllPress}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="View all matching schemes in directory"
              >
                <Text style={styles.viewAllText}>View All Schemes in Directory</Text>
                <FontAwesome name="arrow-right" size={11} color={palette.emerald800} />
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        {/* Document Requirements Checklist (Frame 6) */}
        {message.documents && message.documents.length > 0 ? (
          <View style={styles.documentsContainer}>
            <View style={styles.docList}>
              {message.documents.map((doc, idx) => (
                <View key={doc.id} style={styles.docItem}>
                  <Text style={styles.docIndex}>{idx + 1}</Text>
                  <Text style={styles.docName}>{doc.name}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.docSubtext}>
              You can upload these to your Vault and reuse them for multiple schemes.
            </Text>
            <TouchableOpacity
              style={styles.vaultButton}
              onPress={onVaultPress}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Open Document Vault"
            >
              <FontAwesome name="folder-open" size={13} color={palette.emerald800} />
              <Text style={styles.vaultButtonText}>Open Document Vault</Text>
              <Text style={styles.vaultArrow}>→</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Bullet Points List (Frame 6) */}
        {message.bullets && message.bullets.length > 0 ? (
          <View style={styles.bulletsContainer}>
            {message.bullets.map((bullet, idx) => (
              <View key={idx} style={styles.bulletItem}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>{bullet}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Sources Footer matching Frame 4 - only show if no recommendation cards exist */}
        {message.sources && message.sources.length > 0 && !hasRecs ? (
          <View style={styles.sourcesContainer}>
            <Text style={styles.sourcesLabel}>Sources: </Text>
            <Text style={styles.sourcesText}>
              {message.sources
                .map((s) => s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()))
                .join(' | ')}
            </Text>
          </View>
        ) : null}

        {/* Suggested Follow-up Actions */}
        {message.suggestedFollowUps && message.suggestedFollowUps.length > 0 ? (
          <View style={styles.followUpsContainer}>
            {message.suggestedFollowUps.map((followUp) => (
              <TouchableOpacity
                key={followUp}
                style={styles.followUpChip}
                onPress={() => onFollowUpPress?.(followUp)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={followUp}
              >
                <Text style={styles.followUpText}>{followUp}</Text>
                <FontAwesome name="arrow-right" size={10} color={palette.emerald800} />
              </TouchableOpacity>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  userContainer: {
    alignSelf: 'flex-end',
    maxWidth: '82%',
    marginBottom: spacing.md,
  },
  userBubble: {
    backgroundColor: colors.light.userBubble,
    borderColor: colors.light.userBubbleBorder,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    borderTopRightRadius: 2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  userText: {
    fontSize: fontSizes.sm,
    color: palette.slate900,
    lineHeight: 20,
  },
  userMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.xs,
    marginTop: 2,
    paddingRight: 2,
  },
  timestampText: {
    fontSize: fontSizes.xs - 2,
    color: colors.light.textSubtle,
  },
  aiContainer: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    maxWidth: '88%',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  aiAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: palette.emerald700,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  aiBubble: {
    flex: 1,
    backgroundColor: colors.light.surfaceElevated,
    borderColor: colors.light.border,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    borderTopLeftRadius: 2,
    padding: spacing.md,
    gap: spacing.sm,
  },
  aiText: {
    fontSize: fontSizes.sm,
    color: colors.light.text,
    lineHeight: 20,
  },
  recommendationsSection: {
    marginTop: spacing.xs,
    backgroundColor: '#F8FAFC',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
    paddingHorizontal: 2,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: fontSizes.xs - 1,
    fontWeight: fontWeights.bold,
    color: palette.emerald800,
    letterSpacing: 0.6,
  },
  matchCountBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
  },
  matchCountText: {
    fontSize: fontSizes.xs - 2,
    fontWeight: fontWeights.semibold,
    color: palette.emerald700,
  },
  recommendationsList: {
    gap: 2,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.xs + 2,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  viewAllText: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
    color: palette.emerald800,
  },
  documentsContainer: {
    backgroundColor: palette.slate50,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: palette.slate200,
    gap: spacing.xs,
  },
  docsHeading: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    color: palette.slate700,
    marginBottom: 2,
  },
  docList: {
    gap: 4,
  },
  docItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  docIndex: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    color: palette.slate900,
    width: 14,
  },
  docName: {
    fontSize: fontSizes.xs,
    color: palette.slate800,
    flex: 1,
  },
  docSubtext: {
    fontSize: fontSizes.xs - 1,
    color: colors.light.textMuted,
    lineHeight: 15,
    marginTop: 2,
  },
  vaultButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.emerald50,
    borderColor: palette.emerald600,
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  vaultButtonText: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
    color: palette.emerald800,
  },
  vaultArrow: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    color: palette.emerald800,
  },
  sourcesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderTopWidth: 1,
    borderTopColor: palette.slate100,
    paddingTop: spacing.xs,
  },
  sourcesLabel: {
    fontSize: fontSizes.xs - 2,
    fontWeight: fontWeights.bold,
    color: colors.light.textMuted,
  },
  sourcesText: {
    fontSize: fontSizes.xs - 2,
    color: palette.emerald700,
  },
  bulletsContainer: {
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs + 2,
  },
  bulletDot: {
    fontSize: fontSizes.sm,
    color: palette.emerald800,
    lineHeight: 18,
  },
  bulletText: {
    flex: 1,
    fontSize: fontSizes.xs,
    color: palette.slate800,
    lineHeight: 18,
  },
  followUpsContainer: {
    flexDirection: 'column',
    gap: spacing.xs,
    marginTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: palette.slate100,
    paddingTop: spacing.xs,
  },
  followUpChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: palette.emerald50,
    paddingVertical: spacing.xs + 1,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: palette.emerald200,
  },
  followUpText: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.medium,
    color: palette.emerald900,
    flex: 1,
    marginRight: spacing.xs,
  },
});
