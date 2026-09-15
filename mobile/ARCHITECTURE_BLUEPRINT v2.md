# 🏛️ The Production App Architecture Blueprint & Master Playbook (v2 — Right-Sized)

> **A domain-agnostic specification for building React Native & full-stack apps, scaled to reality.**
> _Use this blueprint whenever starting a new mobile or full-stack project. Read the "Scale This" note before you scaffold anything._

---

## ⚖️ 0. Scale This To Your Project — Read First

This blueprint has two tiers. Pick honestly before you start:

- **Solo / MVP / early-stage app (1 dev, no team, <10k users):** Use the **Lean Core** below. Skip anything marked 🔶 _Add later_ until you actually hit the problem it solves.
- **Team app / funded product / >10k users / compliance requirements:** Use the **Full Core**, including the 🔶 items.

Most new projects — including yours — start Lean. Infrastructure built before it's needed is just unpaid work with extra steps. Add a 🔶 item the day you feel real pain from not having it, not before.

---

## 📐 1. The Core 3-Tier Layout

```text
src/
├── app/          # 1. Navigation & Routing (Expo Router v6 file-based routes)
├── core/         # 2. Shared System Foundations
├── features/     # 3. Domain Feature Modules (Self-contained business units)
└── types.ts      # 4. Global application-level type declarations
```

This layout doesn't change between Lean and Full — only what's _inside_ `core/` does.

---

## 🧱 2. The `src/core/` Specification

```text
src/core/
├── api/
│   ├── client.ts                  # Cloud SDK initialization (Firebase / Supabase / GraphQL)
│   ├── entityMappers.ts           # Pure functions mapping raw DB/API payloads to typed domain entities
│   ├── httpClient.ts              # Traced fetch client (X-Request-ID, 10s default timeout, Result returns)
│   └── index.ts
│
├── components/
│   ├── Button.tsx / Card.tsx / Badge.tsx / Input.tsx / Toast.tsx / TopBar.tsx
│   ├── FeatureGate.tsx            # Declarative flag gate: <FeatureGate flag="..." fallback={...}>
│   ├── DeviceFrame.tsx            # 🔶 Add later — only if you need web/tablet preview bezels
│   └── index.ts
│
├── config/
│   ├── config.schema.ts           # Zod schema validating required env vars — keep, cheap and catches real bugs
│   ├── config.ts                  # Validated runtime configuration singleton
│   ├── flags.ts                   # Flat const object of booleans. See §5.6 — NOT a Zod schema.
│   └── index.ts
│
├── errors/
│   ├── result.ts                  # Type-safe Result<T, E> envelope: { ok: true, data } | { ok: false, error }
│   ├── error-handler.ts           # AppError class, captureError() — forwards to Crashlytics/Sentry, no custom logging
│   ├── ErrorBoundary.tsx          # Root React crash recovery fallback with retry action + captureError() call
│   └── index.ts
│   # NOTE: no breadcrumbs.ts. See §5.4 — use a hosted crash tool instead of building one.
│
├── network/
│   ├── useNetworkStatus.ts        # NetInfo listener auto-triggering offline queue sync on reconnect
│   └── index.ts
│
├── query/
│   ├── queryClient.ts             # QueryClient instance (staleTime: 5m default — override per-query where data is time-sensitive)
│   ├── QueryProvider.tsx
│   └── index.ts
│
├── storage/
│   ├── mmkv.ts                    # Synchronous storage for UI cache, cart, & client state
│   ├── secureStorage.ts           # Hardware-encrypted storage (iOS Keychain / Android Keystore) for auth tokens
│   ├── biometrics.ts              # 🔶 Add later — only if the app handles sensitive data beyond payment
│   │                               #    (payment security is the gateway's job, not the app's — see §5.5)
│   └── index.ts
│
└── theme/
    ├── colors.ts / spacing.ts / typography.ts / shadows.ts
    └── index.ts
```

---

## 🧩 3. The Feature Folder Blueprint

```text
src/features/<feature_name>/
├── components/     # Private UI sub-widgets used only inside this feature
├── hooks/          # React hooks & TanStack Query/Mutation hooks for this feature
├── models/         # Zod schemas + z.infer types — keep this, it's cheap insurance against bad API/DB data
├── repositories/   # Data access layer (queries, offline cache fallback, explicit mappers)
├── screens/        # Composite top-level screens rendered by app/ routes
├── store/          # Zustand reactive client state & MMKV disk persistence
├── __tests__/      # Tests — see §5.7, mix of integration AND unit, not integration-only
├── keys.ts         # Query key factories for TanStack Query caching
└── index.ts        # Barrel export — only public APIs exported
```

