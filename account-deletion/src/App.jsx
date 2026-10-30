import React, { useEffect, useState } from 'react';
import {
  EmailAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from '@firebase/auth';
import { auth, firebaseConfigured } from './firebase.js';

const apiUrl = import.meta.env.VITE_API_URL?.replace(/\/+$/, '');

function getErrorMessage(error) {
  const messages = {
    'auth/invalid-credential': 'That email and password combination is not correct.',
    'auth/invalid-email': 'Enter a valid email address.',
    'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
    'auth/user-disabled': 'This account has been disabled. Contact support for help.',
    'auth/network-request-failed': 'Network error. Check your connection and try again.',
  };
  return messages[error.code] || error.message || 'Something went wrong. Please try again.';
}

async function deleteAccount(user, password) {
  if (!apiUrl) {
    throw new Error('The deletion service is not configured. Please try again later.');
  }
  if (!user.email) {
    throw new Error('This account does not have an email address for password verification.');
  }

  const credential = EmailAuthProvider.credential(user.email, password);
  await reauthenticateWithCredential(user, credential);
  const token = await user.getIdToken(true);
  const response = await fetch(`${apiUrl}/me`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  const text = await response.text();
  let data = {};

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`The deletion service returned an invalid response (${response.status}).`);
    }
  }

  if (!response.ok) {
    if (data.error === 'REAUTH_REQUIRED') {
      throw new Error('Please sign in again, then confirm your password to continue.');
    }
    throw new Error(data.message || data.error || `Could not delete the account (${response.status}).`);
  }
}

export default function App() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(!auth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mode, setMode] = useState('signin');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [deleted, setDeleted] = useState(false);

  useEffect(() => {
    if (!auth) return undefined;
    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setAuthReady(true);
    });
  }, []);

  const clearMessages = () => {
    setError('');
    setNotice('');
  };

  const handleSignIn = async (event) => {
    event.preventDefault();
    clearMessages();
    setBusy(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      setPassword('');
    } catch (signInError) {
      setError(getErrorMessage(signInError));
    } finally {
      setBusy(false);
    }
  };

  const handlePasswordReset = async (event) => {
    event.preventDefault();
    clearMessages();
    setBusy(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setResetSent(true);
    } catch (resetError) {
      setError(getErrorMessage(resetError));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (event) => {
    event.preventDefault();
    clearMessages();
    setBusy(true);
    try {
      await deleteAccount(user, confirmPassword);
      await signOut(auth);
      setDeleted(true);
    } catch (deleteError) {
      setError(getErrorMessage(deleteError));
    } finally {
      setBusy(false);
    }
  };

  const handleSignOut = async () => {
    clearMessages();
    try {
      await signOut(auth);
      setConfirmed(false);
    } catch (signOutError) {
      setError(getErrorMessage(signOutError));
    }
  };

  if (!firebaseConfigured) {
    return (
      <Page>
        <ConfigNotice />
      </Page>
    );
  }

  if (!authReady) {
    return (
      <Page>
        <p className="loading">Loading account…</p>
      </Page>
    );
  }

  if (deleted) {
    return (
      <Page>
        <div className="success-icon" aria-hidden="true">✓</div>
        <p className="eyebrow">Request complete</p>
        <h1>Your account has been deleted</h1>
        <p className="intro">Your RevUp Fit account and associated data have been permanently removed.</p>
      </Page>
    );
  }

  return (
    <Page>
      <h1>Delete your account</h1>
      <p className="intro">
        Sign in to securely request permanent deletion of your account and its data.
      </p>

      <div className="notice">
        <strong>This can’t be undone.</strong>
        <p>
          Deletion removes your profile and health details, plans and progress, notifications,
          and support conversations.
        </p>
      </div>

      {error && <p className="message error" role="alert">{error}</p>}
      {notice && <p className="message success" role="status">{notice}</p>}

      {!user && mode === 'signin' && (
        <form className="form" onSubmit={handleSignIn}>
          <label htmlFor="email">Email address</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          <button className="primary" type="submit" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
          <button
            className="text-button"
            type="button"
            onClick={() => { clearMessages(); setMode('reset'); setResetSent(false); }}
          >
            Forgot your password?
          </button>
        </form>
      )}

      {!user && mode === 'reset' && (
        <form className="form" onSubmit={handlePasswordReset}>
          {resetSent ? (
            <p className="reset-instructions" role="status">
              If an account exists for <strong>{email}</strong>, we’ve sent a password reset link.
              Follow it to set a new password, then return here to sign in.
            </p>
          ) : (
            <>
              <p className="helper">We’ll email you a secure link to set a new password.</p>
              <label htmlFor="reset-email">Email address</label>
              <input
                id="reset-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
              <button className="primary" type="submit" disabled={busy}>
                {busy ? 'Sending…' : 'Send reset link'}
              </button>
            </>
          )}
          <button
            className="text-button"
            type="button"
            onClick={() => { clearMessages(); setMode('signin'); }}
          >
            Back to sign in
          </button>
        </form>
      )}

      {user && (
        <form className="form" onSubmit={handleDelete}>
          <div className="signed-in">
            <span>Signed in as</span>
            <strong>{user.email}</strong>
            <button className="text-button" type="button" onClick={handleSignOut}>
              Not you? Sign out
            </button>
          </div>

          <label htmlFor="confirm-password">Enter your password to confirm</label>
          <input
            id="confirm-password"
            type="password"
            autoComplete="current-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
          />

          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
            />
            <span>I understand this permanently deletes my account and data.</span>
          </label>

          <button className="danger" type="submit" disabled={busy || !confirmed}>
            {busy ? 'Deleting account…' : 'Permanently delete account'}
          </button>
        </form>
      )}

      <footer>
        You can also request deletion in the app: <strong>Profile → Delete account</strong>.
      </footer>
    </Page>
  );
}

function ConfigNotice() {
  return (
    <>
      <h1>Account deletion</h1>
      <p className="intro">The deletion service is not configured yet.</p>
      <div className="notice">
        <strong>Setup required</strong>
        <p>
          Add the Firebase web app settings and API URL to this site’s environment variables
          before publishing it.
        </p>
      </div>
    </>
  );
}

function Page({ children }) {
  return (
    <main className="page">
      <article className="card">
        <img className="brand-logo" src="/revup-fit-logo.svg" alt="RevUp Fit" />
        {children}
      </article>
    </main>
  );
}
