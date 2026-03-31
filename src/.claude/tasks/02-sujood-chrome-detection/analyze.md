# Task: Fix sujood detection on Chrome (proximity sensor unavailable)

## Problem Statement

Le `ProximitySensor` et l'événement `deviceproximity` ont été **supprimés de Chrome 70 (oct 2018)** pour des raisons de vie privée. Sur Chrome (Android/Desktop), ni l'un ni l'autre ne sont disponibles → `isSupported = false` → l'app affiche le bouton manuel.

La solution actuelle fonctionne mais l'UX est dégradée. L'objectif est de **détection automatique via DeviceOrientationEvent/DeviceMotionEvent**, supportés par Chrome.

---

## Codebase Context

### Fichiers clés

- `src/hooks/useProximitySensor.ts` — Hook principal de détection
- `src/components/Session.tsx` — Composant session, consomme le hook
- `src/hooks/useProximitySensor.test.ts` — Tests unitaires du hook

### Architecture actuelle (`useProximitySensor.ts`)

```
Detection chain:
  1. ProximitySensor API (Generic Sensor) → Chrome 66+ MAIS supprimé en pratique
  2. deviceproximity event → Firefox/Android ancien
  3. → isSupported = false → bouton manuel dans Session.tsx
```

**Détection de support (lignes 28-31):**
```ts
const hasProximitySensor = typeof (window as any).ProximitySensor !== 'undefined';
const hasDeviceProximity = typeof (window as any).ondeviceproximity !== 'undefined';
const hasSupport = hasProximitySensor || hasDeviceProximity;
```

**Machine d'état:**
- `waiting_first` → détection proximity near → `onFirstSujood()` → `waiting_second`
- `waiting_second` → détection proximity near → `onSecondSujood()` + increment → `waiting_first`
- Debounce: 800ms entre détections

**Interface `UseProximitySensorResult`:**
```ts
{ isSupported: boolean; isActive: boolean; currentState: SensorState }
```

**Fallback manuel (`Session.tsx` lignes 516-549):**
```tsx
{!sensorState.isSupported && phase === 'active' && (
  // Bouton qui simule les 2 sujouds manuellement
)}
```

---

## Research Findings

### Pourquoi Chrome n'a plus le ProximitySensor

Chrome a supprimé `ProximitySensor` / `DeviceProximityEvent` en 2018 pour des raisons de confidentialité (fingerprinting de modèle d'appareil). Aucune chance de retour.

### APIs disponibles sur Chrome Android (HTTPS obligatoire)

| API | Chrome Android | Permission requise | Fiabilité |
|-----|---------------|-------------------|-----------|
| `DeviceOrientationEvent` | ✅ Oui | Non (HTTPS suffit) | Bonne |
| `DeviceMotionEvent` | ✅ Oui | Non (HTTPS suffit) | Bonne |
| `Accelerometer` (Generic Sensor) | ✅ Oui | `"accelerometer"` policy | Très bonne |
| `ProximitySensor` | ❌ Supprimé | — | — |

### Approche retenue : `DeviceOrientationEvent`

L'événement expose :
- `beta` : inclinaison avant/arrière (−180° à 180°)
  - Téléphone vertical (prière debout) : **beta ≈ 0–20°**
  - Téléphone couché face vers le bas (sujoud) : **beta proche de ±90° ou ±180°**
- `gamma` : inclinaison gauche/droite (−90° à 90°)

**Algorithme de détection :**
1. Capturer la **baseline** au début de la session (position initiale du téléphone)
2. Détecter quand `|beta - baseline|` dépasse un seuil (~50–60°)
3. État "en sujoud" → attendre le retour à la position initiale
4. Retour → sujoud terminé, incrémenter

**Alternative : `DeviceMotionEvent`**
- `accelerationIncludingGravity.z` ≈ +9.8 quand face vers bas
- Détection plus simple mais moins précise sur la direction

### Seuils recommandés

```
Sujoud (téléphone tenu en main) :
  beta change > 50° depuis baseline → sujoud "down"
  beta revient < 25° depuis baseline → sujoud "up" = sujoud comptabilisé

Durée minimale en position sujoud : 300ms (éviter faux positifs)
Debounce entre deux sujouds : 800ms (identique à l'actuel)
```

### Permission iOS 13+

Sur iOS 13+, `DeviceOrientationEvent` requiert une permission explicite via :
```ts
DeviceOrientationEvent.requestPermission?.()  // retourne 'granted' | 'denied'
```
→ À appeler sur un geste utilisateur (ex: bouton "Démarrer la session").

---

## Implementation Plan

### Stratégie : Étendre `useProximitySensor.ts` avec une 3ème couche

```
Detection chain révisée:
  1. ProximitySensor / deviceproximity → inchangé (Firefox, Android natif)
  2. DeviceOrientationEvent → NOUVEAU (Chrome Android, iOS 13+)
  3. → isSupported = false → bouton manuel (dernier recours)
```

### Fichiers à modifier

**`src/hooks/useProximitySensor.ts`** — Ajouter la détection orientation :
- Détecter `window.DeviceOrientationEvent` disponible
- Fonction `requestOrientationPermission()` pour iOS 13+
- Capturer baseline au démarrage (quand `active` passe à true)
- Algorithme de détection delta-beta avec seuil configurable
- Intégrer dans la chaîne de fallback après proximity

**`src/components/Session.tsx`** — Appel de permission :
- Ajouter `requestPermission()` dans le hook ou au démarrage de session
- Sur iOS : appeler `DeviceOrientationEvent.requestPermission()` au tap "Démarrer"

**`src/hooks/useProximitySensor.test.ts`** — Ajouter tests orientation :
- Mock DeviceOrientationEvent
- Tester détection sujoud via beta change
- Tester permission iOS 13+

---

## Key Files

- `src/hooks/useProximitySensor.ts:28` — Détection de support actuelle
- `src/hooks/useProximitySensor.ts:50-69` — Machine d'état de détection
- `src/hooks/useProximitySensor.ts:87-121` — Chaîne ProximitySensor + deviceproximity
- `src/components/Session.tsx:265-276` — Consommation du hook
- `src/components/Session.tsx:516-549` — Bouton manuel fallback

## Patterns à suivre

- Machine d'état existante `waiting_first` → `waiting_second` : **conserver identique**
- Debounce 800ms : **conserver identique**
- Callbacks `onFirstSujood()` / `onSecondSujood()` : **interface inchangée**
- Retour `{ isSupported, isActive, currentState }` : **interface inchangée** — Session.tsx ne doit pas changer

## Contraintes

- HTTPS obligatoire pour DeviceOrientationEvent (déjà le cas en prod sur qada.fahari.pro)
- iOS 13+ nécessite un appel à `DeviceOrientationEvent.requestPermission()` depuis un geste utilisateur → le bouton "Démarrer" dans Session.tsx est le bon endroit
- Le seuil de détection beta (~50°) est un compromis : trop bas = faux positifs, trop haut = non détecté
- L'approche baseline est importante : ne pas hardcoder un angle absolu car les utilisateurs tiennent le téléphone différemment
