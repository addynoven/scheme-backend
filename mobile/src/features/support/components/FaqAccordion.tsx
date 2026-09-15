import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { FaqItem } from '../models/support.model';
import { spacing } from '@/core/theme/spacing';
import { palette } from '@/core/theme/colors';

interface FaqAccordionProps {
  items: FaqItem[];
}

export const FaqAccordion: React.FC<FaqAccordionProps> = ({ items }) => {
  const [expandedId, setExpandedId] = useState<string | null>('faq-eligibility');

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <View style={styles.container}>
      {items.map((item) => {
        const isExpanded = expandedId === item.id;
        return (
          <View key={item.id} style={[styles.itemCard, isExpanded && styles.itemCardExpanded]}>
            <TouchableOpacity
              style={styles.headerRow}
              onPress={() => toggleExpand(item.id)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={item.question}
            >
              <Text
                style={[
                  styles.questionText,
                  isExpanded && styles.questionTextExpanded,
                ]}
              >
                {item.question}
              </Text>
              <FontAwesome
                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                size={12}
                color={isExpanded ? palette.emerald700 : '#94A3B8'}
              />
            </TouchableOpacity>

            {isExpanded ? (
              <View style={styles.answerBody}>
                <Text style={styles.answerText}>{item.answer}</Text>
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  itemCardExpanded: {
    borderColor: palette.emerald500,
    backgroundColor: '#F0FDF4',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  questionText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    paddingRight: spacing.sm,
    lineHeight: 18,
  },
  questionTextExpanded: {
    color: palette.emerald900,
  },
  answerBody: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#DCFCE7',
    paddingTop: spacing.sm,
  },
  answerText: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 18,
  },
});
