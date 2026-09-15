import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { OccupationType } from '../models/check.model';
import { spacing } from '@/core/theme/spacing';

interface OccupationSelectorProps {
  selected: OccupationType;
  onSelect: (occ: OccupationType) => void;
}

const OCCUPATIONS: { id: OccupationType; label: string; icon: string }[] = [
  { id: 'farmer', label: 'Farmer', icon: 'leaf' },
  { id: 'student', label: 'Student', icon: 'graduation-cap' },
  { id: 'artisan', label: 'Artisan', icon: 'wrench' },
  { id: 'salaried', label: 'Salaried', icon: 'briefcase' },
  { id: 'self_employed', label: 'Self-Employed', icon: 'building-o' },
  { id: 'unemployed', label: 'Unemployed', icon: 'user-circle-o' },
];

export const OccupationSelector: React.FC<OccupationSelectorProps> = ({ selected, onSelect }) => {
  return (
    <View style={styles.grid}>
      {OCCUPATIONS.map((item) => {
        const isSelected = selected === item.id;
        return (
          <TouchableOpacity
            key={item.id}
            style={[styles.card, isSelected && styles.cardActive]}
            onPress={() => onSelect(item.id)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconCircle, isSelected && styles.iconCircleActive]}>
              <FontAwesome
                name={item.icon as any}
                size={18}
                color={isSelected ? '#059669' : '#64748B'}
              />
            </View>
            <Text style={[styles.label, isSelected && styles.labelActive]}>{item.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs + 2,
  },
  card: {
    width: '31%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: spacing.md,
    paddingHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  cardActive: {
    borderColor: '#059669',
    backgroundColor: '#F0FDF4',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  iconCircleActive: {
    backgroundColor: '#DCFCE7',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
    textAlign: 'center',
  },
  labelActive: {
    color: '#047857',
    fontWeight: '800',
  },
});
