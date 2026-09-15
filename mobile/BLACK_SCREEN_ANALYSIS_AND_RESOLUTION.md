# Comprehensive Technical Postmortem: Android Splash Screen Black Flash Elimination & Architecture Resolution

## 1. Executive Summary

During cold boot on Android (specifically Android 12+ / API 31–35), the mobile application (`com.schememobile.app`) exhibited a persistent **2 to 3-second pitch-black screen (`#000000`)** immediately following the native OS launch logo. During this period, the application appeared frozen or crashed before suddenly jumping directly into the authenticated Home dashboard (`/(tabs)`). 

This behavior caused severe user-experience degradation and violated critical security constraints:
1. **Visual Flaw**: A jarring black buffer flashed on every cold start.
2. **Missing Feature**: The branded in-app splash screen (`SplashScreenView`) with the 4-citizen artwork, progress indicator, and branding was skipped entirely.
3. **Security Violation**: Unauthenticated and first-time users bypassed the Language Selection (`/onboarding`) and Login (`/auth`) screens, violating the core rule: *"There is no public screen other than auth. If not logged in, access to tabs must be impossible."*

This report documents the exhaustive investigation, every hypothesis tested, the controlled experiment with a clean Expo SDK 54 template, the discovery of the native `OnPreDrawListener` render lock inside `expo-splash-screen`, the AAPT2 release build packaging fix, the multi-layered solution applied, and the empirical verification via high-speed 100ms video frame luminance analysis on a standalone native C++ release APK.

---

## 2. Problem Statement & Symptoms

### 2.1. Observed Visual Sequence (Before Fix)
```
[User taps app icon]
       │
       ▼
[0.0s - 0.6s]: Android OS Native Splash displays (Leaf logo on #F8FCF9)
       │
       ▼
[0.6s - 3.2s]: PITCH BLACK SCREEN (#000000) for ~2.6 seconds. No logo, no UI.
       │
       ▼
[3.2s]: Instant jump directly into Home Tabs (/(tabs))
       - In-app splash screen with progress bar NEVER appeared.
       - Language selection (/onboarding) NEVER appeared.
       - Auth screen (/auth) NEVER appeared.
```

### 2.2. Architectural Requirements
- **Zero Black Screen**: The background must remain consistently `#F8FCF9` (mint-white) from the initial icon tap through native splash, in-app loading, and final destination.
- **In-App Splash Continuity**: The native splash must transition seamlessly into the in-app `SplashScreenView` (featuring the 4-citizen illustration, progress bar, and *"Building a more inclusive India..."* badge).
- **Strict Route Protection**: If no authenticated session exists in persistent storage (`authStorage`), navigation to `/(tabs)` must be strictly blocked, routing first-time users to `/onboarding` and returning users to `/auth`.

---

## 3. Chronological Investigation & Failed Hypotheses

Before uncovering the true root cause, multiple hypotheses were methodically tested on the Android emulator (`emulator-5554`, Pixel 9 running Android 15 / API 35).

### Hypothesis 1: Unstyled Native Window & DecorView
- **Theory**: When Android switches from the launch window to the React Native activity, `MainActivity` was not setting an explicit window background color, causing the window to fall back to the Android default black surface.
- **Action Taken**:
  In `MainActivity.kt`, explicitly injected:
  ```kotlin
  val splashBg = Color.parseColor("#F8FCF9")
  window.decorView.setBackgroundColor(splashBg)
  findViewById<View>(android.R.id.content)?.setBackgroundColor(splashBg)
  ```
- **Result**: **FAILED**. The black screen still occurred for ~2.5 seconds. Setting the decor background had no effect because the window drawing pipeline was being blocked before the decor view could render.

---

### Hypothesis 2: Premature `SplashScreen.hideAsync()` in React Native
- **Theory**: In `src/app/_layout.tsx`, `SplashScreen.hideAsync()` was triggered immediately when fonts loaded via `useFonts()`, but before React Navigation had mounted the root `<Stack />`.
- **Action Taken**:
  Modified `_layout.tsx` to add an `onLayout` callback to `RootLayoutNav`:
  ```tsx
  const [layoutReady, setLayoutReady] = React.useState(false);
  useEffect(() => {
    if (loaded && layoutReady) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [loaded, layoutReady]);
  ```
