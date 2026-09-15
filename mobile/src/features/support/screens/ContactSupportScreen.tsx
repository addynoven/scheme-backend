import React from 'react';
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { spacing } from '@/core/theme/spacing';
import { palette } from '@/core/theme/colors';

export const ContactSupportScreen: React.FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleWhatsApp = () => {
    Linking.openURL('https://wa.me/919876543210?text=Hello%20Scheme%20App%20Support').catch(
      () => {}
    );
  };

  const handleEmail = () => {
    Linking.openURL('mailto:support@schemeapp.gov.in?subject=Scheme%20App%20Support').catch(
      () => {}
    );
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
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.introSection}>
          <Text style={styles.title}>Choose a way to reach our support team.</Text>
          <Text style={styles.subtitle}>We usually respond within 24 hours.</Text>
        </View>

        {/* Channels List */}
        <View style={styles.channelList}>
          {/* WhatsApp */}
          <TouchableOpacity
            style={styles.channelCard}
            onPress={handleWhatsApp}
            activeOpacity={0.7}
          >
            <View style={[styles.iconCircle, { backgroundColor: '#DCFCE7' }]}>
              <FontAwesome name="whatsapp" size={22} color="#16A34A" />
            </View>
            <View style={styles.channelInfo}>
              <Text style={styles.channelTitle}>Chat on WhatsApp</Text>
              <Text style={styles.channelSubtitle}>
                Get help from our support team on WhatsApp.
              </Text>
            </View>
            <FontAwesome name="chevron-right" size={12} color="#94A3B8" />
          </TouchableOpacity>

          {/* Email */}
          <TouchableOpacity
            style={styles.channelCard}
            onPress={handleEmail}
            activeOpacity={0.7}
          >
            <View style={[styles.iconCircle, { backgroundColor: '#E0F2FE' }]}>
              <FontAwesome name="envelope-o" size={18} color="#0284C7" />
            </View>
            <View style={styles.channelInfo}>
              <Text style={styles.channelTitle}>Email Support</Text>
              <Text style={styles.channelHighlight}>support@schemeapp.gov.in</Text>
              <Text style={styles.channelSubtitle}>We typically respond within 24 hours.</Text>
            </View>
            <FontAwesome name="chevron-right" size={12} color="#94A3B8" />
          </TouchableOpacity>

          {/* Support Hours */}
          <View style={styles.infoCard}>
            <View style={[styles.iconCircle, { backgroundColor: '#FEF3C7' }]}>
              <FontAwesome name="clock-o" size={18} color="#D97706" />
            </View>
            <View style={styles.channelInfo}>
              <Text style={styles.channelTitle}>Support Hours</Text>
              <Text style={styles.channelSubtitle}>Mon – Sat, 9:00 AM – 6:00 PM (IST)</Text>
            </View>
          </View>

          {/* OR Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Ask in Chat (AI Advisor) */}
          <TouchableOpacity
            style={styles.aiAdvisorCard}
            onPress={() => router.push('/(tabs)')}
            activeOpacity={0.8}
          >
            <View style={[styles.iconCircle, { backgroundColor: '#DCFCE7' }]}>
              <FontAwesome name="android" size={22} color={palette.emerald700} />
            </View>
            <View style={styles.channelInfo}>
              <Text style={styles.channelTitle}>Ask in Chat (AI Advisor)</Text>
              <Text style={styles.channelSubtitle}>
                Get instant answers from our AI Advisor, available 24/7.
              </Text>
            </View>
            <FontAwesome name="chevron-right" size={12} color={palette.emerald700} />
          </TouchableOpacity>
        </View>

        {/* Before You Contact Us */}
        <View style={styles.checklistSection}>
          <Text style={styles.checklistTitle}>Before you contact us</Text>
          <View style={styles.checkItem}>
            <FontAwesome name="check-circle" size={14} color={palette.emerald600} />
            <Text style={styles.checkItemText}>Check our FAQs above</Text>
          </View>
          <View style={styles.checkItem}>
            <FontAwesome name="check-circle" size={14} color={palette.emerald600} />
            <Text style={styles.checkItemText}>
              Include relevant details (screenshot, scheme name, etc.)
            </Text>
          </View>
          <View style={styles.checkItem}>
            <FontAwesome name="check-circle" size={14} color={palette.emerald600} />
            <Text style={styles.checkItemText}>
              For account issues, please use your registered email or phone number
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: '#FFFFFF',
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
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  introSection: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 20,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  channelList: {
    gap: spacing.sm,
  },
  channelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  aiAdvisorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: palette.emerald500,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  channelInfo: {
    flex: 1,
  },
  channelTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  channelHighlight: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0284C7',
    marginTop: 1,
  },
  channelSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 15,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xs,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    marginHorizontal: spacing.sm,
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  checklistSection: {
    marginTop: spacing.xl,
    padding: spacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: spacing.xs,
  },
  checklistTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  checkItemText: {
    flex: 1,
    fontSize: 11,
    color: '#475569',
    lineHeight: 16,
  },
});
