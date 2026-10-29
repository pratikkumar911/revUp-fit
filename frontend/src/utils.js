export const DAY = 864e5;
const p2 = (n) => String(n).padStart(2, '0');
export const key = (d) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
export const parse = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
export const today = () => key(new Date());
export const addDays = (k, n) => { const d = parse(k); d.setDate(d.getDate() + n); return key(d); };
export const diffDays = (a, b) => Math.round((parse(a) - parse(b)) / DAY);
export const WD = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const weekOf = (k) => { const dow = (parse(k).getDay() + 6) % 7; return Array.from({ length: 7 }, (_, i) => addDays(k, i - dow)); };
export const fmt = (k) => parse(k).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
export const isDateKey = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s) && key(parse(s)) === s;
export const ago = (ts) => {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? 'Yesterday' : `${d} days ago`;
};
export const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };
export const bmi = (h, w) => (h && w ? (w / (h / 100) ** 2).toFixed(1) : '-');
export const initial = (name) => (name || '?').trim().charAt(0).toUpperCase();

// Plan helpers. A plan repeats its days from startDate for repeatDays days.
export const planEnd = (plan) => addDays(plan.startDate, plan.repeatDays - 1);
export const planEnded = (plan) => !!plan && today() > planEnd(plan);
export function planState(plan, dateKey) {
  if (!plan) return { status: 'none' };
  if (dateKey > planEnd(plan)) return { status: 'ended', endedOn: planEnd(plan) };
  const diff = diffDays(dateKey, plan.startDate);
  if (diff < 0) return { status: 'upcoming' };
  const n = plan.days.length;
  return { status: 'active', index: ((diff % n) + n) % n };
}
export const planOf = (db, u) => db.plans.find((p) => p.id === u.currentPlanId) || null;
export const statusOf = (db, u) => { const p = planOf(db, u); return !p ? 'none' : planEnded(p) ? 'ended' : 'active'; };
export const STATUS_LABEL = { none: 'No plan', ended: 'Plan ended', active: 'Plan active' };