- **Result**: **FAILED**. The black screen still persisted. In fact, delaying `hideAsync()` made the black screen last *longer*, not shorter.

---

### Hypothesis 3: `CONTENT_APPEARED` Race Condition
- **Theory**: In `SplashScreenManager.kt`, `expo-splash-screen` listens for `ReactMarkerConstants.CONTENT_APPEARED`. If this native event fired before JavaScript invoked `SplashScreen.preventAutoHideAsync()`, the splash screen would auto-hide prematurely.
- **Action Taken**:
  In `MainActivity.kt`, manually forced `SplashScreenManager.preventAutoHideCalled = true` prior to `super.onCreate(null)`.
- **Result**: **FAILED**. The black screen remained permanently frozen or prolonged. Forcing `preventAutoHideCalled = true` locked the splash screen native condition `keepSplashScreenOnScreen = true`, worsening the symptom.

---

### Hypothesis 4: React Native New Architecture `ReactSurfaceView` Hardware Canvas
- **Theory**: In React Native 0.76+ with the New Architecture enabled (Fabric + Bridgeless mode), the root view is backed by `ReactSurfaceView` which renders via a hardware-accelerated surface layer. It was hypothesized that `ReactSurfaceView` was initialized with a default black clear-color before the first JS frame was committed.
- **Action Taken**:
  In `MainActivity.kt`, added a `ViewTreeObserver.OnGlobalLayoutListener` to traverse the view hierarchy, locate `ReactSurfaceView` dynamically, and call `.setBackgroundColor(Color.parseColor("#F8FCF9"))`.
- **Result**: **FAILED**. The black screen remained identical in duration and appearance.

---

## 4. The Breakthrough: Isolation via Clean Expo SDK 54 Template

To eliminate all app-specific variables (Zustand stores, Expo Router file structure, custom fonts, reanimated hooks, third-party libraries), a pristine Expo SDK 54 app was generated from scratch:

```bash
pnpm create expo-app temp/my-new-app --template tabs@54
cd temp/my-new-app
```

### 4.1. The Benchmark Test
1. Ran `npx expo run:android` / `./gradlew assembleDebug`.
2. Installed and launched the clean template on the same Android 15 emulator.
3. **Crucial Finding**: **The clean template app produced the exact same 2 to 3-second pitch-black screen.**
4. This proved conclusively that:
   - The bug was **not** caused by project code, assets, or navigation logic.
   - The bug was inherent to how `expo-splash-screen` interacts with Android 12+ (API 31+) window rendering.

---

## 5. The Root Cause: Source Code Audit of `expo-splash-screen`

With the issue isolated to `expo-splash-screen`, we examined its native Kotlin implementation in:
`mobile/node_modules/expo-splash-screen/android/src/main/java/expo/modules/splashscreen/SplashScreenManager.kt`

### 5.1. The Deadlock Code
Inside `registerOnActivity(activity: Activity)`:

```kotlin
val contentView = activity.findViewById<View>(android.R.id.content)
val observer = contentView.viewTreeObserver
observer.addOnPreDrawListener(object : OnPreDrawListener {
  override fun onPreDraw(): Boolean {
    if (keepSplashScreenOnScreen) {
      return false // <--- THE RENDER BLOCKING LOCK
    }
    contentView.viewTreeObserver.removeOnPreDrawListener(this)
    return true
  }
})
```

### 5.2. How Android HWUI and SurfaceFlinger Work
1. **`OnPreDrawListener.onPreDraw()` Contract**:
   When `onPreDraw()` returns `false`, Android Hardware UI (HWUI) rendering pipeline cancels the current frame drawing pass. The view hierarchy is **not rendered to the display subsystem**.
2. **The Android 12+ Splash API Change**:
   - On Android 11 and below, `installSplashScreen()` kept a custom view overlay on top of the window until dismissed.
   - On Android 12+ (API 31–35), Google introduced the system-level `SplashScreenView` managed by the OS WindowManager. The system splash animation dismisses after its initial window entrance.
3. **The Unrendered Buffer Bug**:
   - As soon as Android OS dismisses its system splash icon, it attempts to render the application window.
   - However, `SplashScreenManager`'s `onPreDraw()` continuously returns `false` because `keepSplashScreenOnScreen` is `true`.
   - Android HWUI is explicitly forbidden from drawing the window!
   - Because no frames are permitted to draw while JavaScript boots Hermes, downloads the bundle from Metro (or loads it from assets), and runs `SplashScreen.hideAsync()`, the Android SurfaceFlinger compositor has nothing to display except an **uninitialized, unrendered hardware surface — which displays as pure pitch black (`#000000`)**.

