# thought of native setup

This folder is a complete Expo SDK 57 project connected to the existing Thought Of Supabase backend.

## Local / Expo development

```bash
cp .env.example .env
npm install
npm start
```

The development Supabase test-phone configuration can still be used while SMS verification is not ready for public release. Remove fixed test OTP entries before release.

## Native notifications

The source is already wired for Expo push registrations and the existing `send-thought-notification` Edge Function. Registration begins after this project has an EAS project ID. Remote push should be verified in an EAS development build or TestFlight build, not treated as an Expo Go test.

## TestFlight

The source includes `eas.json`. The remaining one-time setup is to connect this project to an Expo/EAS account and an Apple Developer/App Store Connect account. After that, a production iOS build can be created and submitted through EAS.

## Product constraints carried into native

- Thoughts are text-only and capped at 60 characters.
- We never import contacts.
- Add-someone responses stay generic and do not reveal whether a phone number is registered.
- No read receipts, typing indicator, public feed, follower counts, or app badge count.
- Rethink remains server-enforced at about 10 seconds.
