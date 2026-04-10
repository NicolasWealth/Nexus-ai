# Nexus AI — Autonomous Cross-Chain Liquidity Optimizer

A React + TypeScript + Vite app featuring a cyberpunk HUD, real-time Firebase-backed agent loop, privacy shield, and particle backgrounds.

## Quick Start

```bash
npm install
npm run dev
```

## Firebase Setup (optional)

Fill in `.env` with your Firebase project credentials to enable real-time multi-client sync.  
Leave all values blank to run in **simulation mode** (fully functional, no Firebase needed).

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_DATABASE_URL=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

## Firebase Database Rules

```json
{
  "rules": {
    "global_stream": {
      ".read": true,
      ".write": true
    }
  }
}
```

## Stack

- React 18 + TypeScript
- Vite 5
- Firebase Realtime Database
- Framer Motion
- Tailwind CSS v3
- tsParticles v3
- Lucide React

## Project Structure

```
src/
├── components/
│   ├── CyberpunkMatrixBackground.tsx
│   ├── InteractiveCard.tsx
│   ├── PrivacyShield.tsx
│   ├── TerminalOutput.tsx
│   └── TransactionHUD.tsx
├── hooks/
│   └── useLiquidityAgent.ts
├── services/
│   └── firebase.ts
├── App.tsx
└── main.tsx
```
