import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/useAuthStore';
import { AuthHeroArtwork } from '../components/AuthHeroArtwork';
import { AuthModeToggle } from '../components/AuthModeToggle';
import { PhoneLoginView } from '../components/PhoneLoginView';
import { OtpChannelSelector } from '../components/OtpChannelSelector';
import { OtpPinInput } from '../components/OtpPinInput';
import { LoginSuccessView } from '../components/LoginSuccessView';
import { SignUpView } from '../components/SignUpView';
import { CompleteProfileView } from '../components/CompleteProfileView';
import { AuthErrorBanner, AuthErrorType } from '../components/AuthErrorBanner';
import { NetworkFailureModal } from '../components/NetworkFailureModal';
import { ForgotPasswordModal } from '../components/ForgotPasswordModal';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { spacing } from '@/core/theme/spacing';

const GOOGLE_WEB_CLIENT_ID = '520495266533-8fc48reub74h892f4age5u0ugbuqd4do.apps.googleusercontent.com';

export const AuthScreen: React.FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const {
    authMode,
    setAuthMode,
    stage,
    setStage,
    phoneNumber,
    countryCode,
    selectedChannel,
    otpDigits,
    fullName,
    email,
    state,
    countdown,
    setPhoneNumber,
    setSelectedChannel,
    setOtpDigit,
    setFullName,
    setEmail,
    setStateLocation,
    verifyOtp,
    completeProfileAndLogin,
    loginSuccessNow,
    loginWithGoogle,
    isLoading,
  } = useAuthStore();

  const [activeError, setActiveError] = React.useState<AuthErrorType | null>(null);
  const [showNetworkModal, setShowNetworkModal] = React.useState<boolean>(false);
  const [showForgotModal, setShowForgotModal] = React.useState<boolean>(false);
  const [remainingAttempts, setRemainingAttempts] = React.useState<number>(2);

  React.useEffect(() => {
    try {
      GoogleSignin.configure({
        webClientId: GOOGLE_WEB_CLIENT_ID,
        scopes: [
          'https://www.googleapis.com/auth/userinfo.profile',
          'https://www.googleapis.com/auth/userinfo.email',
        ],
        offlineAccess: false,
      });
    } catch (e) {
      console.warn('GoogleSignin configure error:', e);
    }
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      // Always sign out of cached account first so Google Play Services displays
      // the native account picker dialog every single time
      try {
        await GoogleSignin.signOut();
      } catch {}

      const response = await GoogleSignin.signIn();
      if (response.type === 'success') {
        const user = response.data.user;
        const idToken = response.data.idToken || undefined;
        const photoUrl = user.photo || undefined;
        const ok = await loginWithGoogle(
          user.email,
          user.name || user.givenName || undefined,
          idToken,
          photoUrl
        );
        if (ok) {
          router.replace('/(tabs)');
        } else {
          setActiveError('generic_error');
        }
      }
    } catch (error: any) {
      if (error?.code === statusCodes.SIGN_IN_CANCELLED) {
        return;
      }
      console.warn('Google Sign-In error:', error?.code || error);
      setActiveError('generic_error');
    }
  };

  const handleGoToAdvisor = () => {
    router.replace('/(tabs)');
  };

  const handleVerifyOtp = async () => {
    if (activeError === 'wrong_otp') {
      if (remainingAttempts > 1) {
        setRemainingAttempts(remainingAttempts - 1);
      } else {
        setActiveError('too_many_attempts');
      }
      return;
    }
    const success = await verifyOtp();
    if (!success && !activeError) {
      setActiveError('wrong_otp');
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {stage === 'success' ? (
          <LoginSuccessView onGoToAdvisor={handleGoToAdvisor} />
        ) : (
          <View style={styles.card}>
            {/* Top Artwork shown on options / phone input / signup */}
            {stage === 'options' || stage === 'phone_input' || stage === 'signup_phone' ? (
              <AuthHeroArtwork />
            ) : null}

            {/* Toggle shown on main entry screens */}
            {stage === 'options' || stage === 'phone_input' || stage === 'signup_phone' ? (
              <AuthModeToggle
                mode={authMode}
                onSelectMode={(mode) => {
                  setAuthMode(mode);
                  setStage(mode === 'login' ? 'options' : 'signup_phone');
                  setActiveError(null);
                }}
              />
            ) : null}

            {/* Subviews */}
            {authMode === 'login' && (stage === 'options' || stage === 'phone_input') ? (
              <PhoneLoginView
                phoneNumber={phoneNumber}
                countryCode={countryCode}
                error={activeError}
                onChangePhone={(val) => {
                  setPhoneNumber(val);
                  if (activeError === 'invalid_phone' && val.length === 10) {
                    setActiveError(null);
                  }
                }}
                onSendOtp={() => {
                  if (activeError === 'invalid_phone') return;
                  setStage('channel_select');
                }}
                onSelectGoogle={handleGoogleSignIn}
                onSelectEmail={() => setStage('channel_select')}
                onSwitchToSignUp={() => {
                  setAuthMode('signup');
                  setStage('signup_phone');
                  setActiveError(null);
                }}
                onForgotPassword={() => setShowForgotModal(true)}
              />
            ) : null}

            {stage === 'channel_select' ? (
              <OtpChannelSelector
                selectedChannel={selectedChannel}
                onSelectChannel={setSelectedChannel}
                onConfirmChannel={() => setStage('enter_otp')}
                onBack={() => setStage('options')}
              />
            ) : null}

            {stage === 'enter_otp' ? (
              <OtpPinInput
                digits={otpDigits}
                phoneNumber={phoneNumber}
                channel={selectedChannel}
                countdown={activeError === 'otp_expired' ? 0 : countdown}
                error={activeError}
                attemptsRemaining={remainingAttempts}
                onChangeDigit={setOtpDigit}
                onVerify={handleVerifyOtp}
                onBack={() => {
                  setStage('channel_select');
                  setActiveError(null);
                }}
                onTrySms={() => setSelectedChannel('sms')}
                onResendOtp={() => {
                  setActiveError(null);
                  setRemainingAttempts(2);
                }}
              />
            ) : null}

            {authMode === 'signup' && stage === 'signup_phone' ? (
              <SignUpView
                fullName={fullName}
                phoneNumber={phoneNumber}
                countryCode={countryCode}
                error={activeError}
                onChangeName={setFullName}
                onChangePhone={setPhoneNumber}
                onSendOtp={() => {
                  if (activeError === 'duplicate_account') return;
                  setStage('channel_select');
                }}
                onLoginInstead={() => {
                  setAuthMode('login');
                  setStage('phone_input');
                  setActiveError(null);
                }}
              />
            ) : null}

            {stage === 'complete_profile' ? (
              <CompleteProfileView
                email={email}
                state={state}
                onChangeEmail={setEmail}
                onChangeState={setStateLocation}
                onComplete={completeProfileAndLogin}
              />
            ) : null}
          </View>
        )}
      </ScrollView>

      {/* Modals for Network Failure and Forgot Password */}
      <NetworkFailureModal
        visible={showNetworkModal}
        onClose={() => setShowNetworkModal(false)}
        onTryAgain={() => setShowNetworkModal(false)}
        onUseOfflineMode={() => {
          setShowNetworkModal(false);
          router.push('/(tabs)/schemes');
        }}
      />

      <ForgotPasswordModal
        visible={showForgotModal}
        onClose={() => setShowForgotModal(false)}
        onSuccess={() => {
          setShowForgotModal(false);
          setAuthMode('login');
          setStage('phone_input');
        }}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  card: {
    backgroundColor: '#FFFFFF',
  },
});
