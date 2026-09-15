import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { useProfileStore } from '../store/useProfileStore';
import { LinkAccountModal } from '../components/LinkAccountModal';
import { spacing } from '@/core/theme/spacing';
import { toastService } from '@/core/components/Toast';

export const LinkedAccountsScreen: React.FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    linkedAccounts,
    verifyEmail,
    linkEmail,
    linkGoogle,
    disconnectGoogle,
  } = useProfileStore();

  const [emailModalVisible, setEmailModalVisible] = React.useState(false);
  const [modalInitialStep, setModalInitialStep] = React.useState<'email_input' | 'verify'>('email_input');

  const phoneAcc = linkedAccounts.find((a) => a.provider === 'phone');
  const googleAcc = linkedAccounts.find((a) => a.provider === 'google');
  const emailAcc = linkedAccounts.find((a) => a.provider === 'email');

  const handleVerifyEmailDirectly = () => {
    setModalInitialStep('verify');
    setEmailModalVisible(true);
  };

  const handleChangeEmail = () => {
    setModalInitialStep('email_input');
    setEmailModalVisible(true);
  };

  const handleToggleGoogle = () => {
    if (googleAcc?.status === 'connected') {
      disconnectGoogle();
      toastService.show('Google account disconnected', 'info');
    } else {
      linkGoogle('rohit@gmail.com');
      toastService.show('Google account connected', 'success');
    }
  };

  const handleChangePhone = () => {
    toastService.show('To change your primary phone number, an OTP will be sent to your existing SIM.', 'info');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <FontAwesome name="chevron-left" size={16} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Linked Accounts</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Info / Notice Banner */}
        <View style={styles.noticeCard}>
          <View style={styles.noticeIconCircle}>
            <FontAwesome name="shield" size={16} color="#0D7A5F" />
          </View>
          <View style={styles.noticeTextCol}>
            <Text style={styles.noticeTitle}>Sign-in & Recovery Methods</Text>
            <Text style={styles.noticeSub}>
              Link verified methods so you can securely recover your citizen profile and access benefits anytime.
            </Text>
          </View>
        </View>

        <View style={styles.list}>
          {/* 1. PHONE CARD (PRIMARY) */}
          <View style={styles.accountCard}>
            <View style={[styles.iconCircle, { backgroundColor: '#DCFCE7' }]}>
              <FontAwesome name="phone" size={18} color="#16A34A" />
            </View>

            <View style={styles.infoCol}>
              <View style={styles.titleRow}>
                <Text style={styles.providerTitle}>Phone Number</Text>
                <View style={styles.primaryBadge}>
                  <Text style={styles.primaryBadgeText}>Primary</Text>
                </View>
              </View>
              <Text style={styles.identifierText}>{phoneAcc?.identifier || '+91 9876543210'}</Text>
              <Text style={styles.hintText}>Used for OTP login & SMS updates</Text>
            </View>

            <TouchableOpacity
              style={styles.actionBtnSecondary}
              onPress={handleChangePhone}
              activeOpacity={0.7}
            >
              <Text style={styles.actionBtnSecondaryText}>Change</Text>
            </TouchableOpacity>
          </View>

          {/* 2. GOOGLE CARD */}
          <View style={styles.accountCard}>
            <View style={[styles.iconCircle, { backgroundColor: '#FEE2E2' }]}>
              <FontAwesome name="google" size={18} color="#DC2626" />
            </View>

            <View style={styles.infoCol}>
              <View style={styles.titleRow}>
                <Text style={styles.providerTitle}>Google Account</Text>
                {googleAcc?.status === 'connected' ? (
                  <View style={styles.connectedBadge}>
                    <Text style={styles.connectedText}>Connected</Text>
                  </View>
                ) : (
                  <View style={styles.unlinkedBadge}>
                    <Text style={styles.unlinkedText}>Not linked</Text>
                  </View>
                )}
              </View>
              <Text style={styles.identifierText}>
                {googleAcc?.status === 'connected'
                  ? googleAcc.identifier
                  : 'Fast 1-tap sign-in'}
              </Text>
              <Text style={styles.hintText}>Instant access without waiting for SMS</Text>
            </View>

            {googleAcc?.status === 'connected' ? (
              <TouchableOpacity
                style={styles.actionBtnSecondary}
                onPress={handleToggleGoogle}
                activeOpacity={0.7}
              >
                <Text style={styles.disconnectText}>Disconnect</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.actionBtnPrimary}
                onPress={handleToggleGoogle}
                activeOpacity={0.8}
              >
                <Text style={styles.actionBtnPrimaryText}>Connect</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* 3. EMAIL CARD */}
          <View style={styles.accountCard}>
            <View style={[styles.iconCircle, { backgroundColor: '#E0F2FE' }]}>
              <FontAwesome name="envelope" size={18} color="#0284C7" />
            </View>

            <View style={styles.infoCol}>
              <View style={styles.titleRow}>
                <Text style={styles.providerTitle}>Email Address</Text>
                {emailAcc?.status === 'verified' ? (
                  <View style={styles.verifiedBadge}>
                    <Text style={styles.verifiedText}>Verified</Text>
                  </View>
                ) : emailAcc?.status === 'unverified' ? (
                  <View style={styles.unverifiedBadge}>
                    <Text style={styles.unverifiedBadgeText}>Unverified</Text>
                  </View>
                ) : (
                  <View style={styles.unlinkedBadge}>
                    <Text style={styles.unlinkedText}>Not linked</Text>
                  </View>
                )}
              </View>

              <Text style={styles.identifierText}>
                {emailAcc?.identifier || 'citizen@example.com'}
              </Text>
              <Text style={styles.hintText}>Scheme approvals & PDF statements</Text>
            </View>

            {emailAcc?.status === 'unverified' ? (
              <TouchableOpacity
                style={styles.actionBtnPrimary}
                onPress={handleVerifyEmailDirectly}
                activeOpacity={0.85}
              >
                <Text style={styles.actionBtnPrimaryText}>Verify Now</Text>
              </TouchableOpacity>
            ) : emailAcc?.status === 'verified' ? (
              <TouchableOpacity
                style={styles.actionBtnSecondary}
                onPress={handleChangeEmail}
                activeOpacity={0.7}
              >
                <Text style={styles.actionBtnSecondaryText}>Change</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.actionBtnPrimary}
                onPress={handleChangeEmail}
                activeOpacity={0.85}
              >
                <Text style={styles.actionBtnPrimaryText}>Link</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Security & Recovery Guarantee */}
        <View style={styles.securityBox}>
          <FontAwesome name="lock" size={14} color="#059669" style={{ marginRight: 8, marginTop: 1 }} />
          <Text style={styles.securityText}>
            Your credentials and authentication tokens are encrypted locally on this device and safeguarded with AES-256 standards.
          </Text>
        </View>
      </ScrollView>

      {/* Streamlined Email Linking / Verification Modal */}
      <LinkAccountModal
        visible={emailModalVisible}
        initialStep={modalInitialStep}
        defaultEmail={emailAcc?.identifier || 'rohit@example.com'}
        onClose={() => setEmailModalVisible(false)}
        onAccountLinked={(email) => {
          linkEmail(email);
          toastService.show(`Email ${email} linked and verified!`, 'success');
        }}
      />
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
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    marginBottom: spacing.md,
    gap: 12,
  },
  noticeIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noticeTextCol: {
    flex: 1,
  },
  noticeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#065F46',
  },
  noticeSub: {
    fontSize: 11.5,
    color: '#047857',
    marginTop: 2,
    lineHeight: 16,
  },
  list: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  infoCol: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  providerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  identifierText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#334155',
    marginTop: 2,
  },
  hintText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  primaryBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  primaryBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  connectedBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  connectedText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#166534',
  },
  verifiedBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  verifiedText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#166534',
  },
  unverifiedBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  unverifiedBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#B45309',
  },
  unlinkedBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  unlinkedText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#64748B',
  },
  actionBtnPrimary: {
    backgroundColor: '#0D7A5F',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  actionBtnPrimaryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  actionBtnSecondary: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionBtnSecondaryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  disconnectText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },
  securityBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: spacing.xs,
  },
  securityText: {
    flex: 1,
    fontSize: 11.5,
    color: '#64748B',
    lineHeight: 16,
  },
});
