# Flight Schedule Pro Mobile App

React Native mobile application for Flight Schedule Pro AI Rescheduler, built with Expo.

## Features

- ✅ Firebase Authentication
- ✅ Real-time notifications via Firebase Realtime Database
- ✅ Push notifications (FCM via Expo)
- ✅ Offline mode with data caching
- ✅ Camera integration for pre-flight inspection photos
- ✅ Dashboard with upcoming flights
- ✅ Weather alerts
- ✅ Flight management

## Setup

1. **Install dependencies:**
   ```bash
   cd mobile
   npm install
   ```

2. **Configure environment variables:**
   Create a `.env` file in the `mobile/` directory:
   ```env
   EXPO_PUBLIC_API_URL=https://your-api-url.com
   EXPO_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   EXPO_PUBLIC_FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id
   EXPO_PUBLIC_PROJECT_ID=your-expo-project-id
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```

4. **Run on iOS:**
   ```bash
   npm run ios
   ```

5. **Run on Android:**
   ```bash
   npm run android
   ```

## Building for Production

### iOS
```bash
npm run build:ios
npm run submit:ios
```

### Android
```bash
npm run build:android
npm run submit:android
```

## Project Structure

```
mobile/
├── app/                    # Expo Router app directory
│   ├── (auth)/            # Authentication screens
│   ├── (tabs)/            # Main app tabs
│   └── _layout.tsx        # Root layout
├── contexts/              # React contexts
│   └── AuthContext.tsx   # Authentication context
├── config/                # Configuration files
│   └── firebase.ts       # Firebase configuration
├── services/              # Service modules
│   ├── notifications.ts   # Push notification service
│   ├── camera.ts         # Camera/photo service
│   └── offline.ts        # Offline mode service
├── hooks/                # Custom React hooks
│   └── useFirebaseRealtime.ts
└── package.json
```

## Notes

- The app uses Expo Router for navigation
- Firebase Authentication is used for user authentication
- Real-time updates come from Firebase Realtime Database
- Push notifications use Expo's notification service (FCM on native)
- Offline mode caches data in AsyncStorage
- Camera functionality requires device permissions

