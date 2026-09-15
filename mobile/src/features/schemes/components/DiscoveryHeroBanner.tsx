import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { spacing } from '@/core/theme/spacing';

export const DiscoveryHeroBanner: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        <Text style={styles.title}>Discovery creates new opportunities.</Text>
        <Text style={styles.subtitle}>
          Explore government schemes for you, your family and your community.
        </Text>
      </View>
      <View style={styles.imageWrapper}>
        <Image
          source={require('@/../assets/schemes/woman_saree.png')}
          style={styles.image}
          resizeMode="contain"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FEF3C7',
    borderRadius: 20,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    minHeight: 110,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  textContainer: {
    flex: 1.4,
    paddingRight: spacing.xs,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#78350F',
    lineHeight: 20,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#92400E',
    marginTop: 4,
    lineHeight: 15,
  },
  imageWrapper: {
    flex: 1,
    height: 100,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
