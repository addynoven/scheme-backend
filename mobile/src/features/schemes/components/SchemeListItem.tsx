import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { SchemeItem } from '../models/schemes.model';
import { spacing } from '@/core/theme/spacing';
import { palette } from '@/core/theme/colors';

interface SchemeListItemProps {
  scheme: SchemeItem;
  onPress: (schemeId: string) => void;
  onToggleBookmark: (schemeId: string, schemeTitle: string) => void;
}

export const SchemeListItem: React.FC<SchemeListItemProps> = ({
  scheme,
  onPress,
  onToggleBookmark,
}) => {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(scheme.id)}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`View details for ${scheme.title}`}
    >
      <View style={styles.topRow}>
        {/* Left Icon */}
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: scheme.iconBg || '#DCFCE7' },
          ]}
        >
          <FontAwesome
            name={(scheme.iconName as any) || 'leaf'}
            size={18}
            color={scheme.iconColor || '#166534'}
          />
        </View>

        {/* Middle Info */}
        <View style={styles.infoCol}>
          <Text style={styles.title} numberOfLines={1}>
            {scheme.title}
          </Text>
          <Text style={styles.ministry} numberOfLines={1}>
            {scheme.ministry}
          </Text>
          {scheme.benefitAmount ? (
            <Text style={styles.benefitAmount} numberOfLines={1}>
              {scheme.benefitAmount}
            </Text>
          ) : null}
        </View>

        {/* Right Bookmark Button */}
        <TouchableOpacity
          style={styles.bookmarkBtn}
          onPress={() => onToggleBookmark(scheme.id, scheme.title)}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel={scheme.isBookmarked ? 'Remove bookmark' : 'Bookmark scheme'}
        >
          <FontAwesome
            name={scheme.isBookmarked ? 'bookmark' : 'bookmark-o'}
            size={20}
            color={scheme.isBookmarked ? palette.emerald700 : '#94A3B8'}
          />
        </TouchableOpacity>
      </View>

      {/* Tags Row */}
      <View style={styles.tagsRow}>
        {scheme.tags.map((tag, idx) => (
          <View
            key={idx}
            style={[
              styles.tagPill,
              tag.toLowerCase().includes('grant') && styles.tagGrant,
              tag.toLowerCase().includes('subsidy') && styles.tagSubsidy,
              tag.toLowerCase().includes('loan') && styles.tagLoan,
            ]}
          >
            <Text
              style={[
                styles.tagText,
                tag.toLowerCase().includes('grant') && styles.tagTextGrant,
                tag.toLowerCase().includes('subsidy') && styles.tagTextSubsidy,
                tag.toLowerCase().includes('loan') && styles.tagTextLoan,
              ]}
            >
              {tag}
            </Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  infoCol: {
    flex: 1,
    paddingRight: spacing.xs,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 18,
  },
  ministry: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  benefitAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: palette.emerald700,
    marginTop: 3,
  },
  bookmarkBtn: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: spacing.sm,
  },
  tagPill: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  tagText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
  },
  tagGrant: {
    backgroundColor: '#FEF3C7',
  },
  tagTextGrant: {
    color: '#92400E',
  },
  tagSubsidy: {
    backgroundColor: '#FFEDD5',
  },
  tagTextSubsidy: {
    color: '#9A3412',
  },
  tagLoan: {
    backgroundColor: '#E0E7FF',
  },
  tagTextLoan: {
    color: '#3730A3',
  },
});
