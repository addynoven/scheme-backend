# 📱 Citizen Welfare Navigator — Mobile Application

Native cross-platform mobile application built with **React Native (v0.81.5)**, **Expo SDK 54**, **Expo Router v6**, and **TypeScript**.

## 🚀 Key Features

- **100% De-Mocked Architecture**: Completely wired to the live FastAPI backend with zero mock data files.
- **AI Advisor (`features/advisor`)**: Conversational welfare guidance, dynamic prompt chips, step-by-step thinking state, and rich citations.
- **Live Eligibility Engine (`features/check`)**: Step-by-step quiz evaluating profile parameters directly via `/eligibility/explain`.
- **High-Speed Cache (`core/storage/mmkv.ts`)**: In-memory caching with `react-native-mmkv` for instant scheme browsing and offline resilience.
- **Document Vault (`features/vault`)**: Document scanning and upload with Cloudinary CDN integration and OCR fact extraction review.
- **Authentication (`features/auth`)**: Secure JWT token lifecycle with `expo-secure-store`, OTP sign-in, and guest state.
- **Categorized Support (`features/support`)**: Searchable FAQ library and official grievance contacts.

## 🛠️ Development & Running

### Prerequisites
- Node.js 20+
- Android Studio with Android SDK 35 (or Android device with USB debugging)

### Commands

```bash
# Install dependencies
npm install

# Start Metro bundler
npm run start

# Run on connected Android device/emulator
npm run android

# Typecheck TypeScript (Strict)
npm run typecheck

# Run Node test runner suite
npm run test
```

## 📦 Standalone Release Build

To build an optimized production APK for Android (`arm64-v8a` and `x86_64`):

```bash
cd android
./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a,x86_64
```

The compiled release APK is generated at:
`android/app/build/outputs/apk/release/app-release.apk`

To install directly onto an active device or emulator:
```bash
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

## 📐 Architecture

Organized strictly feature-first in `src/features/`:
```text
src/
├── app/               # Expo Router screen routes & bottom navigation tabs
├── core/              # Low-level infrastructure
│   ├── api/           # Typed HTTP client & endpoint contracts
│   ├── config/        # Zod-validated runtime environment variables & feature flags
│   ├── storage/       # MMKV persistent cache & Expo SecureStore
│   └── theme/         # Colors, spacing, shadows, and typography
└── features/          # Self-contained domain features:
    ├── advisor/       # AI chat interface & recommendation cards
    ├── auth/          # Authentication & user session management
    ├── check/         # Instant eligibility evaluation flow
    ├── onboarding/    # Language preferences (English/Hindi)
    ├── profile/       # Profile management & account actions
    ├── schemes/       # Search, filter, and bookmark 4,160+ schemes
    ├── support/       # FAQ directory & grievance support
    └── vault/         # Document upload, Cloudinary sync & OCR facts
```

## 🧪 Testing

The mobile app includes 68 integration and unit tests covering all features:
```bash
npm run test
```
