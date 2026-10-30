import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  getIdTokenResult,
  onAuthStateChanged,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile as updateAuthProfile,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from './firebase';
import { request } from './api';
import { today } from './utils';

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);
const emptyDb = () => ({ users: [], templates: [], plans: [], queries: [], notifications: [] });

function asDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'number' || typeof value === 'string') {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const seconds = value.seconds ?? value._seconds;
  if (typeof seconds === 'number') return new Date(seconds * 1000);
  if (typeof value.toDate === 'function') return value.toDate();
  return null;
}

const dateKey = (value) => asDate(value)?.toISOString().slice(0, 10) || '';
const timestamp = (value) => asDate(value)?.getTime() || 0;
const listText = (text, list) => text || (Array.isArray(list) ? list.join(', ') : list || '');

function normalizeUser(user, role = user.role || 'user') {
  return {
    ...user,
    role,
    onboarded: !!(user.profileCompletedAt || user.onboarded),
    joined: dateKey(user.createdAt || user.joined) || today(),
    waitingSince: timestamp(user.waitingSince),
    planEndDate: dateKey(user.planEndDate),
    allergies: listText(user.allergiesText, user.allergies),
    dislikes: listText(user.dislikesText, user.dislikes),
    notifOn: user.notifOn !== false,
  };
}

function normalizePlan(plan) {
  return {
    ...plan,
    startDate: dateKey(plan.startDate),
    endDate: dateKey(plan.endDate),
    repeatDays: plan.repeatDays || 1,
    done: plan.progress || plan.done || {},
  };
}

function normalizeMessage(message) {
  return { ...message, at: timestamp(message.createdAt || message.at) };
}

function normalizeQuery(query, includeMessages = true) {
  return {
    ...query,
    lastAt: timestamp(query.lastMessageAt || query.lastAt),
    messages: includeMessages ? (query.messages || []).map(normalizeMessage) : [],
  };
}

function profilePayload(profile) {
  return {
    gender: profile.gender,
    age: Number(profile.age),
    heightCm: Number(profile.heightCm),
    weightKg: Number(profile.weightKg),
    diet: profile.diet,
    goal: (profile.goal || '').trim(),
    allergiesText: listText(profile.allergiesText, profile.allergies),
    dislikesText: listText(profile.dislikesText, profile.dislikes),
  };
}

function requireAuth() {
  if (!isFirebaseConfigured || !auth) throw new Error('Add your Firebase configuration to frontend/.env before using authentication.');
  return auth;
}

function authError(error) {
  const messages = {
    'auth/invalid-credential': 'Email or password is incorrect.',
    'auth/invalid-email': 'Enter a valid email address.',
    'auth/email-already-in-use': 'This email is already registered.',
    'auth/weak-password': 'Use a stronger password with at least 6 characters.',
    'auth/network-request-failed': 'Could not reach Firebase. Check your internet connection.',
  };
  return new Error(messages[error.code] || error.message || 'Authentication failed.');
}

