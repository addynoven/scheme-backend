import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  Animated,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { palette } from '@/core/theme';
import { type LanguageCode, LANGUAGE_OPTIONS } from '../models/onboarding.model';

interface LanguageSelectionViewProps {
  selectedLanguage: LanguageCode;
  onSelectLanguage: (lang: LanguageCode) => void;
  onConfirm: (lang: LanguageCode) => void;
  isSaving: boolean;
}

export const LanguageSelectionView: React.FC<LanguageSelectionViewProps> = ({
  selectedLanguage,
  onSelectLanguage,
  onConfirm,
  isSaving,
}) => {
  const { width } = useWindowDimensions();
  const cardWidth = Math.floor((width - 48) / 2);

  const [savedFeedback, setSavedFeedback] = useState<string | null>(null);

  const handleCardPress = async (code: LanguageCode) => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Haptics unavailable in some environments
    }

    onSelectLanguage(code);

    const confirmationText =
      code === 'hi'
        ? 'हिंदी भाषा चुनी गई! (Hindi Selected)'
        : 'English Selected!';
    setSavedFeedback(confirmationText);

    // Trigger save and navigation
    onConfirm(code);
  };

  return (
    <View style={styles.container}>
      {/* Header Section */}
      <View style={styles.headerSection}>
        <Text style={styles.titlePrimary}>Choose your language</Text>
        <Text style={styles.titleSecondary}>अपनी भाषा चुनें</Text>
        <Text style={styles.subtitle}>
          Select the language you'd like to use in the app.
        </Text>
      </View>

      {/* Language Cards Row */}
      <View style={styles.cardsRow}>
        {/* English Card */}
        <Pressable
          style={({ pressed }) => [
            styles.card,
            { width: cardWidth },
            selectedLanguage === 'en' && styles.cardSelectedEn,
            pressed && styles.cardPressed,
          ]}
          onPress={() => handleCardPress('en')}
          disabled={isSaving}
          accessibilityRole="button"
          accessibilityLabel="Select English language"
        >
          {selectedLanguage === 'en' && (
            <View style={[styles.selectedCheckBadge, { backgroundColor: '#0D7A5F' }]}>
              <Ionicons name="checkmark" size={14} color="#FFFFFF" />
            </View>
          )}

          {/* Circle Badge 'A' */}
          <View style={[styles.letterBadgeCircle, { backgroundColor: '#E6F4EA' }]}>
            <Text style={[styles.letterBadgeText, { color: '#0D7A5F' }]}>A</Text>
          </View>

          <Text style={styles.cardTitle}>English</Text>
          <Text style={styles.cardSubtitle}>Continue in English</Text>

          {/* Monuments Graphic */}
          <View style={styles.cardGraphicBox}>
            <Image
              source={require('../../../../assets/onboarding/monuments_en.png')}
              style={styles.cardGraphicImage}
              resizeMode="contain"
            />
          </View>
        </Pressable>

        {/* Hindi Card */}
        <Pressable
          style={({ pressed }) => [
            styles.card,
            { width: cardWidth },
            selectedLanguage === 'hi' && styles.cardSelectedHi,
            pressed && styles.cardPressed,
          ]}
          onPress={() => handleCardPress('hi')}
          disabled={isSaving}
          accessibilityRole="button"
          accessibilityLabel="हिंदी भाषा चुनें"
        >
          {selectedLanguage === 'hi' && (
            <View style={[styles.selectedCheckBadge, { backgroundColor: '#D97706' }]}>
              <Ionicons name="checkmark" size={14} color="#FFFFFF" />
            </View>
          )}

          {/* Circle Badge 'अ' */}
          <View style={[styles.letterBadgeCircle, { backgroundColor: '#FEF3C7' }]}>
            <Text style={[styles.letterBadgeText, { color: '#D97706' }]}>अ</Text>
          </View>

          <Text style={styles.cardTitle}>हिंदी</Text>
          <Text style={styles.cardSubtitle}>हिंदी में जारी रखें</Text>

          {/* Monuments Graphic */}
          <View style={styles.cardGraphicBox}>
            <Image
              source={require('../../../../assets/onboarding/monuments_hi.png')}
              style={styles.cardGraphicImage}
              resizeMode="contain"
            />
          </View>
        </Pressable>
      </View>

      {/* Info Pill */}
      <View style={styles.infoPill}>
        <View style={styles.infoIconBox}>
          <Ionicons name="globe-outline" size={18} color="#0D7A5F" />
        </View>
        <Text style={styles.infoPillText}>
          You can change the language later in Settings.
        </Text>
      </View>

      {/* Language Saved Feedback Banner */}
      {savedFeedback && (
        <View style={styles.savedBanner}>
          <View style={styles.savedBannerIcon}>
            <Ionicons name="checkmark-circle" size={20} color="#0D7A5F" />
          </View>
          <View style={styles.savedBannerContent}>
            <Text style={styles.savedBannerTitle}>Language Saved!</Text>
            <Text style={styles.savedBannerSubtitle}>
              {savedFeedback}
            </Text>
          </View>
        </View>
      )}

      {/* Status or saving indicator */}
      {isSaving && (
        <View style={styles.savingRow}>
          <ActivityIndicator size="small" color="#0D7A5F" />
          <Text style={styles.savingText}>Proceeding...</Text>
        </View>
      )}

      {/* Footer Countryside Landscape Artwork */}
      <View style={styles.footerLandscapeContainer}>
        <Image
          source={require('../../../../assets/onboarding/landscape_footer.png')}
          style={[styles.footerLandscapeImage, { width: width - 24 }]}
          resizeMode="contain"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FCF9',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  headerSection: {
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 12,
  },
  titlePrimary: {
    fontSize: 25,
    fontWeight: '800',
    color: '#0A2540',
    letterSpacing: -0.3,
  },
  titleSecondary: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 6,
    textAlign: 'center',
  },
  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'stretch',
    gap: 16,
    marginTop: 18,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingTop: 16,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  cardSelectedEn: {
    borderColor: '#0D7A5F',
    backgroundColor: '#F7FCF9',
  },
  cardSelectedHi: {
    borderColor: '#D97706',
    backgroundColor: '#FFFDF9',
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  selectedCheckBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  letterBadgeCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  letterBadgeText: {
    fontSize: 28,
    fontWeight: '800',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 10,
  },
  cardGraphicBox: {
    width: '100%',
    height: 70,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  cardGraphicImage: {
    width: '100%',
    height: '100%',
  },
  infoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDF8F4',
    borderWidth: 1,
    borderColor: '#C6EAD9',
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginHorizontal: 8,
    marginTop: 14,
    gap: 10,
  },
  infoIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#D1F0E3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoPillText: {
    fontSize: 12.5,
    color: '#1E293B',
    fontWeight: '600',
    flex: 1,
    lineHeight: 16,
  },
  savingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 4,
  },
  savingText: {
    fontSize: 12.5,
    color: '#0D7A5F',
    fontWeight: '600',
  },
  savedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 8,
    marginTop: 10,
    gap: 10,
  },
  savedBannerIcon: {
    justifyContent: 'center',
  },
  savedBannerContent: {
    flex: 1,
  },
  savedBannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0D7A5F',
  },
  savedBannerSubtitle: {
    fontSize: 11.5,
    color: '#166534',
    fontWeight: '500',
  },
  footerLandscapeContainer: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 8,
  },
  footerLandscapeImage: {
    height: 190,
    borderRadius: 16,
  },
});
