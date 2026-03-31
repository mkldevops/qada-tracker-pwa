# Implementation Plan: Sujood Detection on Chrome (DeviceOrientationEvent)

## Overview

Extend `useProximitySensor.ts` with a 3rd fallback layer using `DeviceOrientationEvent` (beta angle). The existing ProximitySensor → deviceproximity chain is preserved unchanged. The new layer triggers between that chain and the `isSupported=false` fallback. The hook's return interface `{ isSupported, isActive, currentState }` stays identical — Session.tsx requires only a small iOS 13+ permission call addition.

**Detection algorithm:**
1. Capture `event.beta` as baseline on the first orientation event when session becomes active
2. When `|beta - baseline| > 50°` → enter sujood (record timestamp)
3. When in sujood AND elapsed ≥ 300ms AND `|beta - baseline| < 25°` → sujood complete → call `handleProximityDetection(true)`
4. `handleProximityDetection` already handles the 800ms debounce and first/second callbacks

## Dependencies

No external dependencies. `DeviceOrientationEvent` is a native browser API available since Chrome 7+ (HTTPS required in modern Chrome).

## File Changes

### `src/hooks/useProximitySensor.ts`

- **Support detection** (lines 29-33): Add `const hasDeviceOrientation = typeof window.DeviceOrientationEvent !== 'undefined'` and include it in `hasSupport = hasProximitySensor || hasDeviceProximity || hasDeviceOrientation`
- **New refs**: Add `betaBaselineRef` (number | null) and `sujoodDownTimeRef` (number, 0 = not in sujood) alongside existing refs
- **Orientation handler function** `setupDeviceOrientationFallback()`: placed after `setupDeviceProximityFallback()`:
  - Returns early if `event.beta === null`
  - On first call with `betaBaselineRef.current === null`: capture baseline and return
  - Compute `delta = Math.abs(event.beta - betaBaselineRef.current)`
  - If `sujoodDownTimeRef.current === 0` and `delta > 50`: set `sujoodDownTimeRef.current = Date.now()`
  - If `sujoodDownTimeRef.current !== 0` and `delta < 25` and `elapsed ≥ 300`: reset `sujoodDownTimeRef.current = 0`, call `handleProximityDetection(true)`
  - Register with `window.addEventListener('deviceorientation', handler)`
  - Store handler reference in `sensorRef.current` for cleanup
- **Fallback chain**: In the existing chain, after `setupDeviceProximityFallback()` is tried (when neither ProximitySensor works), add orientation as final electronic fallback: if proximity APIs unavailable but `hasDeviceOrientation`, call `setupDeviceOrientationFallback()` instead of letting the code fall through to `isSupported=false`
- **Baseline reset**: On `active` becoming false or on cleanup, reset `betaBaselineRef.current = null` and `sujoodDownTimeRef.current = 0` so next session starts fresh
- **Cleanup**: Extend `setupCleanup()` to also remove the orientation event listener when `sensorRef.current` holds an orientation handler; distinguish from proximity handler by checking handler type (or use a separate `orientationHandlerRef`)
- **Pattern to follow**: `setupDeviceProximityFallback()` at lines 111-119 as the exact model for `setupDeviceOrientationFallback()`

### `src/components/Session.tsx`

- **Locate**: Find the "Démarrer" button click handler (where `setPhase('active')` or equivalent is called)
- **Add iOS permission**: Before activating the session, add an async wrapper that calls `(DeviceOrientationEvent as any).requestPermission?.()` if it exists as a function, awaits the result, and proceeds regardless of outcome (permission denied = falls back to manual, which already works)
- **No structural changes**: The hook invocation and `sensorState` consumption at lines 265-276 and 516-549 remain unchanged

### `src/hooks/useProximitySensor.test.ts`

- **Support detection test**: Mock `window.DeviceOrientationEvent` to be defined (while keeping ProximitySensor and ondeviceproximity undefined) → verify `isSupported === true`
- **Baseline capture test**: Fire first `deviceorientation` event with any beta value → assert no sujood fired (baseline capture only)
- **Sujood detection test**: After baseline (beta=0), fire event with beta=60 (delta=60 > 50°), wait >300ms, fire event with beta=5 (delta=5 < 25°) → verify `onFirstSujood` called
- **Two sujoods test**: Same sequence twice with >800ms gap → verify `onFirstSujood` then `onSecondSujood`
- **Minimum duration test**: Go to beta=60, immediately return to beta=5 (< 300ms) → verify no callback fired (false positive avoided)
- **iOS permission test**: Mock `DeviceOrientationEvent.requestPermission` as an async function returning 'granted' → verify it's called when session starts
- **Pattern to follow**: Existing proximity tests in the file as model for event dispatch and cleanup

## Testing Strategy

- Run `pnpm run build` (type-check + vite build) after each file change
- Run `pnpm test` scoped to `useProximitySensor.test.ts` after test additions
- Manual verification: impossible in automated tests for real device orientation, but the mock-based tests cover the logic paths

## Rollout Considerations

- HTTPS is already enforced in production (qada.fahari.pro) — no change needed
- iOS 13+ users will see a native permission dialog on first "Démarrer" tap — this is a one-time browser prompt, standard UX
- Beta threshold of 50° is conservative; too aggressive would cause false positives in daily carry. Can be tuned via a constant if needed
- The manual button fallback (`!sensorState.isSupported`) remains intact and still shows for browsers where none of the 3 detection methods work (desktop Chrome without device sensors, etc.)
