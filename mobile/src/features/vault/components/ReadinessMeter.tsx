import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { SchemeReadiness } from '../models/vault.model';
import { palette } from '@/core/theme/colors';
import { spacing } from '@/core/theme/spacing';

interface ReadinessMeterProps {
  readiness: SchemeReadiness;
}

export const ReadinessMeter: React.FC<ReadinessMeterProps> = ({ readiness }) => {
  const is100 = readiness.percentage >= 100 || readiness.isReady;

  // Fix #7: totalCount=0 means no required docs are configured for this scheme
  // (mandatory_total == 0 from backend). Render a clear empty state instead of
  // a broken "0 of 0 documents present" gauge.
  if (readiness.totalCount === 0 && readiness.schemeName !== '') {
    return (
      <View style={[styles.card, styles.cardUnconfigured]}>
        <View style={styles.donutContainer}>
          <View style={[styles.donutOuterRing, styles.donutOuterRingGray]}>
            <View style={styles.donutInnerHole}>
              <Text style={styles.percentageTextGray}>—</Text>
            </View>
          </View>
        </View>
        <View style={styles.infoCol}>
          <Text style={styles.countTextGray}>No requirements</Text>
          <Text style={styles.subtext}>configured for this scheme</Text>
          <View style={[styles.badgePill, styles.badgePillGray]}>
            <Text style={styles.badgeTextGray}>Check back later</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.card, is100 && styles.card100]}>
      <View style={styles.donutContainer}>
        {/* Outer Circular Ring */}
        <View style={[styles.donutOuterRing, is100 && styles.donutOuterRing100]}>
          <View style={styles.donutInnerHole}>
            <Text style={styles.percentageText}>{is100 ? '100%' : `${readiness.percentage}%`}</Text>
          </View>
        </View>
      </View>

      <View style={styles.infoCol}>
        <Text style={styles.countText}>
          {readiness.presentCount} of {readiness.totalCount}
        </Text>
        <Text style={styles.subtext}>documents present</Text>

        <View style={[styles.badgePill, is100 && styles.badgePill100]}>
          {is100 ? (
            <>
              <FontAwesome name="check-circle" size={12} color="#047857" style={{ marginRight: 4 }} />
              <Text style={styles.badgeText100}>All documents ready!</Text>
            </>
          ) : (
            <Text style={styles.badgeText}>Get ready to apply</Text>
          )}
        </View>
      </View>

      {is100 && (
        <View style={styles.sparkleCircle}>
          <FontAwesome name="star" size={16} color="#059669" />
        </View>
      )}
    </View>
  );
};


const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 20,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    marginTop: spacing.xs,
  },
  cardUnconfigured: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },

  card100: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  donutContainer: {
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutOuterRing: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 8,
    borderColor: '#059669',
    borderBottomColor: '#E2E8F0',
    borderLeftColor: '#059669',
    borderRightColor: '#059669',
    borderTopColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  donutOuterRing100: {
    borderColor: '#059669',
    borderBottomColor: '#059669',
  },
  donutInnerHole: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentageText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  infoCol: {
    flex: 1,
    marginLeft: spacing.md,
  },
  countText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtext: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  badgePill: {
    alignSelf: 'flex-start',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  badgePill100: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  badgePillGray: {
    backgroundColor: '#F1F5F9',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
  },
  badgeText100: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
  },
  badgeTextGray: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  donutOuterRingGray: {
    borderColor: '#CBD5E1',
    borderBottomColor: '#CBD5E1',
    borderLeftColor: '#CBD5E1',
    borderRightColor: '#CBD5E1',
    borderTopColor: '#CBD5E1',
  },
  percentageTextGray: {
    fontSize: 18,
    fontWeight: '800',
    color: '#94A3B8',
  },
  countTextGray: {
    fontSize: 16,
    fontWeight: '800',
    color: '#94A3B8',
  },
  sparkleCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.xs,
  },
});

