import React from 'react';
import {
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { useProfileStore } from '../store/useProfileStore';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { spacing } from '@/core/theme/spacing';
import { palette } from '@/core/theme/colors';

export const ProfileMenuModal: React.FC = () => {
  const router = useRouter();
  const { isMenuVisible, closeMenu, openLogoutConfirm } = useProfileStore();
  const { currentUser } = useAuthStore();

  const user = currentUser || {
    fullName: 'Guest Citizen',
    email: 'Sign in to access saved records',
  };

  const handleNavigate = (route: string) => {
    closeMenu();
    router.push(route as any);
  };

  return (
    <Modal
      visible={isMenuVisible}
      transparent
      animationType="fade"
      onRequestClose={closeMenu}
    >
      <TouchableWithoutFeedback onPress={closeMenu}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.menuCard}>
              {/* User Header */}
              <View style={styles.userHeader}>
                {currentUser?.avatarUrl ? (
                  <Image source={{ uri: currentUser.avatarUrl }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, { backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center' }]}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#047857' }}>
                      {user.fullName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{user.fullName}</Text>
                  <Text style={styles.userEmail}>{user.email}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Menu Item 1: View Profile */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleNavigate('/profile')}
                activeOpacity={0.7}
              >
                <FontAwesome name="user-o" size={16} color="#334155" style={styles.itemIcon} />
                <Text style={styles.itemLabel}>View Profile</Text>
              </TouchableOpacity>

              {/* Menu Item 2: Settings */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleNavigate('/profile/settings')}
                activeOpacity={0.7}
              >
                <FontAwesome name="cog" size={16} color="#334155" style={styles.itemIcon} />
                <Text style={styles.itemLabel}>Settings</Text>
              </TouchableOpacity>

              {/* Menu Item 3: Help & Support */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleNavigate('/support')}
                activeOpacity={0.7}
              >
                <FontAwesome name="question-circle-o" size={16} color="#334155" style={styles.itemIcon} />
                <Text style={styles.itemLabel}>Help & Support</Text>
              </TouchableOpacity>

              <View style={styles.divider} />

              {/* Menu Item 4: Auth action */}
              {currentUser ? (
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={openLogoutConfirm}
                  activeOpacity={0.7}
                >
                  <FontAwesome name="sign-out" size={16} color="#DC2626" style={styles.itemIcon} />
                  <Text style={styles.logoutLabel}>Logout</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleNavigate('/auth')}
                  activeOpacity={0.7}
                >
                  <FontAwesome name="sign-in" size={16} color="#047857" style={styles.itemIcon} />
                  <Text style={[styles.itemLabel, { color: '#047857', fontWeight: '700' }]}>
                    Sign In / Register
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 65,
    paddingRight: 16,
  },
  menuCard: {
    width: 250,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: spacing.sm,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  userEmail: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: spacing.xs,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  itemIcon: {
    width: 24,
  },
  itemLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  logoutLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },
});
