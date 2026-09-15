import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useRouter } from 'expo-router';
import { FaqCategory, FAQ_DATA } from '../models/support.model';
import { FaqAccordion } from '../components/FaqAccordion';
import { spacing } from '@/core/theme/spacing';
import { palette } from '@/core/theme/colors';

const CATEGORIES: { id: FaqCategory; label: string }[] = [

  { id: 'all', label: 'All' },
  { id: 'account', label: 'Account' },
  { id: 'schemes', label: 'Schemes' },
  { id: 'documents', label: 'Documents' },
];

export const HelpSupportScreen: React.FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FaqCategory>('all');

  const filteredFaqs = FAQ_DATA.filter((item) => {
    if (selectedCategory !== 'all' && item.category !== selectedCategory) {
      return false;
    }
    if (query.trim().length > 0) {
      const q = query.toLowerCase();
      return (
        item.question.toLowerCase().includes(q) || item.answer.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
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
        <TouchableOpacity
          style={styles.contactHeaderBtn}
          onPress={() => router.push('/support/contact' as any)}
        >
          <FontAwesome name="headphones" size={16} color={palette.emerald700} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Intro */}
        <View style={styles.introSection}>
          <Text style={styles.introTitle}>We're here to help you.</Text>
          <Text style={styles.introSubtitle}>Find answers or get in touch.</Text>
        </View>

        {/* Search */}
        <View style={styles.searchBar}>
          <FontAwesome name="search" size={14} color="#94A3B8" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for a question..."
            placeholderTextColor="#94A3B8"
            value={query}
            onChangeText={setQuery}
          />
          {query.length > 0 ? (
            <TouchableOpacity onPress={() => setQuery('')}>
              <FontAwesome name="times-circle" size={15} color="#94A3B8" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Category Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catScroll}
        >
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.catPill, isActive && styles.catPillActive]}
                onPress={() => setSelectedCategory(cat.id)}
                activeOpacity={0.7}
              >
                <Text style={[styles.catText, isActive && styles.catTextActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Popular Questions Title */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Popular Questions</Text>
          <TouchableOpacity onPress={() => router.push('/support/contact' as any)}>
            <Text style={styles.contactLink}>Contact Support →</Text>
          </TouchableOpacity>
        </View>

        {/* FAQs Accordion */}
        <FaqAccordion items={filteredFaqs} />

        {/* Ask AI Advisor Sticky Card */}
        <View style={styles.aiAdvisorCard}>
          <View style={styles.aiIconCircle}>
            <FontAwesome name="android" size={20} color={palette.emerald700} />
          </View>
          <View style={styles.aiTextCol}>
            <Text style={styles.aiTitle}>Still have questions?</Text>
            <Text style={styles.aiSubtitle}>Ask our AI Advisor 24/7.</Text>
          </View>
          <TouchableOpacity
            style={styles.askInChatBtn}
            onPress={() => router.push('/(tabs)')}
            activeOpacity={0.85}
          >
            <Text style={styles.askInChatText}>Ask in Chat →</Text>
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
  contactHeaderBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: spacing.md,
    paddingBottom: 40,
  },
  introSection: {
    marginBottom: spacing.md,
  },
  introTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  introSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
    height: 42,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
  },
  catScroll: {
    gap: spacing.xs,
    paddingBottom: spacing.sm,
  },
  catPill: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  catPillActive: {
    backgroundColor: palette.emerald700,
    borderColor: palette.emerald700,
  },
  catText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  catTextActive: {
    color: '#FFFFFF',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  contactLink: {
    fontSize: 12,
    fontWeight: '600',
    color: palette.emerald700,
  },
  aiAdvisorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 16,
    padding: spacing.md,
    marginTop: spacing.xl,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  aiIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  aiTextCol: {
    flex: 1,
  },
  aiTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#065F46',
  },
  aiSubtitle: {
    fontSize: 11,
    color: '#047857',
    marginTop: 1,
  },
  askInChatBtn: {
    backgroundColor: palette.emerald700,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  askInChatText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
