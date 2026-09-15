import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { ExtractedFacts } from '../models/vault.model';
import { palette } from '@/core/theme/colors';
import { spacing } from '@/core/theme/spacing';

interface ExtractVerifyModalProps {
  visible: boolean;
  onClose: () => void;
  initialFacts: ExtractedFacts;
  onConfirm: () => void;
}

export const ExtractVerifyModal: React.FC<ExtractVerifyModalProps> = ({
  visible,
  onClose,
  initialFacts,
  onConfirm,
}) => {
  const insets = useSafeAreaInsets();
  const [fullName, setFullName] = useState(initialFacts.fullName);
  const [dob, setDob] = useState(initialFacts.dob);
  const [gender, setGender] = useState<'male' | 'female' | 'other'>(initialFacts.gender);
  const [state, setState] = useState(initialFacts.state);
  const [address, setAddress] = useState(initialFacts.address);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={onClose}>
            <FontAwesome name="chevron-left" size={15} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Extract & Verify</Text>
          <View style={styles.statusDotRing}>
            <View style={styles.statusDot} />
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Document Scanner Preview Card */}
          <View style={styles.scannerCard}>
            <View style={styles.aadhaarCard}>
              {/* Card Top */}
              <View style={styles.aadhaarHeader}>
                <View style={styles.govTitleRow}>
                  <Text style={styles.emblemIcon}>🏛️</Text>
                  <View>
                    <Text style={styles.govTextHi}>भारत सरकार</Text>
                    <Text style={styles.govTextEn}>Government of India</Text>
                  </View>
                </View>
                <View style={styles.aadhaarLogoCircle}>
                  <FontAwesome name="sun-o" size={16} color="#EA580C" />
                </View>
              </View>

              {/* Card Middle */}
              <View style={styles.cardMidRow}>
                <View style={styles.photoContainer}>
                  <FontAwesome name="user" size={32} color="#94A3B8" />
                  <View style={styles.verifiedTag}>
                    <Text style={styles.verifiedTagText}>VERIFIED</Text>
                  </View>
                </View>

                <View style={styles.previewInfo}>
                  <Text style={styles.previewLabel}>Name</Text>
                  <Text style={styles.previewVal}>{fullName}</Text>

                  <Text style={styles.previewLabel}>DOB / जन्म तारीख</Text>
                  <Text style={styles.previewVal}>{dob}</Text>

                  <Text style={styles.previewLabel}>Gender / लिंग</Text>
                  <Text style={styles.previewVal}>
                    {gender === 'male' ? 'पुरुष / MALE' : gender === 'female' ? 'महिला / FEMALE' : 'अन्य / OTHER'}
                  </Text>
                </View>

                <View style={styles.qrMock}>
                  <FontAwesome name="qrcode" size={38} color="#0F172A" />
                </View>
              </View>

              {/* Card Bottom */}
              <View style={styles.cardBottom}>
                <Text style={styles.aadhaarNumberText}>XXXX  XXXX  4821</Text>
              </View>
            </View>
          </View>

          {/* Form Header */}
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>Extracted Information</Text>
            <Text style={styles.formSubtitle}>Please verify and edit if needed</Text>
          </View>

          {/* Form Fields */}
          <View style={styles.formCard}>
            {/* Full Name */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Full name as on ID"
              />
            </View>

            {/* Date of Birth */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Date of Birth</Text>
              <View style={styles.inputWithIcon}>
                <TextInput
                  style={[styles.input, { flex: 1, borderWidth: 0 }]}
                  value={dob}
                  onChangeText={setDob}
                  placeholder="DD/MM/YYYY"
                />
                <FontAwesome name="calendar" size={15} color="#64748B" style={{ marginRight: 12 }} />
              </View>
            </View>

            {/* Gender Radio */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Gender</Text>
              <View style={styles.genderRow}>
                {(['male', 'female', 'other'] as const).map((g) => {
                  const isSelected = gender === g;
                  return (
                    <TouchableOpacity
                      key={g}
                      style={[styles.genderChip, isSelected && styles.genderChipActive]}
                      onPress={() => setGender(g)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.radioCircle, isSelected && styles.radioCircleActive]}>
                        {isSelected && <View style={styles.radioInnerDot} />}
                      </View>
                      <Text style={[styles.genderText, isSelected && styles.genderTextActive]}>
                        {g.charAt(0).toUpperCase() + g.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* State */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>State</Text>
              <View style={styles.inputWithIcon}>
                <TextInput
                  style={[styles.input, { flex: 1, borderWidth: 0 }]}
                  value={state}
                  onChangeText={setState}
                  placeholder="Select state"
                />
                <FontAwesome name="chevron-down" size={13} color="#64748B" style={{ marginRight: 12 }} />
              </View>
            </View>

            {/* Address */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Address</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={address}
                onChangeText={setAddress}
                placeholder="Full residential address"
                multiline
                numberOfLines={2}
              />
            </View>
          </View>

          {/* Confirm & Save Facts CTA */}
          <TouchableOpacity
            style={styles.confirmBtn}
            onPress={onConfirm}
            activeOpacity={0.85}
          >
            <Text style={styles.confirmBtnText}>Confirm & Save Facts</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
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
  statusDotRing: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16A34A',
  },
  content: {
    padding: spacing.md,
    paddingBottom: 40,
  },
  scannerCard: {
    backgroundColor: '#0F172A',
    borderRadius: 18,
    padding: spacing.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  aadhaarCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  aadhaarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 4,
  },
  govTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  emblemIcon: {
    fontSize: 16,
  },
  govTextHi: {
    fontSize: 9,
    fontWeight: '700',
    color: '#334155',
  },
  govTextEn: {
    fontSize: 8,
    color: '#64748B',
  },
  aadhaarLogoCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardMidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  photoContainer: {
    width: 54,
    height: 64,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    position: 'relative',
    overflow: 'hidden',
  },
  verifiedTag: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    alignItems: 'center',
    paddingVertical: 1,
  },
  verifiedTagText: {
    fontSize: 6,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  previewInfo: {
    flex: 1,
  },
  previewLabel: {
    fontSize: 7,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  previewVal: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 3,
  },
  qrMock: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  cardBottom: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 6,
    alignItems: 'center',
  },
  aadhaarNumberText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
    color: '#0F172A',
    fontFamily: 'monospace',
  },
  formHeader: {
    marginBottom: spacing.xs,
  },
  formTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  formSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: spacing.sm,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  fieldGroup: {
    gap: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  textArea: {
    height: 54,
    textAlignVertical: 'top',
  },
  genderRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  genderChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingVertical: 8,
    gap: 6,
  },
  genderChipActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#059669',
  },
  radioCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: {
    borderColor: '#059669',
  },
  radioInnerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#059669',
  },
  genderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  genderTextActive: {
    color: '#047857',
    fontWeight: '700',
  },
  confirmBtn: {
    backgroundColor: '#059669',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