export function AppProvider({ children }) {
  const [db, setDb] = useState(emptyDb);
  const [me, setMe] = useState(null);
  const [ready, setReady] = useState(!isFirebaseConfigured);
  const [error, setError] = useState('');
  const [planLoading, setPlanLoading] = useState(false);
  const [planError, setPlanError] = useState('');
  const accountLoads = useRef(new Map());
  const planLoads = useRef(new Map());

  const loadPlan = useCallback((user) => {
    const activeLoad = planLoads.current.get(user.uid);
    if (activeLoad) return activeLoad;
    if (auth?.currentUser?.uid !== user.uid) return Promise.resolve();

    setPlanLoading(true);
    setPlanError('');
    const load = request(`/me/plan?date=${today()}`)
      .then((planResult) => {
        if (auth?.currentUser?.uid !== user.uid) return;
        setDb((current) => ({
          ...current,
          plans: planResult.plan ? [normalizePlan(planResult.plan)] : [],
        }));
      })
      .catch((loadError) => {
        if (auth?.currentUser?.uid !== user.uid) return;
        setPlanError(loadError.message || 'Could not load your diet plan.');
        console.error('Could not load diet plan:', loadError);
      })
      .finally(() => {
        if (auth?.currentUser?.uid === user.uid) setPlanLoading(false);
        if (planLoads.current.get(user.uid) === load) planLoads.current.delete(user.uid);
      });

    planLoads.current.set(user.uid, load);
    return load;
  }, []);

  const loadAccount = useCallback((user) => {
    const activeLoad = accountLoads.current.get(user.uid);
    if (activeLoad) return activeLoad;

    const load = (async () => {
      const tokenResult = await getIdTokenResult(user);
      const role = tokenResult.claims.role === 'admin' ? 'admin' : 'user';
      let profile;
      try {
        profile = await request('/me');
      } catch (e) {
        if (e.apiCode !== 'NO_PROFILE' || role !== 'user') throw e;
        await request('/me/init', { method: 'POST', body: { name: user.displayName || user.email?.split('@')[0] || 'User' } });
        profile = await request('/me');
      }

      const currentUser = normalizeUser({
        ...profile,
        email: profile.email || user.email,
        name: profile.name || user.displayName || user.email?.split('@')[0] || 'User',
      }, role);
      setMe(currentUser);
      setDb(emptyDb());
      setError('');
      setReady(true);

      if (role === 'admin') {
        const users = await request('/admin/users?filter=all');
        if (auth?.currentUser?.uid !== user.uid) return;
        setDb((current) => ({ ...current, users: users.map((u) => normalizeUser(u, 'user')) }));

        Promise.all([
          request('/admin/plans'),
          request('/admin/templates'),
          request('/admin/queries'),
        ]).then(([plans, templates, queries]) => {
          if (auth?.currentUser?.uid !== user.uid) return;
          setDb((current) => ({
            ...current,
            plans: plans.map(normalizePlan),
            templates: templates.map((t) => ({ ...t, durationDays: t.durationDays || t.days.length })),
            queries: queries.map((q) => normalizeQuery(q, false)),
          }));
        }).catch((loadError) => {
          console.error('Could not load admin data:', loadError);
        });
        return;
      }

      loadPlan(user);

      Promise.all([request('/queries'), request('/me/notifications')])
        .then(([queries, notifications]) => {
          if (auth?.currentUser?.uid !== user.uid) return;
          setDb((current) => ({
            ...current,
            queries: queries.map((q) => normalizeQuery(q)),
            notifications: notifications.map((n) => ({ ...n, at: timestamp(n.createdAt) })),
          }));
        })
        .catch((loadError) => {
          console.error('Could not load messages and notifications:', loadError);
        });
    })();

    accountLoads.current.set(user.uid, load);
    load.then(
      () => {
        if (accountLoads.current.get(user.uid) === load) accountLoads.current.delete(user.uid);
      },
      () => {
        if (accountLoads.current.get(user.uid) === load) accountLoads.current.delete(user.uid);
      },
    );
    return load;
  }, [loadPlan]);

  const refresh = useCallback(async () => {
    const user = auth?.currentUser;
    if (!user) return;
    setError('');
    await loadAccount(user);
    if (me?.role !== 'admin') await loadPlan(user);
  }, [loadAccount, loadPlan, me?.role]);

  const retryPlan = useCallback(() => {
    const user = auth?.currentUser;
    return user ? loadPlan(user) : Promise.resolve();
  }, [loadPlan]);

  const loadQuery = useCallback(async (id) => {
    const query = await request(`/admin/queries/${encodeURIComponent(id)}`);
    const normalized = normalizeQuery(query);
    setDb((current) => ({
      ...current,
      queries: current.queries.map((q) => q.id === id ? normalized : q),
    }));
    return normalized;
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) return undefined;
    return onAuthStateChanged(auth, (user) => {
      setReady(false);
      setPlanLoading(false);
      setPlanError('');
      if (!user) {
        setMe(null);
        setDb(emptyDb());
        setError('');
        setReady(true);
        return;
      }
      loadAccount(user)
        .catch((e) => {
          setError(e.message || 'Could not load your account.');
          setMe(null);
        })
        .finally(() => setReady(true));
    });
  }, [loadAccount]);

  const actions = {
    ready, me, db, error, planLoading, planError, refresh, retryPlan,
    signIn: async (email, password) => {
      try {
        const result = await signInWithEmailAndPassword(requireAuth(), email.trim(), password);
        await loadAccount(result.user);
      } catch (e) {
        throw authError(e);
      }
    },
    signUp: async (name, email, password) => {
      try {
        const result = await createUserWithEmailAndPassword(requireAuth(), email.trim(), password);
        await updateAuthProfile(result.user, { displayName: name.trim() });
        await request('/me/init', { method: 'POST', body: { name: name.trim() } });
        await loadAccount(result.user);
      } catch (e) {
        if (e.code?.startsWith('auth/')) throw authError(e);
        throw e;
      }
    },
    signOut: async () => {
      await firebaseSignOut(requireAuth());
      setMe(null);
      setDb(emptyDb());
    },
    completeOnboarding: async (profile) => {
      await request('/me/consent', { method: 'POST', body: { version: '1.0' } });
      await request('/me', { method: 'PUT', body: profilePayload(profile) });
      await refresh();
    },
    updateProfile: async (patch) => {
      if (Object.prototype.hasOwnProperty.call(patch, 'notifOn')) {
        const previousNotifOn = me?.notifOn !== false;
        setMe((current) => current ? { ...current, notifOn: patch.notifOn } : current);
        try {
          await request('/me', { method: 'PATCH', body: { notifOn: patch.notifOn } });
        } catch (error) {
          setMe((current) => current ? { ...current, notifOn: previousNotifOn } : current);
          throw error;
        }
      } else {
        await request('/me', { method: 'PUT', body: profilePayload(patch) });
        await refresh();
      }
    },
    deleteAccount: async (password) => {
      const currentAuth = requireAuth();
      const user = currentAuth.currentUser;
      if (!user?.email) throw new Error('Please sign in again to delete your account.');
      await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password));
      await request('/me', { method: 'DELETE' });
      await firebaseSignOut(currentAuth);
      setMe(null);
      setDb(emptyDb());
    },
    toggleDone: async (planId, key) => {
      const plan = db.plans.find((p) => p.id === planId);
      if (!plan) return;
      const [date, meal, itemId] = key.split('|');
      const done = !plan.done[key];
      await request('/me/plan/progress', { method: 'POST', body: { date, meal, itemId, done } });
      setDb((current) => ({
        ...current,
        plans: current.plans.map((p) => p.id === planId ? { ...p, done: { ...p.done, [key]: done } } : p),
      }));
    },
    dismissNotification: async (id) => {
      await request(`/me/notifications/${encodeURIComponent(id)}`, { method: 'DELETE' });
      setDb((current) => ({ ...current, notifications: current.notifications.filter((n) => n.id !== id) }));
    },
    sendMessage: async (text) => {
      const open = db.queries.find((q) => q.status === 'open');
      if (open) {
        await request(`/queries/${encodeURIComponent(open.id)}/messages`, { method: 'POST', body: { text } });
      } else {
        await request('/queries', { method: 'POST', body: { text } });
      }
      await refresh();
    },
    replyQuery: async (id, text) => {
      await request(`/admin/queries/${encodeURIComponent(id)}/reply`, { method: 'POST', body: { text } });
      await refresh();
    },
    resolveQuery: async (id) => {
      await request(`/admin/queries/${encodeURIComponent(id)}/resolve`, { method: 'POST' });
      await refresh();
    },
    loadQuery,
    saveTemplate: async (template) => {
      const body = { name: template.name, days: template.days, durationDays: template.durationDays };
      await request(template.id ? `/admin/templates/${encodeURIComponent(template.id)}` : '/admin/templates', {
        method: template.id ? 'PUT' : 'POST',
        body,
      });
      await refresh();
    },
    deleteTemplate: async (id) => {
      await request(`/admin/templates/${encodeURIComponent(id)}`, { method: 'DELETE' });
      await refresh();
    },
    cloneTemplate: async (id) => {
      await request(`/admin/templates/${encodeURIComponent(id)}/clone`, { method: 'POST' });
      await refresh();
    },
    assignPlan: async ({ userId, templateId, startDate, repeatDays }) => {
      await request('/admin/assignments', { method: 'POST', body: { userId, templateId, startDate, repeatDays } });
      await refresh();
    },
    updateUserPlan: async (userId, patch) => {
      await request(`/admin/users/${encodeURIComponent(userId)}/plan`, { method: 'PUT', body: patch });
      await refresh();
    },
  };

  return <Ctx.Provider value={actions}>{children}</Ctx.Provider>;
}