> **Empty Folder Rule (optional, not required):** Keeping empty folders with `.gitkeep` for symmetry is a stylistic choice. Skip it unless it genuinely helps your own navigation — don't scaffold folders you don't need yet.

---

## 🧭 4. `src/app/` (Expo Router Routing Layer)

```text
src/app/
├── _layout.tsx             # Root layout: SafeAreaProvider, ErrorBoundary, QueryProvider, Toast, Auth Gate
├── index.tsx               # Root redirect: forwards user to /(tabs)
├── (tabs)/
│   ├── _layout.tsx         # Tab bar configuration & feature-flag tab gating
│   ├── index.tsx           # Thin route -> renders <FeatureAScreen />
│   ├── explore.tsx
│   └── profile.tsx
├── <feature>/
│   └── [id].tsx            # Dynamic route -> renders <DetailScreen id={id} />
└── auth/
    └── login.tsx           # Modal presentation route -> renders <LoginScreen />
```

> **Root Auth Gateway Rule:** If the app requires upfront auth (no guest mode), gate `_layout.tsx` with `!user.isLoggedIn` to render `<LoginScreen />` full-screen.

---

## 🛡️ 5. The System Pillars (Right-Sized)

| #     | Pillar        | Technology                           | Rule                                                                       |
| :---- | :------------ | :----------------------------------- | :------------------------------------------------------------------------- |
| **1** | Navigation    | Expo Router v6                       | File-based routing, typed dynamic params, Root Auth Gateway when needed.   |
| **2** | Data Layer    | Repository Pattern + Mappers         | UI never touches raw SDKs directly. Zod mappers on all external data.      |
| **3** | Caching       | TanStack Query + MMKV                | Server state via `useQuery`; client/offline state via MMKV.                |
| **4** | Error System  | Result<T, E> + **hosted crash tool** | See §5.4 below.                                                            |
| **5** | Security      | SecureStore for tokens               | See §5.5 below — biometrics is opt-in, not default.                        |
| **6** | Feature Flags | Flat config object                   | See §5.6 below — Zod-schema flags only once you have >1 dev touching them. |
| **7** | Testing       | Mixed integration + unit             | See §5.7 below.                                                            |

### 5.4 — Error System: Use a hosted tool instead of building your own

Don't hand-build a breadcrumb ring buffer, action logger, or crash-context attacher. Use **Firebase Crashlytics** (free, and if you're already on Firebase for Auth/Firestore, zero new setup) or **Sentry** (nicer dashboard, also free tier) for React Native.

```ts
// error-handler.ts
export function captureError(
  error: unknown,
  context?: Record<string, unknown>,
) {
  crashlytics().recordError(error as Error); // or Sentry.captureException(error, { extra: context })
}
```

These tools already give you: automatic breadcrumbs (nav, taps, network), full stack traces, a web dashboard, alerting, and de-duplication of repeat errors — all things a hand-built system would take real hours to replicate worse. Keep `Result<T, E>` and `ErrorBoundary.tsx` — they're cheap, framework-agnostic, and still useful. Just have `ErrorBoundary` call `captureError()` instead of writing to a local buffer.

### 5.5 — Security: Payment gateway ≠ app lock

Your payment gateway (Stripe, Razorpay, etc.) already secures the actual transaction — card data, PCI compliance, fraud checks. That's non-negotiable and out of scope for this blueprint. **Biometric app-lock is a separate, optional layer** that guards _access to a screen_, not the money itself. Only add it (🔶) if the app stores something sensitive beyond a standard cart/checkout — health data, financial statements, private messages. A cake order does not need FaceID to view.

### 5.6 — Feature Flags: Start flat, upgrade only when it hurts

```ts
// core/config/flags.ts
export const flags = {
  enableAIChef: true,
  enableWishlist: true,
} as const;
```

Upgrade to Zod-schema flags + remote cloud merge + runtime QA overrides only when you actually have: a team shipping multiple flags a week, and a need to kill a feature in production without an app store release. Building that infrastructure before you have that problem is pure overhead — every new flag becomes more work to add than it needs to be.

### 5.7 — Testing: Don't skip unit tests for "integration-first" purity

Test complete user flows with integration tests, yes — but pure functions (entity mappers, Zod parsers, price calculators) are cheap and fast to unit test directly, and they're often where the costliest bugs live (e.g., a pricing engine that silently overcharges a customer). Don't dogmatically avoid unit tests in the name of "integration-only" — use whichever is more direct for what you're testing.

### 5.8 — Fallback content: keep it small