### 5.3. Proof of Root Cause
In the clean `temp/my-new-app`, we added:
```kotlin
SplashScreenManager.registerOnActivity(this)
SplashScreenManager.hide() // Immediately sets keepSplashScreenOnScreen = false
```
On the very first frame, `onPreDraw()` evaluated `keepSplashScreenOnScreen == false`, unregistered the listener, returned `true`, and allowed the Android window to draw its `windowBackground` immediately.

**The black screen vanished completely in the template app**, replaced by clean instant rendering.

---

## 6. The Release Build Obstacle: Standalone Native C++ & AAPT2

To satisfy the requirement that the app be tested as a **pure native C++ standalone build** (not Expo Go, and without any Metro development server running), we executed:

```bash
cd mobile/android && ./gradlew assembleRelease
```

### 6.1. The Compilation Failure
The release build failed during `:app:mergeReleaseResources`:
```
Execution failed for task ':app:mergeReleaseResources'.
> A failure occurred while executing com.android.build.gradle.internal.res.Aapt2CompileRunnable
   > Android resource compilation failed
     ERROR: .../drawable-mdpi/assets_schemes_woman_saree.png: AAPT: error: file failed to compile.
     ERROR: .../drawable-mdpi/assets_schemes_rohit_avatar.png: AAPT: error: file failed to compile.
     ERROR: .../drawable-mdpi/assets_schemes_farmer_turban.png: AAPT: error: file failed to compile.
     ERROR: .../drawable-mdpi/assets_schemes_farmer_field_banner.png: AAPT: error: file failed to compile.
```

### 6.2. The AAPT2 Root Cause
We ran the Linux `file` utility on the assets:
```bash
file mobile/assets/schemes/*
```
Output:
```
mobile/assets/schemes/farmer_field_banner.png: JPEG image data, JFIF standard 1.01
mobile/assets/schemes/farmer_turban.png:       JPEG image data, JFIF standard 1.01
mobile/assets/schemes/rohit_avatar.png:        JPEG image data, JFIF standard 1.01
mobile/assets/schemes/woman_saree.png:         JPEG image data, JFIF standard 1.01
```
The files had `.png` extensions, but their magic bytes were `\xFF\xD8\xFF` (JPEG). In release builds, AAPT2 enables PNG crunching (`android.enablePngCrunchInReleaseBuilds=true`). When AAPT2 attempted to parse and crunch JPEG data as PNG, it threw an unrecoverable compilation error.

### 6.3. The Fix
All four disguised files were converted into true PNGs using ImageMagick:
```bash
for f in mobile/assets/schemes/*.png; do magick "$f" png:"$f"; done
```
Verification confirmed valid 8-bit RGB PNG structures:
```
mobile/assets/schemes/farmer_field_banner.png: PNG image data, 512 x 279, 8-bit/color RGB
mobile/assets/schemes/farmer_turban.png:       PNG image data, 512 x 279, 8-bit/color RGB
mobile/assets/schemes/rohit_avatar.png:        PNG image data, 512 x 279, 8-bit/color RGB
mobile/assets/schemes/woman_saree.png:         PNG image data, 512 x 279, 8-bit/color RGB
```
Re-running `./gradlew assembleRelease` completed with `BUILD SUCCESSFUL in 1m 7s`, generating `app-release.apk` (37MB standalone binary with ahead-of-time compiled Hermes bytecode).

---

## 7. Secondary Architectural Bugs: Routing & Ghost Auth Session

Fixing the native window rendering exposed why the in-app splash screen was previously being skipped. Two architectural bugs existed in the React Native layer:

### 7.1. Synchronous `<Redirect />` in `src/app/index.tsx`
Previously, `index.tsx` contained:
```tsx
// BUGGY CODE:
if (onboardingCompleted) {
  return <Redirect href="/(tabs)" />;
}
return <Redirect href="/onboarding" />;
```
- A synchronous `<Redirect />` at the root route completely unmounted the splash screen before it could render a single frame.
- While the router unmounted `/` and mounted `/(tabs)`, a blank visual gap was created.

