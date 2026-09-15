import React from 'react';
import {
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSchemesStore } from '../store/useSchemesStore';
import { spacing } from '@/core/theme/spacing';
import { palette } from '@/core/theme/colors';

export const ContinueJourneyScreen: React.FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string }>();

  const scheme = {
    id: params.id || 'pm-kisan-samman-nidhi',
    title: 'PM Kisan Samman Nidhi',
    officialUrl: 'https://pmkisan.gov.in',
  };


  const { bookmarkedIds, toggleBookmark } = useSchemesStore();
  const isBookmarked = bookmarkedIds.has(scheme.id);

  const handleApplyOnline = () => {
    if (scheme.officialUrl) {
      Linking.openURL(scheme.officialUrl).catch(() => {});
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <FontAwesome name="chevron-left" size={16} color="#0F172A" />
        </TouchableOpacity>

        <Text style={styles.headerTitle} numberOfLines={1}>
          {scheme.title}
        </Text>

        <TouchableOpacity
          style={styles.bookmarkBtn}
          onPress={() => toggleBookmark(scheme.id, scheme.title)}
          accessibilityRole="button"
          accessibilityLabel={isBookmarked ? 'Bookmarked' : 'Bookmark'}
        >
          <FontAwesome
            name={isBookmarked ? 'bookmark' : 'bookmark-o'}
            size={18}
            color={isBookmarked ? palette.emerald700 : '#64748B'}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Farmer Hero Graphic & Sunburst */}
        <View style={styles.heroWrapper}>
          <View style={styles.sunburstBg} />
          <Image
            source={require('@/../assets/schemes/farmer_turban.png')}
            style={styles.heroImage}
            resizeMode="contain"
          />
          <View style={styles.leafFloatLeft}>
            <FontAwesome name="leaf" size={18} color="#10B981" />
          </View>
          <View style={styles.leafFloatRight}>
            <FontAwesome name="pagelines" size={20} color="#059669" />
          </View>
        </View>

        {/* Headlines */}
        <View style={styles.textSection}>
          <Text style={styles.mainHeading}>
            You're one step closer{'\n'}to new opportunities.
          </Text>
          <Text style={styles.subHeading}>
            Choose how you would like to proceed with your benefit
          </Text>
        </View>

        {/* 4 Action Cards */}
        <View style={styles.actionsContainer}>
          {/* Action 1: Check Eligibility */}
          <TouchableOpacity
            style={styles.primaryAction}
            onPress={() => router.push('/(tabs)/check')}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Check My Eligibility"
          >
            <View style={styles.actionIconCirclePrimary}>
              <FontAwesome name="check-circle" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.actionTextCol}>
              <Text style={styles.primaryActionTitle}>Check My Eligibility</Text>
              <Text style={styles.primaryActionSubtitle}>See if you qualify</Text>
            </View>
            <FontAwesome name="arrow-right" size={16} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Action 2: Apply Online */}
          <TouchableOpacity
            style={styles.secondaryAction}
            onPress={handleApplyOnline}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Apply Online"
          >
            <View style={[styles.actionIconCircleSecondary, { backgroundColor: '#ECFDF5' }]}>
              <FontAwesome name="external-link" size={16} color={palette.emerald700} />
            </View>
            <View style={styles.actionTextCol}>
              <Text style={styles.secondaryActionTitle}>Apply Online</Text>
              <Text style={styles.secondaryActionSubtitle}>Go to official portal</Text>
            </View>
            <FontAwesome name="chevron-right" size={13} color="#94A3B8" />
          </TouchableOpacity>

          {/* Action 3: Ask in Chat */}
          <TouchableOpacity
            style={styles.secondaryAction}
            onPress={() => router.push('/(tabs)')}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Ask in Chat"
          >
            <View style={[styles.actionIconCircleSecondary, { backgroundColor: '#EFF6FF' }]}>
              <FontAwesome name="comments" size={16} color="#2563EB" />
            </View>
            <View style={styles.actionTextCol}>
              <Text style={styles.secondaryActionTitle}>Ask in Chat</Text>
              <Text style={styles.secondaryActionSubtitle}>Get AI guidance</Text>
            </View>
            <FontAwesome name="chevron-right" size={13} color="#94A3B8" />
          </TouchableOpacity>

          {/* Action 4: Save for later */}
          <TouchableOpacity
            style={styles.secondaryAction}
            onPress={() => toggleBookmark(scheme.id, scheme.title)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Save for later"
          >
            <View style={[styles.actionIconCircleSecondary, { backgroundColor: '#FEF3C7' }]}>
              <FontAwesome name="bookmark" size={16} color="#D97706" />
            </View>
            <View style={styles.actionTextCol}>
              <Text style={styles.secondaryActionTitle}>Save for later</Text>
              <Text style={styles.secondaryActionSubtitle}>
                {isBookmarked ? 'Saved in Your Schemes' : 'Save this scheme for later'}
              </Text>
            </View>
            <FontAwesome
              name={isBookmarked ? 'check' : 'plus'}
              size={13}
              color={isBookmarked ? palette.emerald700 : '#94A3B8'}
            />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginHorizontal: spacing.sm,
  },
  bookmarkBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  heroWrapper: {
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    position: 'relative',
  },
  sunburstBg: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: '#FEF3C7',
    opacity: 0.6,
  },
  heroImage: {
    width: 130,
    height: 130,
    borderRadius: 65,
  },
  leafFloatLeft: {
    position: 'absolute',
    left: 40,
    top: 30,
  },
  leafFloatRight: {
    position: 'absolute',
    right: 40,
    bottom: 25,
  },
  textSection: {
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  mainHeading: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    lineHeight: 28,
  },
  subHeading: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
  },
  actionsContainer: {
    gap: spacing.sm,
  },
  primaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.emerald700,
    borderRadius: 16,
    padding: spacing.md,
    shadowColor: palette.emerald700,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  actionIconCirclePrimary: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  actionTextCol: {
    flex: 1,
  },
  primaryActionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  primaryActionSubtitle: {
    fontSize: 11,
    color: '#D1FAE5',
    marginTop: 2,
  },
  secondaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionIconCircleSecondary: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  secondaryActionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  secondaryActionSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
});