If a feature needs an offline/no-API fallback (e.g., an AI chat widget when the model is unreachable), a small static lookup for your top 3–4 FAQs is fine. It does not need its own schema, test suite, or "engine" branding — it's a few `if` statements, not a system.

---

## 📋 6. Step-by-Step New Project Checklist

### Phase 1: Tooling & Core Scaffolding

- [ ] Initialize Expo app, TypeScript strict mode (`"strict": true`).
- [ ] Configure `package.json` (`"main": "expo-router/entry"`), `babel.config.js`, test runner config.
- [ ] Scaffold `src/app/`, `src/core/`, `src/features/`.
- [ ] Implement `core/theme/` design tokens.
- [ ] Implement `core/components/` primitives (skip `DeviceFrame` unless you need web/tablet previews).
- [ ] Implement `core/errors/` (`result.ts`, `error-handler.ts` wired to Crashlytics/Sentry, `ErrorBoundary.tsx`).
- [ ] Implement `core/storage/` (`mmkv.ts`, `secureStorage.ts` — skip `biometrics.ts` unless justified).
- [ ] Implement `core/config/` (`config.schema.ts` for env vars, flat `flags.ts` for feature flags).
- [ ] Implement `core/query/` (`queryClient.ts`, `QueryProvider.tsx`).
- [ ] Implement `core/network/` (`useNetworkStatus.ts` with auto-sync on reconnect).
- [ ] Wire up Crashlytics or Sentry — five minutes, do it before Phase 2.

### Phase 2: Building Features (Repeated for Each Feature)

- [ ] `features/<feature>/models/<entity>.model.ts` — Zod schema + inferred type.
- [ ] `features/<feature>/repositories/<entity>.repository.ts` — returns `Result<T, AppError>`.
- [ ] `features/<feature>/store/use<Feature>Store.ts` — Zustand + MMKV persistence.
- [ ] `features/<feature>/keys.ts` + `hooks/use<Feature>Query.ts`.
- [ ] Private `components/`, top-level `screens/`.
- [ ] Tests: unit-test pure logic (mappers, calculators), integration-test full flows.
- [ ] Export public API through `index.ts`.

### Phase 3: Routing & App Assembly

- [ ] Mount routes in `src/app/(tabs)/` and dynamic `src/app/<feature>/[id].tsx`.
- [ ] Configure Root Auth Gateway in `_layout.tsx` if needed.
- [ ] Wrap root in `SafeAreaProvider`, `ErrorBoundary`, `QueryProvider`, `Toast`.
- [ ] Apply `useSafeAreaInsets()` for edge-to-edge layout.
- [ ] Run `tsc --noEmit` — 0 type errors.
- [ ] Run test suite — all passing.
- [ ] Release build: restrict ABI (`arm64-v8a`) if Android APK size matters, enable ProGuard/R8 + Hermes.

---

## 📦 7. Recommended Library Set

Same convention as §0: plain items are **defaults** — install them on every new project. 🔶 items are **if-needed** — only add when the specific feature they support is actually in scope.

### Auth

- **`@react-native-google-signin/google-signin`** — native one-tap Google sign-in. Default choice for Google auth.
- ~~`expo-auth-session`~~ — drop unless you need a _non-Google_ OAuth provider (GitHub, generic OIDC, etc.). Don't run two auth libraries for the same provider.

### Gestures & Animation

- **`react-native-gesture-handler`** — native-thread touch handling (swipe, drag, pinch). Default; Expo Router already depends on it internally for screen transitions, so it costs nothing to declare explicitly.
- **`react-native-reanimated`** — native-thread animation (springs, transitions, gesture-driven UI). Default alongside gesture-handler; the two are typically used together.

### Location & Maps

- **`expo-location`** — default. Even lightweight, non-obviously-location apps increasingly use device location for recommendations, nearest-store lookups, or delivery estimates — treat it as standard infra, not a special case.
- 🔶 **`react-native-maps`** — if-needed only. Add it only if you need a real interactive map rendered _inside_ the app. If a simple "open in Google/Apple Maps" deep link via `Linking` covers the use case, skip this — it's a heavier native dependency for a feature a plain link often satisfies.

### Payments

- 🔶 **`@stripe/stripe-react-native`** or **Razorpay's RN SDK** — if-needed, but flag clearly: **required before any real transaction**, not a nice-to-have. Simulated/mock payment flows are fine for development; do not ship a checkout flow to real users without a real gateway SDK wired in.

### Polish (defaults — cheap, broadly useful)