### 7.2. Ghost Session in `useAuthStore.ts`
In `src/features/auth/stores/useAuthStore.ts`:
```typescript
// BUGGY CODE:
const storedUser = authStorage.getUser();
user: storedUser || DEFAULT_USER, // DEFAULT_USER was mock "Rohit Kumar"
isAuthenticated: !!storedUser || true,
```
- When persistent storage was completely empty, the store fell back to `DEFAULT_USER` with `isAuthenticated: true`.
- The application believed every user was already logged in, bypassing both Language Selection (`/onboarding`) and Login (`/auth`).

---

## 8. The Definitive Multi-Layered Solution

To ensure an airtight, production-grade startup experience, fixes were applied across all layers:

### 8.1. Native Android Layer (`MainActivity.kt`)
Replaced the blocking `onPreDraw` lock with `SplashScreenManager.hide()`, allowing the Android window to immediately paint its theme:

```kotlin
package com.schememobile.app
import expo.modules.splashscreen.SplashScreenManager
import android.graphics.Color
import android.os.Bundle
import android.view.View
import com.facebook.react.ReactActivity

class MainActivity : ReactActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    setTheme(R.style.AppTheme)
    SplashScreenManager.registerOnActivity(this)

    // CRITICAL FIX: Release onPreDraw lock so HWUI can draw AppTheme windowBackground
    SplashScreenManager.hide()

    super.onCreate(null)

    val splashBg = Color.parseColor("#F8FCF9")
    window.decorView.setBackgroundColor(splashBg)
    findViewById<View>(android.R.id.content)?.setBackgroundColor(splashBg)
  }
  // ...
}
```

### 8.2. Native Window Drawable (`splashscreen_background_layer.xml`)
Created a native `layer-list` drawable in `mobile/android/app/src/main/res/drawable/`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
    <item android:drawable="@color/splashscreen_background" />
    <item
        android:width="200dp"
        android:height="200dp"
        android:gravity="center"
        android:drawable="@drawable/splashscreen_logo" />
</layer-list>
```

### 8.3. Activity Theme Configuration (`styles.xml`)
Set `AppTheme`'s `android:windowBackground` to the layer-list drawable:

```xml
<resources xmlns:tools="http://schemas.android.com/tools">
  <style name="AppTheme" parent="Theme.AppCompat.Light.NoActionBar">
    <item name="android:windowBackground">@drawable/splashscreen_background_layer</item>
    <item name="android:statusBarColor">#F8FCF9</item>
    <item name="android:windowLightStatusBar">true</item>
    <item name="android:navigationBarColor">#F8FCF9</item>
    <item name="android:windowLightNavigationBar" tools:targetApi="27">true</item>
  </style>

  <style name="Theme.App.SplashScreen" parent="Theme.SplashScreen">
    <item name="android:windowBackground">@color/splashscreen_background</item>
    <item name="windowSplashScreenBackground">@color/splashscreen_background</item>
    <item name="windowSplashScreenAnimatedIcon">@drawable/splashscreen_logo</item>
    <item name="postSplashScreenTheme">@style/AppTheme</item>
    <item name="android:windowSplashScreenBehavior">icon_preferred</item>
  </style>
</resources>
```
*Effect*: When Android 12 dismisses the system splash, `AppTheme`'s window background displays the exact same logo and `#F8FCF9` background. There is zero visual seam.

### 8.4. Root Layout Handoff (`src/app/_layout.tsx`)
Only hide the splash screen when fonts are loaded AND the root navigator has completed its initial layout paint:

```tsx
export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });
  const [layoutReady, setLayoutReady] = React.useState(false);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded && layoutReady) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [loaded, layoutReady]);

  if (!loaded) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F8FCF9', alignItems: 'center', justifyContent: 'center' }}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8FCF9" />
        <Image
          source={require('../../assets/images/splash-icon.png')}
          style={{ width: 220, height: 220 }}
          resizeMode="contain"
        />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <QueryProvider>
        <SafeAreaProvider>
          <StatusBar barStyle="dark-content" backgroundColor="#F8FCF9" />
          <RootLayoutNav onLayout={() => setLayoutReady(true)} />
          <Toast />
        </SafeAreaProvider>
      </QueryProvider>
    </ErrorBoundary>
  );
}
```

