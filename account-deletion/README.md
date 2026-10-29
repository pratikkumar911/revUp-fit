# RevUp Fit account deletion page

This is a standalone React website for the Google Play account-deletion URL. It signs users in with the app's Firebase project, supports password-reset email, then asks users to re-enter their password before calling the existing authenticated `DELETE /me` API.

## Configure

1. Copy `.env.example` to `.env`.
2. Set the `VITE_FIREBASE_*` values to the same Firebase project used by the mobile app.
3. Set `VITE_API_URL` to the deployed backend base URL (without a trailing slash).
4. Add the deployed website's domain to Firebase Authentication's authorized domains.
5. Add the website's exact origin to the backend's `WEB_ORIGINS` environment variable. The backend must allow browser requests from the deployed site.
6. Configure Firebase Authentication's password-reset email template and sender before publishing.

Firebase web API keys are public client configuration, not server secrets. Never put Firebase Admin credentials or service-account files in this folder.

## Run locally

```sh
npm install
npm run dev
```

Set the local origin in Firebase authorized domains and the backend `WEB_ORIGINS` while testing the sign-in and deletion flow.

## Build and publish

```sh
npm run build
```

Publish the generated `dist` directory to a static web host and use its HTTPS URL as the Google Play account-deletion URL. The URL must remain publicly accessible.
