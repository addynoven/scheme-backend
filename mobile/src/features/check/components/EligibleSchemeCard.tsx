import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { EligibleScheme } from '../models/check.model';
import { spacing } from '@/core/theme/spacing';

interface EligibleSchemeCardProps {
  scheme: EligibleScheme;
  onApply: (scheme: EligibleScheme) => void;
  onViewDetails: (scheme: EligibleScheme) => void;
}

function getSchemeIcon(schemeId: string): string {
  switch (schemeId) {
    case 'pm-kisan':
      return 'leaf';
    case 'pm-ujjwala':
      return 'fire';
    case 'ayushman-bharat':
      return 'heartbeat';
    case 'pm-fasal-bima':
      return 'shield';
    case 'kisan-credit-card':
      return 'credit-card';
    case 'obc-scholarship':
      return 'graduation-cap';
    default:
      return 'file-text-o';
  }
}

export const EligibleSchemeCard: React.FC<EligibleSchemeCardProps> = ({
  scheme,
  onApply,
  onViewDetails,
}) => {
  const iconName = getSchemeIcon(scheme.id);

  return (
    <View style={styles.card}>
      {/* Header Info */}
      <View style={styles.headerRow}>
        <View style={styles.iconCircle}>
          <FontAwesome name={iconName as any} size={18} color="#047857" />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title} numberOfLines={1}>
            {scheme.name}
          </Text>
          <Text style={styles.ministry} numberOfLines={1}>
            {scheme.ministry}
          </Text>
          <Text style={styles.benefitText}>
            {scheme.benefitAmount}{' '}
            <Text style={styles.benefitPeriod}>{scheme.benefitPeriod}</Text>
          </Text>
        </View>
      </View>

      {/* Match Checklist */}
      {scheme.matchReasons.length > 0 && (
        <View style={styles.matchList}>
          {scheme.matchReasons.map((reason, idx) => (
            <View key={idx} style={styles.matchRow}>
              <FontAwesome name="check" size={11} color="#059669" style={styles.checkIcon} />
              <Text style={styles.matchText}>{reason}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.applyButton}
          onPress={() => onApply(scheme)}
          activeOpacity={0.8}
        >
          <Text style={styles.applyButtonText}>Apply Online</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.detailsButton}
          onPress={() => onViewDetails(scheme)}
          activeOpacity={0.8}
        >
          <Text style={styles.detailsButtonText}>View Details</Text>
        </TouchableOpacity>
      </View>
    </View>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  ministry: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  benefitText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#047857',
    marginTop: 4,
  },
  benefitPeriod: {
    fontSize: 11,
    fontWeight: '500',
    color: '#065F46',
  },
  matchList: {
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 5,
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkIcon: {
    marginRight: 6,
  },
  matchText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  applyButton: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#065F46',
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  detailsButton: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsButtonText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '600',
  },
});
