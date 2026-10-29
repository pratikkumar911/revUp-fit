import { auth } from './firebase';
import { sendPasswordResetEmail } from 'firebase/auth';

const baseUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, '');

export async function request(path, { method = 'GET', body } = {}) {
  if (!baseUrl) throw new Error('Set EXPO_PUBLIC_API_URL in frontend/.env before connecting to the API.');
  const token = await auth?.currentUser?.getIdToken();
  if (!token) throw new Error('Please sign in again to continue.');

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await response.text();
  let data = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`The API returned an invalid response (${response.status}).`);
    }
  }
  if (!response.ok) {
    const messages = {
      NO_PROFILE: 'Your account profile has not been set up yet. Please sign out and sign in again.',
      NO_TOKEN: 'Please sign in again to continue.',
      BAD_TOKEN: 'Your session has expired. Please sign in again.',
      FORBIDDEN: 'You do not have permission to do that.',
      NO_PLAN: 'There is no active plan for this user.',
      REAUTH_REQUIRED: 'Please re-enter your password and try again.',
    };
    const error = new Error(messages[data.error] || data.message || data.error || `API request failed (${response.status}).`);
    error.apiCode = data.error;
    throw error;
  }
  return data;
}

export function resetPassword(email) {
  if (!auth) throw new Error('Add your Firebase configuration to frontend/.env before using authentication.');
  return sendPasswordResetEmail(auth, email);
}
