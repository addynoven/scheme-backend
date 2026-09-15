import React, { useState } from 'react';
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
import { useLocalSearchParams, useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as Haptics from 'expo-haptics';
import { colors, palette } from '@/core/theme/colors';
import { borderRadius, spacing } from '@/core/theme/spacing';
import { fontSizes, fontWeights } from '@/core/theme/typography';
import { toastService } from '@/core/components/Toast';
import { useSchemesStore } from '@/features/schemes/store/useSchemesStore';
import { useSchemeDetailQuery } from '@/features/schemes/hooks/useSchemesQuery';
import { SchemeItem } from '@/features/schemes/models/schemes.model';

type DetailTab = 'overview' | 'eligibility' | 'documents' | 'faq';

export default function SchemeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const { bookmarkedIds, toggleBookmark } = useSchemesStore();
  const { data: serverScheme } = useSchemeDetailQuery(id || '');

  const fallbackScheme: SchemeItem = {
    id: id || 'pm-kisan-samman-nidhi',
    title: 'PM Kisan Samman Nidhi',
    ministry: 'Ministry of Agriculture & Farmers Welfare',
    benefitAmount: '₹6,000 / year',
    benefitSummary: 'Direct income support of ₹6,000 per year to eligible farmers, provided in three equal installments of ₹2,000 each.',
    jurisdiction: 'All India',
    category: 'agriculture',
    benefitType: 'cash_grant',
    tags: ['All India', 'Cash Grant', 'Active'],
    description: 'Under PM-KISAN, financial assistance of ₹6,000 per annum is provided to all landholding farmer families across the country in three equal installments of ₹2,000 every four months through Direct Benefit Transfer (DBT).',
    launchDate: '1 Dec 2018',
    officialUrl: 'https://pmkisan.gov.in',
    isBookmarked: false,
    eligibilityRules: [],
    requiredDocuments: [],
    officialSources: [],
  };

  const scheme: SchemeItem = serverScheme || fallbackScheme;

  const isSaved = bookmarkedIds.has(scheme.id);

  const handleToggleSave = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleBookmark(scheme.id, scheme.title);
  };

  const handleCheckEligibility = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/schemes/journey',
      params: { id: scheme.id },
    });
  };

  const handleAskInChat = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(tabs)');
  };

  const handleOpenUrl = () => {
    if (scheme.officialUrl) {
      Linking.openURL(scheme.officialUrl).catch(() => {});
    }
  };

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top }]}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <FontAwesome name="chevron-left" size={16} color={colors.light.text} />
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={handleToggleSave}
            accessibilityRole="button"
            accessibilityLabel="Bookmark scheme"
          >
            <FontAwesome
              name={isSaved ? 'bookmark' : 'bookmark-o'}
              size={20}
              color={isSaved ? palette.emerald700 : colors.light.text}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => toastService.show('Scheme link copied to clipboard', 'info')}
            accessibilityRole="button"
            accessibilityLabel="Share scheme"
          >
            <FontAwesome name="share-alt" size={18} color={colors.light.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Hero Landscape Banner with Farmer Artwork */}
        <View style={styles.heroBanner}>
          <Image
            source={require('@/../assets/schemes/farmer_field_banner.png')}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={styles.govBadgeOverlay}>
            <Text style={styles.govBadgeText}>Central Scheme</Text>
          </View>
        </View>

        {/* Title & Ministry */}
        <Text style={styles.titleText}>{scheme.title}</Text>
        <Text style={styles.ministryText}>{scheme.ministry}</Text>

        {/* Tag Pills */}
        <View style={styles.tagsRow}>
          {scheme.tags?.map((tag, idx) => (
            <View key={idx} style={styles.tagPill}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabsContainer}>
          {(['overview', 'eligibility', 'documents', 'faq'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Contents */}
        {activeTab === 'overview' ? (
          <View style={styles.sectionBody}>
            {/* Benefit Box */}
            <View style={styles.benefitCard}>
              <View style={styles.benefitIconCircle}>
                <FontAwesome name="check" size={14} color="#FFFFFF" />
              </View>
              <View style={styles.benefitTextCol}>
                <Text style={styles.benefitAmount}>
                  {scheme.benefitAmount || 'Financial Support'}
                </Text>
                <Text style={styles.benefitNote}>{scheme.benefitSummary}</Text>
              </View>
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.cardHeader}>About the Scheme</Text>
              <Text style={styles.bodyParagraph}>{scheme.description}</Text>
            </View>

            {/* Scheme Metadata list */}
            <View style={styles.metaCard}>
              <View style={styles.metaRowItem}>
                <FontAwesome
                  name="calendar"
                  size={15}
                  color={colors.light.textMuted}
                  style={styles.metaIcon}
                />
                <View style={styles.metaTextCol}>
                  <Text style={styles.metaLabel}>Launch Date</Text>
                  <Text style={styles.metaValue}>{scheme.launchDate || '1 Dec 2018'}</Text>
                </View>
              </View>

              <View style={styles.metaRowItem}>
                <FontAwesome
                  name="map-marker"
                  size={16}
                  color={colors.light.textMuted}
                  style={styles.metaIcon}
                />
                <View style={styles.metaTextCol}>
                  <Text style={styles.metaLabel}>Applicable Across</Text>
                  <Text style={styles.metaValue}>{scheme.jurisdiction || 'All India'}</Text>
                </View>
              </View>

              {scheme.officialUrl ? (
                <View style={styles.metaRowItem}>
                  <FontAwesome
                    name="globe"
                    size={16}
                    color={palette.emerald700}
                    style={styles.metaIcon}
                  />
                  <View style={styles.metaTextCol}>
                    <Text style={styles.metaLabel}>Official Website</Text>
                    <TouchableOpacity onPress={handleOpenUrl}>
                      <Text style={styles.websiteLink}>{scheme.officialUrl}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : null}
            </View>
          </View>
        ) : activeTab === 'eligibility' ? (
          <View style={styles.sectionBody}>
            <View style={styles.infoCard}>
              <Text style={styles.cardHeader}>Eligibility Criteria</Text>
              {scheme.eligibilityRules && scheme.eligibilityRules.length > 0 ? (
                scheme.eligibilityRules.map((rule, idx) => (
                  <View key={idx} style={styles.checkItem}>
                    <FontAwesome name="check-circle" size={16} color={palette.emerald600} />
                    <View style={styles.checkItemCol}>
                      <Text style={styles.checkItemTitle}>
                        {rule.field_name.charAt(0).toUpperCase() + rule.field_name.slice(1).replace('_', ' ')}: {rule.rule_value}
                      </Text>
                      <Text style={styles.checkItemSubtitle}>Condition: {rule.operator.toUpperCase()}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.checkItem}>
                  <FontAwesome name="check-circle" size={16} color={palette.emerald600} />
                  <Text style={styles.checkItemText}>Open to eligible citizens meeting residency & income guidelines.</Text>
                </View>
              )}
            </View>
          </View>
        ) : activeTab === 'documents' ? (
          <View style={styles.sectionBody}>
            <View style={styles.infoCard}>
              <Text style={styles.cardHeader}>Required Documents</Text>
              {scheme.requiredDocuments && scheme.requiredDocuments.length > 0 ? (
                scheme.requiredDocuments.map((doc, idx) => (
                  <View key={idx} style={styles.checkItem}>
                    <FontAwesome name="file-text-o" size={15} color={palette.emerald700} />
                    <View style={styles.checkItemCol}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.checkItemTitle}>{doc.document_name}</Text>
                        {doc.is_mandatory && (
                          <View style={styles.mandatoryBadge}>
                            <Text style={styles.mandatoryBadgeText}>Required</Text>
                          </View>
                        )}
                      </View>
                      {doc.description ? <Text style={styles.checkItemSubtitle}>{doc.description}</Text> : null}
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.checkItem}>
                  <FontAwesome name="file-text-o" size={15} color={palette.emerald700} />
                  <Text style={styles.checkItemText}>Standard identification (Aadhaar / Domicile / Bank passbook)</Text>
                </View>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.sectionBody}>
            <View style={styles.infoCard}>
              <Text style={styles.cardHeader}>Frequently Asked Questions</Text>
              <Text style={styles.faqQuestion}>Q: How are benefits disbursed for {scheme.title}?</Text>
              <Text style={styles.faqAnswer}>
                A: Benefits are transferred directly through Direct Benefit Transfer (DBT) or approved bank channels.
              </Text>
              <Text style={styles.faqQuestion}>Q: Is online application supported?</Text>
              <Text style={styles.faqAnswer}>
                A: {scheme.officialUrl ? `Yes, applications can be submitted online via ${scheme.officialUrl}` : 'Applications can be submitted through the designated nodal department or portal.'}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Sticky Bottom Actions */}
      <View style={styles.bottomBarContainer}>
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.saveActionBtn}
            onPress={handleToggleSave}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Save scheme"
          >
            <FontAwesome
              name={isSaved ? 'bookmark' : 'bookmark-o'}
              size={16}
              color={isSaved ? palette.emerald800 : colors.light.text}
            />
            <Text style={styles.saveActionText}>{isSaved ? 'Saved' : 'Save'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.primaryActionBtn}
            onPress={handleCheckEligibility}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Check My Eligibility"
          >
            <Text style={styles.primaryActionText}>Check My Eligibility</Text>
            <Text style={styles.primaryActionArrow}>→</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.askInChatBtn}
          onPress={handleAskInChat}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Ask in Chat"
        >
          <FontAwesome name="comments-o" size={15} color={palette.emerald800} />
          <Text style={styles.askInChatText}>Ask in Chat</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
    backgroundColor: colors.light.surfaceElevated,
  },
  headerBtn: {
    padding: spacing.xs,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 110,
  },
  heroBanner: {
    height: 150,
    borderRadius: borderRadius.xl,
    backgroundColor: '#064E3B',
    marginBottom: spacing.md,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: palette.emerald700,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  govBadgeOverlay: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  govBadgeText: {
    fontSize: fontSizes.xs - 1,
    fontWeight: fontWeights.bold,
    color: palette.emerald900,
  },
  titleText: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold,
    color: colors.light.text,
    marginBottom: 2,
  },
  ministryText: {
    fontSize: fontSizes.sm,
    color: colors.light.textMuted,
    marginBottom: spacing.xs,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: spacing.md,
  },
  tagPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#166534',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
    marginBottom: spacing.lg,
  },
  tabButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: palette.emerald800,
  },
  tabText: {
    fontSize: fontSizes.sm,
    color: colors.light.textMuted,
    fontWeight: fontWeights.medium,
  },
  tabTextActive: {
    color: palette.emerald800,
    fontWeight: fontWeights.bold,
  },
  sectionBody: {
    gap: spacing.md,
  },
  benefitCard: {
    flexDirection: 'row',
    backgroundColor: '#ECFDF5',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    gap: spacing.md,
    alignItems: 'center',
  },
  benefitIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: palette.emerald700,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitTextCol: {
    flex: 1,
  },
  benefitAmount: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
    color: palette.emerald800,
    marginBottom: 2,
  },
  benefitNote: {
    fontSize: fontSizes.xs,
    color: palette.emerald900,
    lineHeight: 16,
  },
  infoCard: {
    backgroundColor: colors.light.surfaceElevated,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.light.border,
    gap: spacing.sm,
  },
  cardHeader: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.bold,
    color: colors.light.text,
  },
  bodyParagraph: {
    fontSize: fontSizes.sm,
    color: colors.light.textMuted,
    lineHeight: 22,
  },
  metaCard: {
    backgroundColor: colors.light.surfaceElevated,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.light.border,
    gap: spacing.md,
  },
  metaRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  metaIcon: {
    width: 20,
    textAlign: 'center',
  },
  metaTextCol: {
    flex: 1,
  },
  metaLabel: {
    fontSize: fontSizes.xs - 1,
    color: colors.light.textMuted,
    fontWeight: fontWeights.medium,
  },
  metaValue: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: colors.light.text,
  },
  websiteLink: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: '#2563EB',
    textDecorationLine: 'underline',
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  checkItemCol: {
    flex: 1,
  },
  checkItemTitle: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: palette.slate800,
  },
  checkItemSubtitle: {
    fontSize: fontSizes.xs,
    color: colors.light.textMuted,
    marginTop: 2,
  },
  mandatoryBadge: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  mandatoryBadgeText: {
    fontSize: 9,
    fontWeight: fontWeights.bold,
    color: '#DC2626',
  },
  checkItemText: {
    fontSize: fontSizes.sm,
    color: palette.slate800,
  },
  faqQuestion: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    color: colors.light.text,
    marginTop: spacing.xs,
  },
  faqAnswer: {
    fontSize: fontSizes.sm,
    color: colors.light.textMuted,
    lineHeight: 20,
  },
  bottomBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.light.surfaceElevated,
    borderTopWidth: 1,
    borderTopColor: colors.light.border,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.xs,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  saveActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.light.border,
    gap: spacing.xs,
  },
  saveActionText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    color: colors.light.text,
  },
  primaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    backgroundColor: palette.emerald800,
    gap: spacing.xs,
  },
  primaryActionText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
    color: '#FFFFFF',
  },
  primaryActionArrow: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.bold,
    color: '#FFFFFF',
  },
  askInChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  askInChatText: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    color: palette.emerald800,
  },
});
