import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { palette } from '@/core/theme/colors';
import { spacing } from '@/core/theme/spacing';

interface SearchDefaultCategoriesProps {
  readonly onSelectCategory: (categoryId: string) => void;
  readonly onAskInChat: () => void;
}

interface CategoryItem {
  readonly id: string;
  readonly name: string;
  readonly iconName: React.ComponentProps<typeof FontAwesome>['name'];
  readonly iconColor: string;
  readonly bgColor: string;
}

const POPULAR_CATEGORIES: readonly CategoryItem[] = [
  { id: 'agriculture', name: 'Farmers', iconName: 'leaf', iconColor: '#16A34A', bgColor: '#DCFCE7' },
  { id: 'education', name: 'Students', iconName: 'graduation-cap', iconColor: '#2563EB', bgColor: '#DBEAFE' },
  { id: 'women', name: 'Women', iconName: 'user', iconColor: '#E11D48', bgColor: '#FFE4E6' },
  { id: 'senior', name: 'Senior Citizens', iconName: 'street-view', iconColor: '#4F46E5', bgColor: '#EEF2FF' },
  { id: 'msme', name: 'MSMEs', iconName: 'building-o', iconColor: '#0284C7', bgColor: '#E0F2FE' },
  { id: 'health', name: 'Health', iconName: 'heart', iconColor: '#DC2626', bgColor: '#FEE2E2' },
  { id: 'housing', name: 'Housing', iconName: 'home', iconColor: '#059669', bgColor: '#D1FAE5' },
  { id: 'employment', name: 'Employment', iconName: 'briefcase', iconColor: '#0369A1', bgColor: '#BAE6FD' },
];

export function SearchDefaultCategories({
  onSelectCategory,
  onAskInChat,
}: SearchDefaultCategoriesProps) {
  return (
    <View style={styles.container}>
      {/* Section Header */}
      <Text style={styles.sectionTitle}>Popular Categories</Text>

      {/* 8 Categories Grid */}
      <View style={styles.grid}>
        {POPULAR_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={styles.categoryCard}
            onPress={() => onSelectCategory(cat.id)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={cat.name}
          >
            <View style={[styles.iconBox, { backgroundColor: cat.bgColor }]}>
              <FontAwesome name={cat.iconName} size={20} color={cat.iconColor} />
            </View>
            <Text style={styles.categoryName} numberOfLines={1}>
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* AI Advisor Prompt Card */}
      <View style={styles.promptCard}>
        <View style={styles.promptContent}>
          <Image
            source={require('@/../assets/schemes/farmer_turban.png')}
            style={styles.promptAvatar}
          />
          <View style={styles.promptTextContainer}>
            <Text style={styles.promptTitle}>Not sure what to look for?</Text>
            <Text style={styles.promptSubtitle}>
              Browse categories or ask our AI Advisor for personalized suggestions.
            </Text>

            <TouchableOpacity
              style={styles.askInChatButton}
              onPress={onAskInChat}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Ask in Chat"
            >
              <Text style={styles.askInChatText}>Ask in Chat</Text>
              <FontAwesome name="arrow-right" size={12} color="#0D7A5F" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: spacing.xl,
  },
  categoryCard: {
    width: '22.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center',
  },
  promptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  promptContent: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  promptAvatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#DCFCE7',
  },
  promptTextContainer: {
    flex: 1,
  },
  promptTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 3,
  },
  promptSubtitle: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
    marginBottom: spacing.sm,
  },
  askInChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  askInChatText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0D7A5F',
  },
});
