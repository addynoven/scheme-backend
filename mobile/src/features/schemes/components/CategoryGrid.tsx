import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { SchemeCategory } from '../models/schemes.model';
import { useCategoriesQuery } from '../hooks/useSchemesQuery';
import { spacing } from '@/core/theme/spacing';

interface CategoryGridProps {
  onSelectCategory: (category: SchemeCategory) => void;
}

const CATEGORY_STYLES: Record<
  string,
  { icon: string; iconColor: string; bg: string; id: SchemeCategory }
> = {
  agriculture: { icon: 'leaf', iconColor: '#059669', bg: '#F0FDF4', id: 'agriculture' },
  education: { icon: 'graduation-cap', iconColor: '#7C3AED', bg: '#F5F3FF', id: 'education' },
  health: { icon: 'heartbeat', iconColor: '#E11D48', bg: '#FFF1F2', id: 'health' },
  healthcare: { icon: 'heartbeat', iconColor: '#E11D48', bg: '#FFF1F2', id: 'health' },
  women: { icon: 'female', iconColor: '#DB2777', bg: '#FDF2F8', id: 'women' },
  'women & child': { icon: 'female', iconColor: '#DB2777', bg: '#FDF2F8', id: 'women' },
  msme: { icon: 'briefcase', iconColor: '#0284C7', bg: '#F0F9FF', id: 'msme' },
  'business & finance': { icon: 'briefcase', iconColor: '#0284C7', bg: '#F0F9FF', id: 'msme' },
  'social welfare': { icon: 'users', iconColor: '#D97706', bg: '#FFFBEB', id: 'more' },
  'employment & skills': { icon: 'cogs', iconColor: '#4F46E5', bg: '#EEF2FF', id: 'more' },
  housing: { icon: 'home', iconColor: '#0D9488', bg: '#F0FDFA', id: 'more' },
};

export const CategoryGrid: React.FC<CategoryGridProps> = ({ onSelectCategory }) => {
  const { data: serverCategories } = useCategoriesQuery();

  const totalSchemes = (serverCategories || []).reduce((acc, curr) => acc + curr.count, 0);

  const cards = [
    {
      key: 'all',
      id: 'all' as SchemeCategory,
      title: 'All Schemes',
      count: totalSchemes > 0 ? `${totalSchemes}+` : 'Browse',
      icon: 'th-large',
      iconColor: '#047857',
      bg: '#ECFDF5',
    },
    ...(serverCategories || []).slice(0, 5).map((cat) => {
      const lower = cat.category.toLowerCase().trim();
      const styleMeta = CATEGORY_STYLES[lower] || {
        icon: 'folder-open',
        iconColor: '#64748B',
        bg: '#F8FAFC',
        id: 'more' as SchemeCategory,
      };

      return {
        key: cat.category,
        id: cat.category as SchemeCategory,
        title: cat.category,
        count: `${cat.count} schemes`,
        icon: styleMeta.icon,
        iconColor: styleMeta.iconColor,
        bg: styleMeta.bg,
      };
    }),
  ];

  return (
    <View style={styles.grid}>
      {cards.map((cat) => (
        <TouchableOpacity
          key={cat.key}
          style={[styles.card, { backgroundColor: cat.bg }]}
          onPress={() => onSelectCategory(cat.id)}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`Browse ${cat.title}`}
        >
          <View style={[styles.iconCircle, { backgroundColor: '#FFFFFF' }]}>
            <FontAwesome name={cat.icon as any} size={18} color={cat.iconColor} />
          </View>
          <Text style={styles.title} numberOfLines={1}>
            {cat.title}
          </Text>
          <Text style={styles.count}>{cat.count}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  card: {
    width: '31%',
    borderRadius: 16,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
  },
  count: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
});
