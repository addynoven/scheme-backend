import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { spacing } from '@/core/theme/spacing';
import { palette } from '@/core/theme/colors';

export const ProfileScreen: React.FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuthStore();
  const isAuthenticated = Boolean(currentUser);

  const user = currentUser || {
    fullName: 'Guest Citizen',
    phone: 'Sign in to save documents & results',
    email: '',
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
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Card Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarWrapper}>
            {currentUser?.avatarUrl ? (
              <Image source={{ uri: currentUser.avatarUrl }} style={styles.avatarImage} />
            ) : (
              <View style={styles.initialAvatarCircle}>
                <Text style={styles.initialAvatarText}>
                  {user.fullName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            {isAuthenticated && (
              <TouchableOpacity
                style={styles.editBadge}
                onPress={() => router.push('/profile/edit' as any)}
              >
                <FontAwesome name="pencil" size={12} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.name}>{user.fullName}</Text>
          <Text style={styles.handle}>{user.phone || user.email}</Text>

          {!isAuthenticated && (
            <TouchableOpacity
              style={styles.signInBannerBtn}
              onPress={() => router.push('/auth' as any)}
              activeOpacity={0.85}
            >
              <Text style={styles.signInBannerText}>Sign In / Register</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Menu Cards */}
        <View style={styles.menuList}>
          {/* Item 1: Personal Information */}
          <TouchableOpacity
            style={styles.menuCard}
            onPress={() => router.push('/profile/edit' as any)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconCircle, { backgroundColor: '#F0FDF4' }]}>
              <FontAwesome name="user" size={16} color={palette.emerald700} />
            </View>
            <View style={styles.menuInfo}>
              <Text style={styles.menuTitle}>Personal Information</Text>
              <Text style={styles.menuSubtitle}>Name, email, phone</Text>
            </View>
            <FontAwesome name="chevron-right" size={12} color="#94A3B8" />
          </TouchableOpacity>

          {/* Item 2: Linked Accounts */}
          <TouchableOpacity
            style={styles.menuCard}
            onPress={() => router.push('/profile/linked-accounts' as any)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconCircle, { backgroundColor: '#EFF6FF' }]}>
              <FontAwesome name="link" size={16} color="#2563EB" />
            </View>
            <View style={styles.menuInfo}>
              <Text style={styles.menuTitle}>Linked Accounts</Text>
              <Text style={styles.menuSubtitle}>Google, phone, email</Text>
            </View>
            <FontAwesome name="chevron-right" size={12} color="#94A3B8" />
          </TouchableOpacity>

          {/* Item 3: Manage Documents */}
          <TouchableOpacity
            style={styles.menuCard}
            onPress={() => router.push('/(tabs)/vault')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconCircle, { backgroundColor: '#FEF3C7' }]}>
              <FontAwesome name="folder-open" size={16} color="#D97706" />
            </View>
            <View style={styles.menuInfo}>
              <Text style={styles.menuTitle}>Manage Documents</Text>
              <Text style={styles.menuSubtitle}>Go to your Vault</Text>
            </View>
            <FontAwesome name="chevron-right" size={12} color="#94A3B8" />
          </TouchableOpacity>

          {/* Item 4: Your Results */}
          <TouchableOpacity
            style={styles.menuCard}
            onPress={() => router.push('/(tabs)/check')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconCircle, { backgroundColor: '#F3E8FF' }]}>
              <FontAwesome name="check-square-o" size={16} color="#7C3AED" />
            </View>
            <View style={styles.menuInfo}>
              <Text style={styles.menuTitle}>Your Results</Text>
              <Text style={styles.menuSubtitle}>View eligibility history</Text>
            </View>
            <FontAwesome name="chevron-right" size={12} color="#94A3B8" />
          </TouchableOpacity>
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
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: spacing.sm,
  },
  initialAvatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#DCFCE7',
    borderWidth: 2.5,
    borderColor: palette.emerald600,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2.5,
    borderColor: palette.emerald600,
  },
  initialAvatarText: {
    fontSize: 30,
    fontWeight: '800',
    color: palette.emerald800,
  },
  signInBannerBtn: {
    marginTop: spacing.md,
    backgroundColor: palette.emerald800,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 10,
  },
  signInBannerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: palette.emerald700,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  name: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  handle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  menuList: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  menuInfo: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  menuSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
});