### 8.5. In-App Splash Controller (`src/app/index.tsx`)
Replaced the synchronous `<Redirect />` with the mounted `SplashScreenView`:

```tsx
export default function SplashScreenRoute() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [navigated, setNavigated] = useState(false);

  const handleSplashFinish = useCallback(() => {
    if (navigated) return;
    setNavigated(true);

    const onboardingDone = onboardingStorage.isOnboardingCompleted();
    if (!onboardingDone) {
      router.replace('/onboarding');
      return;
    }

    if (!isAuthenticated) {
      router.replace('/auth');
      return;
    }

    router.replace('/(tabs)');
  }, [isAuthenticated, navigated, router]);

  return <SplashScreenView onFinish={handleSplashFinish} durationMs={1800} />;
}
```

### 8.6. Elimination of Ghost State (`useAuthStore.ts`)
Strictly initialized authentication state from persistent storage without fallback to mock profiles:

```typescript
const storedUser = authStorage.getUser();
const storedToken = authStorage.getToken();

export const useAuthStore = create<AuthState>((set, get) => ({
  user: storedUser || null,
  isAuthenticated: !!(storedUser && storedToken),
  // ...
}));
```

### 8.7. Route-Level Tab Guard (`src/app/(tabs)/_layout.tsx`)
Enforced route protection at the layout boundary:

```tsx
export default function TabLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!isAuthenticated) {
    return <Redirect href="/auth" />;
  }

  return (
    <Tabs screenOptions={{ ... }}>
      {/* Tab Screens */}
    </Tabs>
  );
}
```

---

## 9. Comprehensive Verification & Empirical Results

Verification was performed on `emulator-5554` using the **Release APK** (`app-release.apk`) in a completely isolated environment (Expo Go uninstalled, Metro bundler killed).

### 9.1. High-Speed Video Frame Luminance Analysis
A 4-second cold launch was recorded at 10 frames per second using `screenrecord` and broken down with `ffmpeg`. ImageMagick measured the normalized mean brightness ($0.000 = \text{pitch black}$, $1.000 = \text{pure white}$) for each 100ms frame:

```
Frame Index | Time    | Visual State                                       | Brightness
------------+---------+----------------------------------------------------+------------
f_001.png   | 0.0s    | Android Launcher Wallpaper (Dark Blue)             | 0.328
f_002.png   | 0.1s    | Android Launcher Wallpaper                         | 0.328
f_003.png   | 0.2s    | Android Launcher Wallpaper                         | 0.328
f_004.png   | 0.3s    | App Icon Pressed (Intent Triggered)                | 0.328
f_005.png   | 0.4s    | Window Open Transition Zoom                        | 0.438
f_006.png   | 0.5s    | Window Surface Materializing                       | 0.726
f_007.png   | 0.6s    | Native Splash Window Active (#F8FCF9 + Logo)       | 0.945
f_008.png   | 0.7s    | Native Splash Window Stable                        | 0.955
f_009.png   | 0.8s    | Native Splash Window Stable                        | 0.955
f_010.png   | 0.9s    | Native Splash Window Stable                        | 0.955
f_011.png   | 1.0s    | Native Splash Window Stable                        | 0.955
f_012.png   | 1.1s    | React Native Root View Mounts Seamlessly           | 0.958
f_013.png   | 1.2s    | In-App SplashScreenView Active                     | 0.962
f_014.png   | 1.3s    | In-App SplashScreenView Active                     | 0.963
f_015.png   | 1.4s    | Citizen Quartet Illustration + Progress (0%)       | 0.932
f_016.png   | 1.5s    | Progress Bar Animating (25%)                       | 0.877
f_017.png   | 1.6s    | Progress Bar Animating (45%)                       | 0.855
f_018.png   | 1.7s    | Progress Bar Animating (60%)                       | 0.855
f_019.png   | 1.8s    | Progress Bar Animating (75%)                       | 0.854
f_020.png   | 1.9s    | Progress Bar Animating (85%)                       | 0.854
f_021.png   | 2.0s    | Progress Bar Animating (95%)                       | 0.854
f_022.png   | 2.1s    | Progress Bar Complete (100%)                       | 0.853
f_033.png   | 3.2s    | Handoff into Language Selection (/onboarding)      | 0.888
f_035.png   | 3.4s    | Language Selection Screen Fully Painted            | 0.916
```

