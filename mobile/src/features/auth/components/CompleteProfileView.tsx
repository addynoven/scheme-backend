import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { spacing } from '@/core/theme/spacing';
import { palette } from '@/core/theme/colors';

interface CompleteProfileViewProps {
  email: string;
  state: string;
  onChangeEmail: (email: string) => void;
  onChangeState: (state: string) => void;
  onComplete: () => void;
}

export const CompleteProfileView: React.FC<CompleteProfileViewProps> = ({
  email,
  state,
  onChangeEmail,
  onChangeState,
  onComplete,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Complete Your Profile</Text>
      <Text style={styles.subtitle}>Just a few details to get started.</Text>

      {/* Photo Placeholder */}
      <View style={styles.photoContainer}>
        <View style={styles.photoCircle}>
          <FontAwesome name="user" size={36} color="#94A3B8" />
          <View style={styles.cameraBadge}>
            <FontAwesome name="camera" size={11} color="#FFFFFF" />
          </View>
        </View>
        <Text style={styles.photoLabel}>Add Photo (optional)</Text>
      </View>

      {/* Email */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Email (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="rohit@example.com"
          placeholderTextColor="#94A3B8"
          keyboardType="email-address"
          value={email}
          onChangeText={onChangeEmail}
          autoCapitalize="none"
        />
      </View>

      {/* State Dropdown */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>State (optional)</Text>
        <TouchableOpacity
          style={styles.dropdownInput}
          onPress={() => onChangeState(state === 'Maharashtra' ? 'Delhi' : 'Maharashtra')}
          activeOpacity={0.8}
        >
          <Text style={styles.dropdownValue}>{state}</Text>
          <FontAwesome name="chevron-down" size={12} color="#64748B" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.createAccountBtn}
        onPress={onComplete}
        activeOpacity={0.85}
      >
        <Text style={styles.createAccountText}>Create Account</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.xs,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 3,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  photoContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  photoCircle: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: palette.emerald700,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  photoLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 6,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
  },
  input: {
    height: 46,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#0F172A',
  },
  dropdownInput: {
    height: 46,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownValue: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '500',
  },
  createAccountBtn: {
    backgroundColor: palette.emerald700,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  createAccountText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
