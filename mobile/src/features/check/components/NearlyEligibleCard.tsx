import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { EligibleScheme } from '../models/check.model';
import { spacing } from '@/core/theme/spacing';

interface NearlyEligibleCardProps {
  scheme: EligibleScheme;
  onLearnMore: (scheme: EligibleScheme) => void;
}

function getIcon(schemeId: string): string {
  switch (schemeId) {
    case 'pm-mudra':
      return 'university';
    case 'stand-up-india':
      return 'globe';
    case 'pm-vishwakarma':
      return 'wrench';
    default:
      return 'info-circle';
  }
}

export const NearlyEligibleCard: React.FC<NearlyEligibleCardProps> = ({ scheme, onLearnMore }) => {
  const icon = getIcon(scheme.id);
  const isIncomeNotice = scheme.userConditionValue && scheme.requiredConditionValue;

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.iconCircle}>
          <FontAwesome name={icon as any} size={18} color="#EA580C" />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>{scheme.name}</Text>
          <Text style={styles.subtitle}>{scheme.benefitPeriod || scheme.benefitAmount}</Text>
        </View>
      </View>

      {/* Amber/Rose Notice */}
      <View style={styles.noticeBox}>
        <View style={styles.noticeHeader}>
          <FontAwesome name="clock-o" size={13} color="#C2410C" style={styles.noticeIcon} />
          <Text style={styles.noticeLabel}>
            {isIncomeNotice ? 'Almost there!' : 'Missing condition'}
          </Text>
        </View>
        <Text style={styles.noticeText}>
          {scheme.missingCondition || 'You do not meet one or more conditions.'}
        </Text>
      </View>

      {/* Comparison Grid if available */}
      {scheme.userConditionValue && scheme.requiredConditionValue && (
        <View style={styles.comparisonGrid}>
          <View style={styles.comparisonBox}>
            <Text style={styles.comparisonLabel}>Your details</Text>
            <Text style={styles.comparisonValue}>{scheme.userConditionValue}</Text>
          </View>
          <View style={styles.comparisonBox}>
            <Text style={styles.comparisonLabel}>Required</Text>
            <Text style={styles.comparisonValueRequired}>{scheme.requiredConditionValue}</Text>
          </View>
        </View>
      )}

      {/* Learn More Button */}
      <TouchableOpacity
        style={styles.learnMoreButton}
        onPress={() => onLearnMore(scheme)}
        activeOpacity={0.8}
      >
        <Text style={styles.learnMoreText}>Learn More</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.sm + 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  noticeBox: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  noticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  noticeIcon: {
    marginRight: 6,
  },
  noticeLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  noticeText: {
    fontSize: 12,
    color: '#78350F',
    lineHeight: 17,
  },
  comparisonGrid: {
    flexDirection: 'row',
    gap: spacing.xs + 2,
    marginBottom: spacing.sm,
  },
  comparisonBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: spacing.xs + 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  comparisonLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 2,
  },
  comparisonValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  comparisonValueRequired: {
    fontSize: 13,
    fontWeight: '700',
    color: '#047857',
  },
  learnMoreButton: {
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  learnMoreText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
});