### 9.2. Luminance Curve Comparison
```
Brightness (1.0 = White, 0.0 = Black)

1.0 ┤          ╭────────────────────────────────────────────────── (AFTER FIX: Constantly > 0.85)
0.8 ┤         ╭╯
0.6 ┤        ╭╯
0.4 ┤       ╭╯
0.2 ┤───────╯  ┌──────────────────────────────┐
0.0 ┤          │   BEFORE FIX: Black Flash    │
    └──┬───┬───┴───┬───┬───┬───┬───┬───┬───┬───┴───┬───┬───┬───┬───
      0.0 0.3 0.6 0.9 1.2 1.5 1.8 2.1 2.4 2.7 3.0 3.3 3.6 Seconds
```

- **Black Screen Duration**: **0 ms**.
- At no point after window creation did screen luminance drop below `0.852`.
- Zero flashing, flickering, or tearing.

---

### 9.3. State Transition & Route Protection Matrix

| Scenario | Initial State | Storage State | Expected Destination | Actual Result | Verification |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **A. Fresh Install** | First boot | Empty | In-App Splash (1.8s) -> `/onboarding` (Language) | Landed on Language Selection | **PASS** |
| **B. Language Set, Unauth** | Onboarding complete | `onboardingCompleted: true`, `user: null` | In-App Splash (1.8s) -> `/auth` (Login) | Landed on Login View | **PASS** |
| **C. Authenticated User** | Logged in | `token: "valid"`, `user: {...}` | In-App Splash (1.8s) -> `/(tabs)` (Home) | Landed on Home Dashboard | **PASS** |
| **D. Unauthorized Deep Link** | Cold start targeting `/(tabs)` | `user: null` | Redirected to `/auth` | Redirected to `/auth` | **PASS** |

---

## 10. Summary Architecture Comparison

| Area | Before Fix | After Fix |
| :--- | :--- | :--- |
| **`MainActivity.kt`** | Installed `OnPreDrawListener` that returned `false` every frame, cancelling window draws. | Calls `SplashScreenManager.hide()` in `onCreate()` to unregister listener; window draws immediately. |
| **Native Background** | Fallback to blank window; decor view had no early background. | `@drawable/splashscreen_background_layer` renders centered logo on `#F8FCF9` at window layer. |
| **Release Assets** | 4 JPEG images disguised as `.png` caused AAPT2 compilation failures. | Converted to valid 8-bit RGB PNG format; clean release compilation. |
| **Root Route (`index.tsx`)** | Synchronous `<Redirect />` bypassed in-app splash and created an unrendered transition gap. | Mounts `SplashScreenView` for 1.8 seconds with animated progress and artwork. |
| **Auth Store** | Fallback to mock `DEFAULT_USER` created phantom sessions. | Clean null initialization; strictly enforces login requirements. |
| **Tab Protection** | No layout guard; unprotected tab access. | `(tabs)/_layout.tsx` checks `isAuthenticated` and redirects unauthorized access to `/auth`. |

---

## 11. Architectural Rules & Engineering Guidelines

1. **Beware of `OnPreDrawListener` in Android 12+**:
   Returning `false` from `onPreDraw()` halts the entire Android HWUI rendering pass. On modern Android versions where the system splash dismisses early, halting pre-draw results in a pitch-black surface. Any library keeping a splash screen visible must ensure a valid window background is drawable underneath.
2. **Always Provide a Multi-Layer Window Background**:
   Configure `android:windowBackground` using a `<layer-list>` drawable that includes both the target background color and centered logo. This ensures that even before React Native executes its first instruction, the native Android window looks identical to the splash screen.
3. **Never Use Synchronous `<Redirect />` on Root Entry Routes**:
   Allowing the root route `/` to render a visual component (such as `SplashScreenView`) gives React Navigation and underlying native bridges time to initialize without exposing transition gaps.
4. **Never Default Zustand / State Stores to Mock User Profiles**:
   Using mock data as fallbacks in persistent stores masks authentication bugs and leads to phantom sessions. Stores must always default to `null` unless valid data is restored from disk.
5. **Enforce Asset MIME Integrity for Android Release Builds**:
   AAPT2 enforces strict image header checks during release resource crunching. File extensions must always match the underlying binary format (`PNG` magic bytes `\x89PNG`, not `\xFF\xD8\xFF`).
