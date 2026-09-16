import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { SocialCategory } from '../models/check.model';
import { spacing } from '@/core/theme/spacing';

interface CategorySelectorProps {
  selected: SocialCategory;
  onSelect: (cat: SocialCategory) => void;
}

const CATEGORIES: { id: SocialCategory; label: string }[] = [
  { id: 'general', label: 'General' },
  { id: 'obc', label: 'OBC' },
  { id: 'sc', label: 'SC' },
  { id: 'st', label: 'ST' },
  { id: 'ews', label: 'EWS' },
];

export const CategorySelector: React.FC<CategorySelectorProps> = ({ selected, onSelect }) => {
  return (
    <View style={styles.container}>
      {CATEGORIES.map((cat) => {
        const isSelected = selected === cat.id;
        return (
          <TouchableOpacity
            key={cat.id}
            style={[styles.chip, isSelected && styles.chipActive]}
            onPress={() => onSelect(cat.id)}
            activeOpacity={0.7}
          >
            {isSelected && (
              <FontAwesome name="check" size={11} color="#FFFFFF" style={styles.checkIcon} />
            )}
            <Text style={[styles.label, isSelected && styles.labelActive]}>{cat.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.xs + 2,
  },
  chip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  chipActive: {
    backgroundColor: '#065F46',
    borderColor: '#065F46',
  },
  checkIcon: {
    marginRight: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  labelActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
