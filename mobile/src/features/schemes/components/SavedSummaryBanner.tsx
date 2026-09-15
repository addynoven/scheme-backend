import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { spacing } from '@/core/theme/spacing';

interface SavedSummaryBannerProps {
  count: number;
}

export const SavedSummaryBanner: React.FC<SavedSummaryBannerProps> = ({ count }) => {
  return (
    <View style={styles.container}>
      <Image
        source={require('@/../assets/schemes/woman_saree.png')}
        style={styles.avatar}
        resizeMode="contain"
      />
      <View style={styles.textContainer}>
        <Text style={styles.title}>
          You've saved {count} {count === 1 ? 'scheme' : 'schemes'}
        </Text>
        <Text style={styles.subtitle}>
          Keep exploring to build more opportunities for your family.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FEF9C3',
    borderRadius: 16,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: '#FEF08A',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: spacing.sm,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#854D0E',
  },
  subtitle: {
    fontSize: 11,
    color: '#A16207',
    marginTop: 2,
    lineHeight: 15,
  },
});
