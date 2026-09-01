# thought of — native iPhone build

This is the native Expo/React Native source for Thought Of, upgraded from the browser prototype.

Current native milestone includes:

- Phone OTP authentication and profile setup
- Your People with circular private profile photos / initials fallback
- Filled thought dots for unread incoming Thoughts
- Text-only 60-character Thoughts
- Stable organic Thought bubble shapes
- Quick reactions: 😌 🥰 ❤️ 👀 👋 👍
- Expanded emoji picker via ＋
- One reaction per person per Thought, with toggle/change behavior
- Tap-to-reveal timestamps
- 10-second Rethink, still server-enforced
- Supabase Realtime for Thoughts and reactions while history is open
- Native Expo push token registration and existing notification Edge Function integration
- Exact locked Thought Of logo asset in the downloadable source bundle

Still to migrate next:

- Groups / Manage Groups
- Reach Out (Text/iMessage + optional WhatsApp)
- Profile photo editing
- Remove / archive / reconnect
- Silent block / unblock UI
- Account/preferences screens
- Notification-tap deep links
