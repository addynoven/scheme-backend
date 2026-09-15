import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { spacing } from '@/core/theme/spacing';
import { palette } from '@/core/theme/colors';

export const AuthHeroArtwork: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Brand Header */}
      <View style={styles.brandRow}>
        <View style={styles.leafCircle}>
          <FontAwesome name="leaf" size={14} color="#FFFFFF" />
        </View>
        <View>
          <Text style={styles.brandTitle}>Scheme App</Text>
          <Text style={styles.brandSubtitle}>Sarkar ki yojana, aapke liye</Text>
        </View>
      </View>

      {/* Hero Citizens Quartet */}
      <View style={styles.artworkWrapper}>
        <Image
          source={require('@/../assets/onboarding/citizens_quartet.png')}
          style={styles.artworkImage}
          resizeMode="contain"
        />
      </View>

      <Text style={styles.headline}>A Brighter Tomorrow{'\n'}For Every Citizen</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.xs,
  },
  leafCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: palette.emerald600,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  brandSubtitle: {
    fontSize: 10,
    fontWeight: '600',
    color: palette.saffron800,
  },
  artworkWrapper: {
    width: '100%',
    height: 125,
    marginVertical: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  artworkImage: {
    width: '90%',
    height: '100%',
  },
  headline: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 2,
  },
});
