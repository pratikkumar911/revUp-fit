# Diet Planner API (Express + Firebase)

Free app. Roles: `user` and `admin` (one dietitian). All data access goes through this API;
Firestore rules deny direct client access. No payments, no access periods.

## Setup
1. Create a Firebase project. Enable **Authentication > Email/Password**. Create **Firestore** in a Mumbai region (`asia-south1`) if offered (the location cannot be changed later).
2. Project settings > Service accounts > generate a key. Save as `serviceAccount.json` (never commit it).
3. `cp .env.example .env`, then `npm install` and `npm run dev`.
4. Deploy rules: `firebase deploy --only firestore:rules`.
5. Create the dietitian account (sign up in the app or Firebase console), then `node scripts/setAdmin.js dietitian@example.com`.
6. In Firestore add a **TTL policy** on `notifications.expiresAt` (keeps the 7-day history).
7. The first time the No Plan queue runs, Firestore prints links to create two composite indexes. Click each.

## Frontend
1. In `frontend/`, copy `.env.example` to `.env`.
2. Set `EXPO_PUBLIC_API_URL` to an API URL reachable by the device (use the computer's LAN IP instead of `localhost` on a physical phone).
3. Register a Firebase **Web app** in the same project and copy its public configuration into the `EXPO_PUBLIC_FIREBASE_*` variables. These are client configuration values, not service-account credentials.
4. Run `npm install` and `npm start` from `frontend/`.

## Flow
- App signs in with Firebase Auth and sends `Authorization: Bearer <ID token>`.
- `POST /me/init` -> `POST /me/consent` -> `PUT /me` (profile, 18+). Completing the profile puts the user in the dietitian's queue.
- Admin: `GET /admin/users?filter=none` (waiting for a plan, or plan ended), `POST /admin/templates`, `POST /admin/assignments` with `startDate` and `repeatDays`.
- The assigned week repeats from the start date for `repeatDays` days, then the plan ends.
- Admin on a user's ongoing plan: `GET`, `PUT` (meals, name, start date, repeat days) and `DELETE` on `/admin/users/:id/plan`. Delete sends the user back to the waiting queue.
- App: `GET /me/plan?date=YYYY-MM-DD` returns the requested day status and the assigned plan's meal pattern and progress.
- Chat: user `POST /queries`; admin `POST /admin/queries/:id/reply`.

## Notifications
Only two are sent: the dietitian replied, and a diet plan was assigned. Both are saved to a 7-day history.
Device tokens are saved with `POST /me/fcm-token` and removed on logout with `POST /me/fcm-token/remove`.

## Things to know
- Templates store 1 to 7 repeating meal-pattern days and may specify a separate `durationDays` value (1 to 365).
- Dates are `YYYY-MM-DD`, treated as UTC midnight.
- `DELETE /me` needs a login within the last 5 minutes (client re-enters the password first). It erases the profile, plans, chats and notifications, then the login.
- Host somewhere that does not sleep. Use HTTPS. Keep the service account in an environment variable or secret store.
- Free means anyone can sign up. Watch the dietitian's queue length and Firebase usage, and consider a sign-up cap or waitlist.

## Roles
- Role = the Firebase custom claim `role` (`admin`), set only by `scripts/setAdmin.js`. Sign-up always creates `user`; a role sent by the app is ignored.
- `/admin/*` needs the admin claim AND the account to still be an enabled admin (checked on every call).
- User routes (profile, plan, chat, delete account) are for `user` only, so an admin cannot use or delete their account through them.
- `GET /me` and the notification-token routes work for both roles.
- To remove an admin: clear the claim (`setCustomUserClaims(uid, null)`) and revoke their sessions (`auth.revokeRefreshTokens(uid)`).