- **`expo-image`** — drop-in replacement for RN's `Image` with far better caching/performance. Default for any catalog, list, or feed with photos.
- **`expo-haptics`** — small tap/vibration feedback on key actions (add-to-cart, confirm). Default; cheap to add, noticeably improves feel.
- **`expo-font`** — default if the app uses any custom typeface beyond system fonts.
- **`date-fns`** or **`dayjs`** — default the moment the app has any date/time picker, scheduling, or slot logic. Raw JS `Date` math gets error-prone fast (timezones, formatting).
- **`expo-clipboard`** — default if the app surfaces any copyable value (order ID, promo code, referral link).
- 🔶 **`expo-notifications`** — if-needed. Add once there's a real backend event to notify about (order status change, price drop, etc.) — don't wire up push infra before there's a trigger for it.

### Crash Reporting (native)

- **`@react-native-firebase/app` + `@react-native-firebase/crashlytics`** — default alongside the `firebase` (web) SDK, not instead of it. The web SDK covers Auth/Firestore fine; Crashlytics specifically requires the native package because it hooks into native (Swift/Kotlin/C++) crash reporting that a JS-only SDK cannot access. Expect a native rebuild when adding this, same as `mmkv` or `google-signin`.
- 🔶 **`@react-native-firebase/messaging`** — if-needed, add together with `expo-notifications` if push notifications are in scope.

---

## 🤖 8. The "Copy-Paste Master Prompt" for AI Coding Assistants

```text
I am building a React Native app with Expo Router. Default to a LEAN, right-sized
architecture unless I explicitly tell you this is a multi-dev/production-scale project.

1. Directory Layout:
   - src/app/ (Expo Router thin routing layer + Root Auth Gateway if needed)
   - src/core/ (api, components, config, errors, network, query, storage, theme)
   - src/features/<name>/ (components, hooks, models, repositories, screens, store, __tests__, keys.ts, index.ts)
   - src/types.ts

2. Architectural Defaults:
   - TypeScript Strict Mode: 100% strict types, zero `any`, zero `@ts-ignore`.
   - Navigation: Expo Router v6 with typed dynamic routes [id].tsx.
   - Safe Area: useSafeAreaInsets() for edge-to-edge layout.
   - Data Layer: Repository pattern with Zod runtime mappers. Never call SDKs directly from UI.
   - Caching: TanStack Query for server state + MMKV for client persistence.
   - Errors: Result<T, E> return envelopes + root ErrorBoundary. Wire errors to Firebase
     Crashlytics or Sentry — do NOT hand-build breadcrumb/logging infrastructure.
   - Security: SecureStore (Keychain/Keystore) for tokens. Do NOT add biometric app-lock
     unless I explicitly ask for it — payment security is the payment gateway's job.
   - Feature Flags: a flat const object (core/config/flags.ts). Do NOT build Zod-schema
     flags, remote config merging, or QA override systems unless I explicitly ask.
   - Testing: mix unit tests (pure functions, mappers, pricing/calculation logic) with
     integration tests (full user flows). Don't skip unit tests for "integration-only" purity.
   - Fallbacks: if offline/no-API fallback content is needed, keep it to a small static
     lookup — not a formalized system with its own tests.
   - Style: focused functions, co-locate by feature, encapsulate via index.ts.

3. If I ask you to add biometrics, custom crash logging, schema-validated feature flags,
   or similar heavier infrastructure, add it — but only when I ask, not by default.

4. Library defaults (install these on every project unless told otherwise):
   - Auth: @react-native-google-signin/google-signin for Google sign-in. Do not also add
     expo-auth-session unless a non-Google OAuth provider is needed.
   - Gestures/animation: react-native-gesture-handler + react-native-reanimated, as defaults.
   - Location: expo-location, as a default — most apps end up needing it.
   - Polish: expo-image, expo-haptics, expo-font (if custom typefaces), date-fns or dayjs
     (if any date/time picker or scheduling exists), expo-clipboard (if any copyable value
     exists) — add these as defaults, they're cheap and broadly useful.
   - Crash reporting: keep the `firebase` web SDK for Auth/Firestore, and add
     @react-native-firebase/app + @react-native-firebase/crashlytics alongside it — native
     crash capture requires the native package regardless of which SDK handles Auth/data.

5. Library if-needed only (do NOT add unless the specific feature is in scope):
   - react-native-maps — only if an interactive in-app map is required; prefer a
     Linking-based "open in Maps" deep link when a full embedded map isn't necessary.
   - A real payment SDK (@stripe/stripe-react-native, Razorpay RN SDK, etc.) — required
     before any real transaction ships, but not needed while payment flow is still mocked.
   - expo-notifications (+ @react-native-firebase/messaging) — only once there's an actual
     backend event to notify about.
```
